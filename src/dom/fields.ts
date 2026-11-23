import type { LocalPoint } from "./geometry";
import type { CaretAt } from "./selection";

/*
 * Fields: what an attached element does to the cursor. Plain values with a
 * `sample` function; strengths are accelerations in px/s².
 *
 * Calibration against the AS2 toolkit (30 fps, cursor grip 50, inertia 10): an
 * AS2 force F per frame is an acceleration of 300·F px/s², and grip 50 is a
 * 50 ms velocity half-life. A default AS2 Hole (strength 3, U-shaped) pulls at
 * 540 px/s² at its rim; a default Ramp pushes at 900 px/s².
 */

/** How force varies from the centre (r = 0) to the edge (r = 1). */
export type Profile = "linear" | "constant" | "sine";

export interface FieldSample {
  /** Acceleration, px/s². */
  ax: number;
  ay: number;
  /** Control-display gain multiplier for mouse movement (also slows/speeds friction). */
  gain: number;
  /** Multiplier on all forces (dimmers). */
  forceScale: number;
  /** Multiplier on mouse movement only (dimmers with `mouse: true`). */
  mouseScale: number;
  /** The cursor is on the force-free centre of a hole/hill/gutter. */
  plateau: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface SampleContext {
  p: LocalPoint;
  /** Cursor position, viewport px. */
  x: number;
  y: number;
  /** Cursor velocity in px/s (mouse movement and forces together). */
  vx: number;
  vy: number;
  /** The force-driven part of the velocity, px/s (what friction and fields act on; excludes direct mouse movement). */
  forceV: Point;
  /** The (simulated) button is held. */
  pressed: boolean;
  /** Caret position under a point (text node or text control + offset), looking past the cursor's glass. */
  caretAt: CaretAt;
}

export interface Field {
  readonly kind: string;
  /** Impassable: the cursor slides around it instead of entering. */
  readonly wall?: boolean;
  /** CSS cursor to show while inside (default: the element's own CSS `cursor`). */
  readonly cursor?: string;
  /** Add this field's effect at a point to `out`. */
  sample?(ctx: SampleContext, out: FieldSample): void;
  /**
   * Relocate the cursor. Called after every step (wherever the cursor is) with
   * where it was, where it's going and its force-driven velocity (px/s). Return a
   * new destination, optionally with a new velocity, or nothing to leave it be.
   */
  warp?(el: Element, from: Point, to: Point, v: Point): (Point & { vx?: number; vy?: number }) | void;
  /** Called when the cursor enters / leaves (for stateful fields). */
  enter?(): void;
  leave?(): void;
}

const profile = (p: Profile, t: number) => (p === "linear" ? t : p === "constant" ? 1 : Math.sin(Math.PI * Math.min(1, t)));

interface RadialOptions {
  /** Peak acceleration in px/s². Default 540. */
  strength?: number;
  profile?: Profile;
  /** Radius (0..1) of the force-free centre. Default 0.2. */
  plateau?: number;
  cursor?: string;
}

function radial(kind: string, sign: 1 | -1, o: RadialOptions, gate: () => number = () => 1): Field {
  const strength = o.strength ?? 540;
  const shape = o.profile ?? "linear";
  const plateau = o.plateau ?? 0.2;
  return {
    kind,
    cursor: o.cursor,
    sample({ p }, out) {
      if (p.r <= plateau) {
        out.plateau = true;
        return;
      }
      // Direction in the element's normalised space, like the AS2 objects (which
      // computed it in their unscaled 100×100 local space).
      const a = sign * strength * gate() * profile(shape, Math.min(1, p.r));
      out.ax += (a * p.u) / p.r;
      out.ay += (a * p.v) / p.r;
    },
  };
}

/** Pulls the cursor towards the centre: an easy-to-reach spot. */
export const hole = (o: RadialOptions = {}): Field => radial("hole", -1, o);

/** Pushes the cursor away from the centre: a hard-to-reach spot. */
export const hill = (o: RadialOptions = {}): Field => radial("hill", 1, o);

/**
 * A hole that switches off once the cursor reaches its centre, so it is easy to
 * enter and easy to leave again (the thesis' target-acquisition aid).
 */
export function target(o: RadialOptions = {}): Field {
  let spent = false;
  const inner = radial("target", -1, { plateau: 0.15, ...o }, () => (spent ? 0 : 1));
  return {
    ...inner,
    sample(ctx, out) {
      inner.sample!(ctx, out);
      if (out.plateau) spent = true;
    },
    enter: () => (spent = false),
    leave: () => (spent = false),
  };
}

/** Pulls the cursor onto a centre line; optionally pushes it along the line. */
export function gutter(o: { strength?: number; profile?: Profile; plateau?: number; axis?: "x" | "y" | "auto"; push?: number; cursor?: string } = {}): Field {
  const strength = o.strength ?? 700;
  const shape = o.profile ?? "linear";
  const plateau = o.plateau ?? 0.1;
  return {
    kind: "gutter",
    cursor: o.cursor,
    sample({ p }, out) {
      const horizontal = o.axis === "x" || (o.axis !== "y" && p.width >= p.height);
      const t = horizontal ? p.v : p.u; // across the line, -1..1
      if (Math.abs(t) <= plateau) out.plateau = true;
      else {
        const a = -Math.sign(t) * strength * profile(shape, Math.abs(t));
        if (horizontal) out.ay += a;
        else out.ax += a;
      }
      if (o.push) {
        if (horizontal) out.ax += o.push;
        else out.ay += o.push;
      }
    },
  };
}

/** Constant acceleration ("wind", "gravity"). Angle in degrees clockwise from up. */
export function ramp(o: { strength?: number; angle?: number } = {}): Field {
  const s = o.strength ?? 900;
  const a = ((o.angle ?? 0) * Math.PI) / 180;
  return {
    kind: "ramp",
    sample(_ctx, out) {
      out.ax += s * Math.sin(a);
      out.ay -= s * Math.cos(a);
    },
  };
}

/** Low friction, high gain: the cursor slides over quickly (e.g. disabled items). */
export function slick(o: { gain?: number; cursor?: string } = {}): Field {
  const gain = o.gain ?? 2.5;
  return {
    kind: "slick",
    cursor: o.cursor,
    sample(_ctx, out) {
      out.gain *= gain;
    },
  };
}

/** High friction and a rough, random drag while moving: sand, mud, "are you sure?". */
export function sand(o: { gain?: number; roughness?: number; cursor?: string } = {}): Field {
  const gain = o.gain ?? 0.5;
  const rough = o.roughness ?? 3;
  return {
    kind: "sand",
    cursor: o.cursor,
    sample({ vx, vy }, out) {
      out.gain *= gain;
      // AS2 Sand: a force against the motion, randomly varying in strength.
      const k = 5 * rough * (Math.random() - 0.8);
      out.ax += k * vx;
      out.ay += k * vy;
    },
  };
}

/** Weakens other forces (factor 0 = off), or with `mouse: true`, the mouse itself. */
export function dimmer(o: { factor?: number; mouse?: boolean } = {}): Field {
  const f = o.factor ?? 0;
  return {
    kind: "dimmer",
    sample(_ctx, out) {
      if (o.mouse) out.mouseScale *= f;
      else out.forceScale *= f;
    },
  };
}

interface Line {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The rendered lines of an element's text, top to bottom. */
function textLines(el: Element, range: Range): Line[] {
  range.selectNodeContents(el);
  const lines: Line[] = [];
  for (const b of range.getClientRects()) {
    if (!b.width || !b.height) continue;
    const l = lines.find((l) => b.top < l.bottom && b.bottom > l.top && Math.min(b.bottom, l.bottom) - Math.max(b.top, l.top) > Math.min(b.height, l.bottom - l.top) / 2);
    if (l) {
      l.left = Math.min(l.left, b.left);
      l.right = Math.max(l.right, b.right);
      l.top = Math.min(l.top, b.top);
      l.bottom = Math.max(l.bottom, b.bottom);
    } else lines.push({ left: b.left, right: b.right, top: b.top, bottom: b.bottom });
  }
  return lines.sort((a, b) => a.top - b.top);
}

function nearestLine(lines: Line[], y: number): number {
  let best = 0;
  let bestD = Infinity;
  lines.forEach((l, i) => {
    const d = y < l.top ? l.top - y : y > l.bottom ? y - l.bottom : 0;
    if (d < bestD) [best, bestD] = [i, d];
  });
  return best;
}

interface Gap {
  l: number;
  r: number;
  space: boolean;
}

/**
 * For text: letters are ice and the spaces between words are sand, and each word
 * slopes gently down into the gaps either side of it. The cursor glides across
 * words and comes to rest between them, so selections tend to cover whole words.
 * Page text only, not text inputs.
 */
export function wordSnap(
  o: {
    /** Gain over letters. Default 2. */
    glide?: number;
    /** Gain in a gap. Default 0.3. */
    grip?: number;
    /** How close to a resting place (space or line end) the slope stops, px. Default 0. */
    zone?: number;
    /** Slope from a word down into the nearest gap, px/s² (weak enough that a slow drag isn't trapped). Default 250. */
    pull?: number;
    /** Only while the button is held (drag-selecting). Default false. */
    whileDragging?: boolean;
    /**
     * Treat the text as one long strip: moving past the end of a line comes out at
     * the start of the next (and vice versa), and the text's very start and end
     * stop you. Default false.
     */
    wrap?: boolean;
    /**
     * With `wrap`, how far past a line's end you can go before wrapping, px. Keep
     * it within the element (give it padding), or the cursor leaves instead. Default 10.
     */
    wrapMargin?: number;
  } = {},
): Field {
  const glide = o.glide ?? 2;
  const grip = o.grip ?? 0.3;
  const zone = o.zone ?? 0;
  const pull = o.pull ?? 250;
  const range = document.createRange();
  const margin = o.wrapMargin ?? 10;
  return {
    kind: "wordSnap",
    warp: o.wrap
      ? (el, from, to) => {
          const box = el.getBoundingClientRect();
          if (from.x < box.left || from.x > box.right || from.y < box.top || from.y > box.bottom) return;
          const lines = textLines(el, range);
          if (!lines.length) return;
          // The line we're on, if we're within its horizontal extent (plus margins).
          let i = nearestLine(lines, from.y);
          const line = lines[i];
          if (from.x < line.left - margin - 0.5 || from.x > line.right + margin + 0.5) return;
          const mid = (l: Line) => (l.top + l.bottom) / 2;
          let { x, y } = to;
          // Carry overflow through as many line ends as it crosses.
          for (let n = 0; n < lines.length; n++) {
            const l = lines[i];
            if (x > l.right + margin) {
              if (i === lines.length - 1) return { x: l.right + margin, y };
              const next = lines[++i];
              x = next.left - margin + (x - (l.right + margin));
              y += mid(next) - mid(l);
            } else if (x < l.left - margin) {
              if (i === 0) return { x: l.left - margin, y };
              const prev = lines[--i];
              x = prev.right + margin - (l.left - margin - x);
              y += mid(prev) - mid(l);
            } else break;
          }
          return { x, y };
        }
      : undefined,
    sample({ x, y, pressed, caretAt }, out) {
      if (o.whileDragging && !pressed) return;
      const c = caretAt(x, y);
      if (!c || c.node.nodeType !== Node.TEXT_NODE) return;
      const t = c.node as Text;
      const rect = (i: number) => {
        if (i < 0 || i >= t.length) return new DOMRect();
        range.setStart(t, i);
        range.setEnd(t, i + 1);
        return range.getBoundingClientRect();
      };
      const onLine = (b: DOMRect) => y >= b.top && y <= b.bottom;
      // Resting places either side of the cursor on this line, as x intervals: a
      // space, or the line's start/end (an open interval out into the margin).
      // Scan a few words each way; collapsed whitespace has an empty rect.
      const scan = (dir: -1 | 1): Gap | null => {
        let edge = x; // outermost letter edge seen so far on this line
        const first = rect(dir < 0 ? c.offset : c.offset - 1);
        if (first.width && onLine(first)) edge = dir < 0 ? first.left : first.right;
        for (let i = dir < 0 ? c.offset - 1 : c.offset, n = 0; n < 30; i += dir, n++) {
          if (i < 0 || i >= t.length) return dir < 0 ? { l: -Infinity, r: edge, space: false } : { l: edge, r: Infinity, space: false };
          const b = rect(i);
          if (!b.width) continue;
          if (!onLine(b)) return dir < 0 ? { l: -Infinity, r: edge, space: false } : { l: edge, r: Infinity, space: false };
          if (/\s/.test(t.data[i])) return { l: b.left, r: b.right, space: true };
          edge = dir < 0 ? b.left : b.right;
        }
        return null;
      };
      const dist = (g: Gap) => (x < g.l ? g.l - x : x > g.r ? g.r - x : 0);
      let gap: Gap | null = null;
      for (const g of [scan(-1), scan(1)]) if (g && (!gap || Math.abs(dist(g)) < Math.abs(dist(gap)))) gap = g;
      if (!gap) {
        out.gain *= glide;
        return;
      }
      // Slippery and sloping down towards the nearer resting place; sandy on a
      // space, nothing past a line's ends. (No force on a space itself, and no
      // slope through sand: either one traps slow drags.)
      const dx = dist(gap);
      if (Math.abs(dx) > zone) {
        out.gain *= glide;
        out.ax += pull * Math.sign(dx);
      } else if (gap.space) out.gain *= grip;
    },
  };
}

/** Impassable. */
export const wall = (): Field => ({ kind: "wall", wall: true });

export function emptySample(): FieldSample {
  return { ax: 0, ay: 0, gain: 1, forceScale: 1, mouseScale: 1, plateau: false };
}
