import type { Field } from "./fields";

/*
 * Rails: SVG shapes the cursor snaps onto and rides along. Get within `capture`
 * px of one and you're on it; then any movement that's at least partly along it
 * (`along`) carries you along it by its full length, so curves never throw you
 * off. Only pushing (nearly) straight across, `release` px of it, takes you off,
 * and that rail won't catch you again until you're `release` px clear of it
 * (others can catch you straight away). Open shapes
 * end (you carry on past the end); closed ones (circles, ellipses, rects,
 * polygons, paths ending in Z) loop.
 *
 * It's a position mapping (via `warp`), not a force, so it's crisp and stable.
 */

export interface RailsOptions {
  /** Snap onto a rail within this many px. Default 10. */
  capture?: number;
  /** Sideways push (px) to come off; also how far clear you must get before a rail catches you again. Default 24. */
  release?: number;
  /** Movement counts as travel if at least this fraction of it is along the rail. Default 0.25. */
  along?: number;
  /** Travel along a rail is icy: mouse movement counts this many times over. Default 2. */
  glide?: number;
  /** Rails are off where this returns true (e.g. over other controls, or while dragging). */
  off?: (x: number, y: number) => boolean;
  /** Called with the shape you get on, or null when you get off. */
  onRide?: (shape: SVGGeometryElement | null) => void;
}

interface Pt {
  x: number;
  y: number;
}

/** A shape sampled as a polyline in its own coordinates (cached until its geometry changes). */
interface Sampled {
  key: string;
  pts: Pt[];
  closed: boolean;
}

/** A shape's polyline in viewport px, with arc lengths. */
interface Track {
  el: SVGGeometryElement;
  pts: Pt[];
  cum: number[];
  closed: boolean;
}

const GEOMETRY_ATTRS = ["d", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"];

/**
 * Make the given SVG shapes rails. Attach the field to an element containing
 * them: rails act while the cursor is inside it. `shapes` is called every frame,
 * so it can return a changing set.
 */
export function rails(shapes: () => Iterable<SVGGeometryElement>, o: RailsOptions = {}): Field {
  const capture = o.capture ?? 10;
  const release = o.release ?? 24;
  const alongMin = o.along ?? 0.25;
  const glide = o.glide ?? 2;
  const cache = new WeakMap<SVGGeometryElement, Sampled>();

  const sample = (el: SVGGeometryElement): Sampled => {
    const key = el.tagName + GEOMETRY_ATTRS.map((a) => el.getAttribute(a) ?? "").join("|");
    const hit = cache.get(el);
    if (hit?.key === key) return hit;
    const len = el.getTotalLength();
    const n = Math.max(24, Math.ceil(len / 6));
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const p = el.getPointAtLength((len * i) / n);
      return { x: p.x, y: p.y };
    });
    const tag = el.tagName.toLowerCase();
    const closed =
      ["circle", "ellipse", "rect", "polygon"].includes(tag) ||
      (tag === "path" && /z\s*$/i.test(el.getAttribute("d") ?? "")) ||
      Math.hypot(pts[0].x - pts[n].x, pts[0].y - pts[n].y) < 0.5;
    if (closed) pts[n] = { ...pts[0] };
    const s = { key, pts, closed };
    cache.set(el, s);
    return s;
  };

  const track = (el: SVGGeometryElement): Track | null => {
    const m = el.getScreenCTM();
    if (!m) return null;
    const { pts, closed } = sample(el);
    const out = pts.map((p) => ({ x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f }));
    const cum = [0];
    for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y));
    return { el, pts: out, cum, closed };
  };

  const nearest = (t: Track, x: number, y: number) => {
    let best = { x: 0, y: 0, d: Infinity, s: 0 };
    for (let i = 1; i < t.pts.length; i++) {
      const a = t.pts[i - 1];
      const b = t.pts[i];
      const ex = b.x - a.x;
      const ey = b.y - a.y;
      const len = Math.hypot(ex, ey) || 1;
      const u = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / (len * len)));
      const px = a.x + u * ex;
      const py = a.y + u * ey;
      const d = Math.hypot(x - px, y - py);
      if (d < best.d) best = { x: px, y: py, d, s: t.cum[i - 1] + u * len };
    }
    return best;
  };

  /** Point and tangent at arc length s (wrapping on closed tracks). */
  const locate = (t: Track, s: number) => {
    const total = t.cum[t.cum.length - 1];
    if (t.closed) s = ((s % total) + total) % total;
    let i = 1;
    while (i < t.cum.length - 1 && t.cum[i] < s) i++;
    const a = t.pts[i - 1];
    const b = t.pts[i];
    const len = t.cum[i] - t.cum[i - 1] || 1;
    const u = Math.max(0, Math.min(1, (s - t.cum[i - 1]) / len));
    return { x: a.x + u * (b.x - a.x), y: a.y + u * (b.y - a.y), tx: (b.x - a.x) / len, ty: (b.y - a.y) / len };
  };

  let on: { el: SVGGeometryElement; s: number; push: Pt } | null = null;
  /** The rail we last came off sideways: it won't catch us again until we're `release` px clear of it. */
  let cooling: SVGGeometryElement | null = null;
  /** Where we last put the cursor: if it's been moved since (teleported), let go. */
  let shown: Pt | null = null;
  const show = (p: Pt) => (shown = p);
  const ride = (next: typeof on) => {
    if ((next?.el ?? null) !== (on?.el ?? null)) o.onRide?.(next?.el ?? null);
    on = next;
  };

  return {
    kind: "rails",
    warp(host, from, to) {
      const r = host.getBoundingClientRect();
      if (to.x < r.left || to.x > r.right || to.y < r.top || to.y > r.bottom || o.off?.(to.x, to.y)) {
        if (on || shown) ride(null);
        shown = null;
        cooling = null;
        return;
      }
      if (shown && Math.hypot(from.x - shown.x, from.y - shown.y) > 0.5) ride(null);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);

      const cur = on && track(on.el);
      if (on && cur) {
        const here = locate(cur, on.s);
        const along = dx * here.tx + dy * here.ty;
        if (len > 0 && Math.abs(along) >= alongMin * len) {
          // Travel: the whole movement goes along the rail.
          on.s += Math.sign(along) * len * glide;
          on.push = { x: on.push.x * 0.8, y: on.push.y * 0.8 };
          const total = cur.cum[cur.cum.length - 1];
          if (!cur.closed && (on.s < 0 || on.s > total)) {
            // Ran off an end: carry straight on past it.
            const atStart = on.s < 0;
            const end = locate(cur, atStart ? 0 : total);
            const over = atStart ? -on.s : on.s - total;
            const dir = atStart ? -1 : 1;
            ride(null);
            return show({ x: end.x + dir * end.tx * over, y: end.y + dir * end.ty * over });
          }
        } else {
          // Pushing across: build up, and come off once it's enough.
          on.push = { x: on.push.x + dx, y: on.push.y + dy };
          if (Math.hypot(on.push.x, on.push.y) > release) {
            const off = { x: here.x + on.push.x, y: here.y + on.push.y };
            cooling = on.el;
            ride(null);
            return show(off);
          }
        }
        return show(locate(cur, on.s));
      }
      if (on) ride(null); // its shape went away

      // Free: snap onto the nearest rail within reach (other than one we've just left).
      let near: { el: SVGGeometryElement; x: number; y: number; d: number; s: number } | null = null;
      for (const el of shapes()) {
        const t = track(el);
        if (!t) continue;
        const p = nearest(t, to.x, to.y);
        if (el === cooling) {
          if (p.d > release) cooling = null;
          continue;
        }
        if (!near || p.d < near.d) near = { el, ...p };
      }
      if (near && near.d <= capture) {
        ride({ el: near.el, s: near.s, push: { x: 0, y: 0 } });
        return show({ x: near.x, y: near.y });
      }
      return show({ ...to });
    },
  };
}
