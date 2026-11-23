import { emptySample, type Field, type FieldSample } from "./fields";
import { Geometry, type ShapeKind } from "./geometry";
import { TextSelector, type Caret } from "./selection";

/*
 * PowerCursor, DOM-first. The page gets a simulated cursor driven by real mouse
 * movement plus the forces of fields attached to elements. A transparent "glass"
 * layer catches the real pointer, so the page only sees (synthetic) events at the
 * simulated cursor's position.
 *
 * Browsers can't move the real pointer or create trusted input, so events are
 * synthetic (isTrusted = false): :hover / :active don't apply; style
 * [data-pc-hover] / [data-pc-active] instead. Clicks, focus, checkboxes, links
 * and form submission work, and text selection is simulated (see selection.ts);
 * drag-and-drop and scrollbars don't.
 */

export type InputMode = "lock" | "free";

export interface PowerCursorOptions {
  /**
   * "lock" (default): Pointer Lock; the user opts in with `engage()` (e.g. from a
   * button) and leaves with Esc. "free": the real cursor is hidden and followed,
   * as in the Flash original.
   */
  input?: InputMode;
  /** Velocity half-life of the force-driven motion, ms. Default 50 (AS2 grip 50). */
  frictionHalfLife?: number;
  /** Ignore forces while the mouse moves faster than this, px/s. Default 1500. */
  speedLimit?: number;
  /** Dispatch pointer/mouse events and click/focus at the simulated cursor. Default true. */
  events?: boolean;
  /**
   * The cursor scrolls with the page: it stays over the same content, and a
   * scroll that would carry it off screen stops at the edge. Default false.
   */
  scrollWithPage?: boolean;
}

export interface AttachOptions {
  shape?: ShapeKind;
  onEnter?: (el: Element) => void;
  onLeave?: (el: Element) => void;
}

interface Attachment {
  el: Element;
  field: Field;
  opts: AttachOptions;
  inside: boolean;
  geom: Geometry | null;
}

const inkBoxes = new Map<string, { left: number; top: number; right: number; bottom: number } | null>();

/**
 * The box (CSS px, relative to the image) around an image's non-transparent
 * pixels, measured once per image source. Undefined until the image has loaded.
 */
function inkBox(img: HTMLImageElement) {
  if (!img.complete || !img.naturalWidth) return undefined;
  if (inkBoxes.has(img.src)) return inkBoxes.get(img.src)!;
  const scale = 4;
  const w = Math.ceil(img.offsetWidth * scale);
  const h = Math.ceil(img.offsetHeight * scale);
  let box: { left: number; top: number; right: number; bottom: number } | null = null;
  try {
    const ctx = Object.assign(document.createElement("canvas"), { width: w, height: h }).getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const a = ctx.getImageData(0, 0, w, h).data;
    let [l, t, r, b] = [w, h, -1, -1];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (a[(y * w + x) * 4 + 3] > 24) [l, t, r, b] = [Math.min(l, x), Math.min(t, y), Math.max(r, x), Math.max(b, y)];
    if (r >= 0) box = { left: l / scale, top: t / scale, right: (r + 1) / scale, bottom: (b + 1) / scale };
  } catch {
    // e.g. a cross-origin image: fall back to the whole image
  }
  inkBoxes.set(img.src, box);
  return box;
}

export class PowerCursor {
  readonly input: InputMode;
  /** Simulated cursor position (viewport px). */
  x = innerWidth / 2;
  y = innerHeight / 2;
  /** Force-driven velocity (px/s), excluding direct mouse movement. */
  vx = 0;
  vy = 0;
  /** True while the simulated cursor is in control. */
  active = false;

  private frictionHalfLife: number;
  private speedLimit: number;
  private events: boolean;
  /** See PowerCursorOptions.scrollWithPage; can be changed at any time. */
  scrollWithPage: boolean;
  /** The page's scroll position as of the last scroll we accounted for. */
  private pageScroll = { x: scrollX, y: scrollY };
  private attachments: Attachment[] = [];
  private pending = { x: 0, y: 0 };
  private speedHistory: { d: number; dt: number }[] = [];
  private lastReal: { x: number; y: number } | null = null;
  private raf = 0;
  private last = 0;
  private glass: HTMLDivElement;
  private cursorEl: HTMLDivElement;
  private cursorImg: HTMLImageElement;
  private hoverChain: Element[] = [];
  private pressTarget: Element | null = null;
  private selector = new TextSelector((x, y) => this.caretAt(x, y));
  /** Click count for the current press (1, 2, 3), like MouseEvent.detail. */
  private clicks = 0;
  private lastPress = { t: -Infinity, x: 0, y: 0 };
  private mods: Pick<MouseEventInit, "shiftKey" | "ctrlKey" | "altKey" | "metaKey"> = {};
  private cleanup: (() => void)[] = [];
  /** Total cursor velocity last frame (mouse + forces), px/s. */
  private totalV = { x: 0, y: 0 };

  constructor(opts: PowerCursorOptions = {}) {
    this.input = opts.input ?? "lock";
    this.frictionHalfLife = opts.frictionHalfLife ?? 50;
    this.speedLimit = opts.speedLimit ?? 1500;
    this.events = opts.events ?? true;
    this.scrollWithPage = opts.scrollWithPage ?? false;

    this.glass = document.createElement("div");
    this.glass.className = "pc-glass";
    this.glass.style.cssText = "position:fixed;inset:0;z-index:2147483646;cursor:none;display:none;";
    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "pc-sim-cursor";
    // A popover, so it can sit in the top layer above modal dialogs (see raiseCursor).
    this.cursorEl.popover = "manual";
    this.cursorEl.style.cssText =
      "position:fixed;inset:auto;left:0;top:0;margin:0;padding:0;border:0;background:none;overflow:visible;width:1px;height:1px;z-index:2147483647;pointer-events:none;display:none;will-change:transform;";
    this.cursorImg = document.createElement("img");
    this.cursorImg.style.cssText = "position:absolute;image-rendering:pixelated;";
    this.cursorEl.appendChild(this.cursorImg);
    document.body.append(this.glass, this.cursorEl);
    // Hide the real cursor while simulating. The glass covers the page, but not
    // top-layer content (modal dialogs, popovers), which the real pointer can reach.
    // Only those get cursor:none, so everything else keeps its computed cursor for
    // the simulated icon (see cssCursor).
    const style = document.createElement("style");
    style.textContent =
      "html.pc-active :is(:modal, :popover-open, :modal *, :popover-open *), html.pc-active ::backdrop { cursor: none !important; }";
    document.head.appendChild(style);
    this.cleanup.push(() => style.remove());
    this.setIcon("default");
    this.bindInput();
    if (this.input === "free") this.setActive(true);
    this.raf = requestAnimationFrame(this.tick);
  }

  /** Give an element a field. Returns a function that removes it. */
  attach(el: Element, field: Field, opts: AttachOptions = {}): () => void {
    const a: Attachment = { el, field, opts, inside: false, geom: null };
    this.attachments.push(a);
    return () => {
      this.attachments = this.attachments.filter((x) => x !== a);
      if (a.inside) this.leave(a);
    };
  }

  /** Take the cursor (pointer-lock mode). Call from a user gesture, e.g. a click. */
  engage(at?: { x: number; y: number }) {
    if (at) this.moveTo(at.x, at.y);
    else if (this.lastReal) this.moveTo(this.lastReal.x, this.lastReal.y);
    void this.glass.requestPointerLock?.();
    this.glass.style.display = "block";
  }

  release() {
    if (document.pointerLockElement === this.glass) document.exitPointerLock();
  }

  moveTo(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = this.vy = 0;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.release();
    this.updateHover(null);
    this.cleanup.forEach((f) => f());
    this.glass.remove();
    this.cursorEl.remove();
  }

  // ---------------------------------------------------------------------------

  private setActive(on: boolean) {
    this.active = on;
    document.documentElement.classList.toggle("pc-active", on);
    this.glass.style.display = on ? "block" : "none";
    this.cursorEl.style.display = on ? "block" : "none";
    this.topLayerCount = -1;
    if (!on) {
      this.updateHover(null);
      for (const a of this.attachments) if (a.inside) this.leave(a);
    }
  }

  private tick = (t: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.1, Math.max(0.001, (t - (this.last || t)) / 1000));
    this.last = t;
    if (this.active) this.step(dt);
  };

  private step(dt: number) {
    const mx = this.pending.x;
    const my = this.pending.y;
    this.pending = { x: 0, y: 0 };

    // Mouse speed over the last ~150 ms, for the speed limit.
    this.speedHistory.push({ d: Math.hypot(mx, my), dt });
    let d = 0;
    let tt = 0;
    for (let i = this.speedHistory.length - 1; i >= 0 && tt < 0.15; i--) {
      d += this.speedHistory[i].d;
      tt += this.speedHistory[i].dt;
    }
    if (this.speedHistory.length > 120) this.speedHistory.splice(0, 60);
    const mouseSpeed = tt ? d / tt : 0;

    // Sample every field under the cursor.
    const s: FieldSample = emptySample();
    const walls: Geometry[] = [];
    for (const a of this.attachments) {
      if (!a.el.isConnected) continue;
      a.geom = new Geometry(a.el, a.opts.shape ?? "auto");
      if (a.field.wall) {
        walls.push(a.geom);
        continue;
      }
      const hit = a.geom.contains(this.x, this.y);
      if (hit && !a.inside) this.enter(a);
      else if (!hit && a.inside) this.leave(a);
      if (!hit) continue;
      // Per-field: target() reads this after its own sample to tell it reached the centre.
      s.plateau = false;
      a.field.sample?.(
        {
          p: a.geom.local(this.x, this.y),
          x: this.x,
          y: this.y,
          vx: this.totalV.x,
          vy: this.totalV.y,
          forceV: { x: this.vx, y: this.vy },
          pressed: !!this.pressTarget,
          caretAt: this.caretAt,
        },
        s,
      );
    }

    // Integrate: forces drive a decaying velocity; the mouse moves the cursor directly.
    const lambda = Math.LN2 / (this.frictionHalfLife / 1000) / s.gain;
    // Forces integrate in steps of at most 20 ms: after a stalled frame, a stiff
    // field (e.g. a strong trough) would otherwise overshoot and fling the cursor.
    // Mouse movement is applied directly and isn't affected.
    const fdt = Math.min(dt, 0.02);
    const decay = Math.exp(-lambda * fdt);
    const forcesOn = mouseSpeed <= this.speedLimit;
    const ax = forcesOn ? s.ax * s.forceScale : 0;
    const ay = forcesOn ? s.ay * s.forceScale : 0;
    this.vx = this.vx * decay + ax * fdt;
    this.vy = this.vy * decay + ay * fdt;
    let dx = mx * s.gain * s.mouseScale + (forcesOn ? this.vx * fdt : 0);
    let dy = my * s.gain * s.mouseScale + (forcesOn ? this.vy * fdt : 0);

    if (walls.length) [dx, dy] = this.resolveWalls(walls, dx, dy);

    const before = { x: this.x, y: this.y };
    let to = { x: this.x + dx, y: this.y + dy };
    // Fields may relocate the cursor (e.g. wordSnap's line wrapping, tubes).
    for (const a of this.attachments) {
      if (!a.field.warp || !a.el.isConnected) continue;
      const w = a.field.warp(a.el, { x: this.x, y: this.y }, to, { x: this.vx, y: this.vy });
      if (!w) continue;
      to = { x: w.x, y: w.y };
      if (w.vx !== undefined) this.vx = w.vx;
      if (w.vy !== undefined) this.vy = w.vy;
    }
    this.x = Math.min(innerWidth - 1, Math.max(0, to.x));
    this.y = Math.min(innerHeight - 1, Math.max(0, to.y));
    this.totalV = { x: dx / dt, y: dy / dt };
    this.cursorEl.style.transform = `translate(${this.x}px,${this.y}px)`;
    this.raiseCursor();

    if (this.events) {
      // pointermove whenever the simulated pointer moved, by the mouse or by forces.
      const moved = this.x !== before.x || this.y !== before.y;
      this.updateHover(this.elementAt(this.x, this.y), moved);
      // Drag-selecting (every frame, so an input keeps scrolling while held past its edge).
      if (this.pressTarget) this.selector.drag(this.x, this.y);
    }
  }

  private topLayerCount = -1;
  /** Keep the cursor above modal dialogs and popovers: re-enter the top layer after them. */
  private raiseCursor() {
    const n = document.querySelectorAll(":modal, :popover-open").length;
    if (n === this.topLayerCount) return;
    if (this.cursorEl.matches(":popover-open")) this.cursorEl.hidePopover();
    this.cursorEl.showPopover();
    this.topLayerCount = document.querySelectorAll(":modal, :popover-open").length;
  }

  /**
   * Like AS2: if the move ends on a wall, try shorter moves rotated up to ±90°
   * so the cursor slides along it. Unlike AS2, the path is swept, so fast moves
   * can't jump thin walls.
   */
  private resolveWalls(walls: Geometry[], dx: number, dy: number): [number, number] {
    // A wall the cursor is already inside (it was dropped there, or the wall moved
    // onto it) doesn't hold it: let it move out, then the wall works as usual.
    walls = walls.filter((w) => !w.contains(this.x, this.y));
    const blocked = (tx: number, ty: number) => {
      const n = Math.max(1, Math.ceil(Math.hypot(tx, ty) / 3));
      for (let i = 1; i <= n; i++) {
        const px = this.x + (tx * i) / n;
        const py = this.y + (ty * i) / n;
        if (walls.some((w) => w.contains(px, py))) return true;
      }
      return false;
    };
    if (!blocked(dx, dy)) return [dx, dy];
    this.vx = this.vy = 0;
    for (let step = 9; step >= 0; step--) {
      const m = Math.sqrt(step / 10);
      for (const sign of [1, -1]) {
        const ang = sign * ((10 - step) / 10) * (Math.PI / 2);
        const tx = Math.cos(ang) * dx * m + Math.sin(ang) * dy * m;
        const ty = Math.cos(ang) * dy * m - Math.sin(ang) * dx * m;
        if (!blocked(tx, ty)) return [tx, ty];
      }
    }
    return [0, 0];
  }

  private enter(a: Attachment) {
    a.inside = true;
    a.field.enter?.();
    a.opts.onEnter?.(a.el);
    a.el.dispatchEvent(new CustomEvent("pc:enter", { bubbles: true }));
  }

  private leave(a: Attachment) {
    a.inside = false;
    a.field.leave?.();
    a.opts.onLeave?.(a.el);
    a.el.dispatchEvent(new CustomEvent("pc:leave", { bubbles: true }));
  }

  // ---------------------------------------------------------------------------
  // Synthetic pointer events

  private elementAt(x: number, y: number): Element | null {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el === this.glass || el === this.cursorEl || this.cursorEl.contains(el)) continue;
      return el;
    }
    return null;
  }

  private init(x = this.x, y = this.y): MouseEventInit & PointerEventInit {
    return { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, view: window, pointerId: 1, pointerType: "mouse", isPrimary: true, ...this.mods };
  }

  /**
   * Dispatch a synthetic mouse/pointer event at the simulated cursor. Its
   * coordinates are pinned as own properties: under pointer lock, Firefox reports
   * the lock point as every mouse event's clientX/clientY, even for events
   * created with explicit coordinates.
   */
  private fire(target: Element, Ctor: typeof MouseEvent | typeof PointerEvent, type: string, extra: MouseEventInit & PointerEventInit = {}): boolean {
    const ev = new Ctor(type, { ...this.init(), ...extra });
    const { x, y } = this;
    const r = target.getBoundingClientRect();
    const coords = { clientX: x, clientY: y, x, y, pageX: x + scrollX, pageY: y + scrollY, offsetX: x - r.left - target.clientLeft, offsetY: y - r.top - target.clientTop };
    for (const [k, v] of Object.entries(coords)) Object.defineProperty(ev, k, { value: v });
    return target.dispatchEvent(ev);
  }

  private updateHover(target: Element | null, moved = false) {
    const chain: Element[] = [];
    for (let e = target; e; e = e.parentElement) chain.push(e);
    const prev = this.hoverChain;
    const prevTarget = prev[0] ?? null;
    if (target !== prevTarget) {
      if (prevTarget) {
        this.fire(prevTarget, PointerEvent, "pointerout", { relatedTarget: target });
        this.fire(prevTarget, MouseEvent, "mouseout", { relatedTarget: target });
      }
      for (const e of prev) {
        if (chain.includes(e)) continue;
        e.removeAttribute("data-pc-hover");
        this.fire(e, PointerEvent, "pointerleave", { bubbles: false, relatedTarget: target });
        this.fire(e, MouseEvent, "mouseleave", { bubbles: false, relatedTarget: target });
      }
      if (target) {
        this.fire(target, PointerEvent, "pointerover", { relatedTarget: prevTarget });
        this.fire(target, MouseEvent, "mouseover", { relatedTarget: prevTarget });
      }
      for (const e of [...chain].reverse()) {
        if (prev.includes(e)) continue;
        e.setAttribute("data-pc-hover", "");
        this.fire(e, PointerEvent, "pointerenter", { bubbles: false, relatedTarget: prevTarget });
        this.fire(e, MouseEvent, "mouseenter", { bubbles: false, relatedTarget: prevTarget });
      }
      this.hoverChain = chain;
    }
    // Re-resolved on every move: an `auto` cursor depends on whether we're over text.
    if (target !== prevTarget || moved) this.setIcon(target ? this.cssCursor(target) : "default");
    if (moved && target) {
      this.fire(target, PointerEvent, "pointermove");
      this.fire(target, MouseEvent, "mousemove");
    }
  }

  private cssCursor(el: Element): string {
    const inside = this.attachments.find((a) => a.inside && a.field.cursor);
    if (inside) return inside.field.cursor!;
    let c = getComputedStyle(el).cursor;
    if (c === "none" && el.closest(":modal, :popover-open")) {
      // Our own rule hides it in the top layer; peek underneath.
      const html = document.documentElement;
      html.classList.remove("pc-active");
      c = getComputedStyle(el).cursor;
      html.classList.add("pc-active");
    }
    if (c !== "auto") return c;
    if (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !["button", "submit", "reset", "checkbox", "radio", "range", "color", "file"].includes(el.type)) || (el as HTMLElement).isContentEditable)
      return "text";
    if (getComputedStyle(el).userSelect !== "none" && !el.closest("button, select, a[href]") && this.overText(this.x, this.y)) return "text";
    return "default";
  }

  /** Is the point over a character of selectable text (where browsers show an I-beam)? */
  private overText(x: number, y: number): boolean {
    const c = this.caretAt(x, y);
    if (!c || c.node.nodeType !== Node.TEXT_NODE) return false;
    const text = c.node as Text;
    const r = document.createRange();
    for (const o of [c.offset - 1, c.offset]) {
      if (o < 0 || o >= text.length || /\s/.test(text.data[o])) continue;
      r.setStart(text, o);
      r.setEnd(text, o + 1);
      for (const b of r.getClientRects()) if (x >= b.left - 1 && x <= b.right + 1 && y >= b.top && y <= b.bottom) return true;
    }
    return false;
  }

  private icon = "";
  private setIcon(css: string) {
    const kind = css.split(",").pop()!.trim();
    if (kind === this.icon) return;
    this.icon = kind;
    const icons: Record<string, [string, number, number]> = {
      default: ["Arrow", 5.65, 5],
      pointer: ["Finger", 5.65, 5],
      grab: ["Hand", 5.65, 5],
      grabbing: ["GrabHand", 5.65, 5],
      "not-allowed": ["Arrow", 5.65, 5],
    };
    if (kind === "text") {
      this.cursorImg.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="9" height="18"><path d="M1 1h7M4.5 1v16M1 17h7" stroke="white" stroke-width="3"/><path d="M1 1h7M4.5 1v16M1 17h7" stroke="black" stroke-width="1"/></svg>')}`;
      this.cursorImg.style.left = "-4.5px";
      this.cursorImg.style.top = "-9px";
      return;
    }
    const [name, rx, ry] = icons[kind] ?? icons.default;
    this.cursorImg.src = import.meta.env.BASE_URL + `lib/cursor/${name}.svg`;
    this.cursorImg.style.left = `${-rx}px`;
    this.cursorImg.style.top = `${-ry}px`;
  }

  /** Caret position under a point, looking through the glass. */
  readonly caretAt = (x: number, y: number): Caret | null => {
    this.glass.style.pointerEvents = "none";
    try {
      const c = document.caretPositionFromPoint?.(x, y);
      if (c) return { node: c.offsetNode, offset: c.offset };
      const r = document.caretRangeFromPoint?.(x, y);
      return r ? { node: r.startContainer, offset: r.startOffset } : null;
    } finally {
      this.glass.style.pointerEvents = "";
    }
  };

  private press() {
    const target = this.hoverChain[0];
    if (!target) return;
    this.pressTarget = target;
    // Multi-click: within 500 ms and 5 px of the last press.
    const now = performance.now();
    const near = Math.hypot(this.x - this.lastPress.x, this.y - this.lastPress.y) < 5;
    this.clicks = now - this.lastPress.t < 500 && near ? (this.clicks % 3) + 1 : 1;
    this.lastPress = { t: now, x: this.x, y: this.y };
    this.fire(target, PointerEvent, "pointerdown", { button: 0, buttons: 1, detail: this.clicks });
    const ok = this.fire(target, MouseEvent, "mousedown", { button: 0, buttons: 1, detail: this.clicks });
    for (const e of this.hoverChain) e.setAttribute("data-pc-active", "");
    if (ok) {
      // Focus moves on press, like a real click.
      const focusable = target.closest<HTMLElement>("input, textarea, select, button, a[href], [tabindex], [contenteditable]");
      if (focusable) focusable.focus();
      else (document.activeElement as HTMLElement | null)?.blur?.();
      this.selector.press(this.x, this.y, target, this.clicks, !!this.mods.shiftKey);
    }
  }

  private releasePress() {
    const target = this.hoverChain[0];
    document.querySelectorAll("[data-pc-active]").forEach((e) => e.removeAttribute("data-pc-active"));
    this.selector.release();
    if (!target) return;
    this.fire(target, PointerEvent, "pointerup", { button: 0, buttons: 0, detail: this.clicks });
    this.fire(target, MouseEvent, "mouseup", { button: 0, buttons: 0, detail: this.clicks });
    const down = this.pressTarget;
    this.pressTarget = null;
    if (!down) return;
    // Click goes to the nearest common ancestor of press and release targets.
    let common: Element | null = target;
    while (common && !common.contains(down)) common = common.parentElement;
    if (!common) return;
    const clickable = common;
    if (clickable instanceof HTMLSelectElement) {
      try {
        clickable.showPicker();
      } catch {
        /* needs a fresh user gesture */
      }
    }
    // Untrusted clicks still run activation behaviour: links, buttons, checkboxes, labels, submit.
    this.fire(clickable, MouseEvent, "click", { button: 0, detail: this.clicks });
    if (this.clicks === 2) this.fire(clickable, MouseEvent, "dblclick", { button: 0, detail: 2 });
  }

  /** Replay a (real) wheel at the simulated cursor: scroll what's under it. */
  private scroll(e: WheelEvent) {
    // Firefox usually reports wheel deltas in lines, not pixels.
    const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? innerHeight * 0.9 : 1;
    this.scrollAtCursor(e.deltaX * unit, e.deltaY * unit);
  }

  /**
   * With scrollWithPage, scroll keys are handled here (clamped like the wheel):
   * the browser animates key scrolls, which can't be stopped at the edge after the fact.
   */
  private scrollKey(e: KeyboardEvent): boolean {
    if (!this.scrollWithPage || !this.active || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return false;
    const t = e.target as Element;
    if (t instanceof Element && (t.closest("input, textarea, select, [contenteditable]") || (e.key === " " && t.closest("button, a[href], summary")))) return false;
    const page = innerHeight * 0.875;
    const d: Record<string, [number, number]> = {
      PageDown: [0, page],
      PageUp: [0, -page],
      " ": [0, e.shiftKey ? -page : page],
      ArrowDown: [0, 40],
      ArrowUp: [0, -40],
      ArrowRight: [40, 0],
      ArrowLeft: [-40, 0],
      Home: [0, -Infinity],
      End: [0, Infinity],
    };
    if (!(e.key in d)) return false;
    e.preventDefault();
    this.scrollAtCursor(...d[e.key]);
    return true;
  }

  /**
   * Where the cursor's tip can be with the whole cursor image on screen (for
   * scrollWithPage). The image sits around the tip, offset by its hotspot.
   */
  private inView() {
    const img = this.cursorImg;
    // The drawn part of the icon (images can have transparent padding), else the whole image.
    const ink = inkBox(img) ?? { left: 0, top: 0, right: img.offsetWidth, bottom: img.offsetHeight };
    return {
      minX: Math.max(0, -(img.offsetLeft + ink.left)),
      maxX: innerWidth - Math.max(1, img.offsetLeft + ink.right),
      minY: Math.max(0, -(img.offsetTop + ink.top)),
      maxY: innerHeight - Math.max(1, img.offsetTop + ink.bottom),
    };
  }

  /** How far content may scroll (dx, dy) carrying the cursor: not taking it further out of view (back in is fine). */
  private clampCarry(dx: number, dy: number): [number, number] {
    const v = this.inView();
    return [
      Math.max(Math.min(0, this.x - v.maxX), Math.min(Math.max(0, this.x - v.minX), dx)),
      Math.max(Math.min(0, this.y - v.maxY), Math.min(Math.max(0, this.y - v.minY), dy)),
    ];
  }

  /** Scroll whatever's scrollable under the cursor (else the page); with scrollWithPage, carry the cursor too. */
  private scrollAtCursor(dx: number, dy: number) {
    // Only as far as keeps the whole cursor on screen as the content carries it.
    if (this.scrollWithPage) [dx, dy] = this.clampCarry(dx, dy);
    let scroller: Element | null = null;
    for (let el: Element | null = this.hoverChain[0] ?? null; el; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
        scroller = el;
        break;
      }
    }
    const pos = () => (scroller ? { x: scroller.scrollLeft, y: scroller.scrollTop } : { x: scrollX, y: scrollY });
    const before = pos();
    (scroller ?? window).scrollBy({ left: dx, top: dy, behavior: "instant" });
    const after = pos();
    if (this.scrollWithPage) {
      this.x -= after.x - before.x;
      this.y -= after.y - before.y;
    }
    if (!scroller) this.pageScroll = after; // already accounted for
  }

  /** Any other page scroll (keys, scripts): carry the cursor, and stop the page at the edge. */
  private pageScrolled() {
    const dx = scrollX - this.pageScroll.x;
    const dy = scrollY - this.pageScroll.y;
    this.pageScroll = { x: scrollX, y: scrollY };
    if (!this.scrollWithPage || !this.active || (!dx && !dy)) return;
    const [ax, ay] = this.clampCarry(dx, dy);
    this.x -= ax;
    this.y -= ay;
    if (ax !== dx || ay !== dy) {
      // It would have carried the cursor (partly) off screen: scroll back to where it stops.
      scrollBy({ left: ax - dx, top: ay - dy, behavior: "instant" });
      this.pageScroll = { x: scrollX, y: scrollY };
    }
  }

  // ---------------------------------------------------------------------------
  // Input

  private bindInput() {
    const on = (t: EventTarget, type: string, fn: (e: any) => void, o?: AddEventListenerOptions) => {
      // Only real input: our own synthetic events bubble up to document too.
      const real = (e: Event) => e.isTrusted && fn(e);
      t.addEventListener(type, real, o);
      this.cleanup.push(() => t.removeEventListener(type, real, o));
    };
    on(document, "pointerlockchange", () => {
      const locked = document.pointerLockElement === this.glass;
      this.pending = { x: 0, y: 0 };
      this.setActive(locked || this.input === "free");
      if (!locked && this.input === "lock") this.glass.style.display = "none";
    });
    // Movement comes from pointermove, not mousemove: Firefox under pointer lock
    // seems to stop sending mousemove while a button is held (breaking drags).
    // Caught at the window in the capture phase, before it's swallowed below.
    const move = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (this.input === "lock") {
        if (document.pointerLockElement === this.glass) {
          if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
          this.pending.x += e.movementX;
          this.pending.y += e.movementY;
        } else this.lastReal = { x: e.clientX, y: e.clientY };
        return;
      }
      // free mode: follow the hidden real cursor's movement
      if (this.lastReal && this.active) {
        this.pending.x += e.clientX - this.lastReal.x;
        this.pending.y += e.clientY - this.lastReal.y;
      } else {
        this.moveTo(e.clientX, e.clientY);
        this.setActive(true);
      }
      this.lastReal = { x: e.clientX, y: e.clientY };
    };
    on(document, "mouseout", (e: MouseEvent) => {
      // free mode: leaving the window ends the session; re-entry re-syncs.
      if (this.input === "free" && !e.relatedTarget) {
        this.lastReal = null;
        this.setActive(false);
      }
    });
    // Real presses, clicks and wheels are caught at the window in the capture phase
    // (the glass can't cover top-layer content like modal dialogs) and replayed at
    // the simulated cursor.
    const swallow = (e: Event) => {
      if (!this.active) return false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return true;
    };
    const capture = { capture: true, passive: false };
    const withMods = (e: MouseEvent, fn: () => void) => {
      this.mods = { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey };
      fn();
    };
    on(
      window,
      "pointermove",
      (e: PointerEvent) => {
        move(e);
        if (this.active) e.stopImmediatePropagation();
      },
      capture,
    );
    on(window, "mousedown", (e: MouseEvent) => swallow(e) && e.button === 0 && withMods(e, () => this.press()), capture);
    on(window, "mouseup", (e: MouseEvent) => swallow(e) && e.button === 0 && withMods(e, () => this.releasePress()), capture);
    for (const type of ["click", "dblclick", "auxclick", "contextmenu", "pointerdown", "pointerup", "pointerover", "pointerout"])
      on(
        window,
        type,
        (e: Event) => {
          if (!this.active) return;
          // preventDefault on pointerdown would also suppress the mousedown/mouseup we rely on.
          if (!type.startsWith("pointer")) e.preventDefault();
          e.stopImmediatePropagation();
        },
        capture,
      );
    on(window, "wheel", (e: WheelEvent) => swallow(e) && this.scroll(e), capture);
    on(window, "scroll", () => this.pageScrolled());
    on(window, "keydown", (e: KeyboardEvent) => this.scrollKey(e), capture);
  }
}
