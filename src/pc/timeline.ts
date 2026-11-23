import { Node } from "./node";

/** Properties a keyframe can set on a placed instance. */
export type FrameProps = Partial<Pick<Node, "x" | "y" | "scaleX" | "scaleY" | "rotation" | "alpha" | "visible">> & { scale?: number };
/** Per-frame state of a placement: props, or a function for anything else (filters, ...). */
export type Keyframe = FrameProps | ((node: Node) => void);

interface Span {
  make: () => Node;
  from: number;
  to: number;
  depth: number;
  keys: [number, Keyframe][];
  node: Node | null;
}

export interface TimelineOptions {
  frames?: number;
  labels?: Record<string, number>;
  fps?: number;
  /** Start playing (Flash clips do unless a script stops them). Default false. */
  play?: boolean;
}

/**
 * A Flash (AS2) MovieClip timeline.
 *
 * - `place(what, from, to, depth, keys)` puts an instance on a frame range. `what` is a
 *   node (reused on every entry; fine for plain art) or a factory (a fresh instance each
 *   time the playhead enters the range, like Flash: handlers, playheads and PowerCursor
 *   rollover state start over). Off-frame instances leave the display list, so their
 *   forces stop.
 * - Keyframes: the latest key at or before the current frame applies (`keys`).
 * - `script(frame, fn)` is a frame action. A goto from inside a frame script runs the
 *   target frame's actions after the current ones finish (AVM1 order), so
 *   `gotoAndStop("x"); play();` followed by a `stop()` on frame x ends stopped.
 * - Labels match case-insensitively; a goto to an unknown label does nothing (as in Flash).
 * - Starts on frame 1 at the first tick (or call `begin()`); nested timelines start when placed.
 */
export class Timeline extends Node {
  totalFrames: number;
  labels: Record<string, number>;
  fps: number;
  playing: boolean;
  /** Loop back to frame 1 after the last frame (Flash default). */
  loop = true;
  /** Called with each instance a placement creates. */
  onCreate: ((node: Node) => void) | null = null;
  private spans: Span[] = [];
  private scripts = new Map<number, ((tl: Timeline) => void)[]>();
  private frame = 0;
  private acc = 0;
  private seq = 0;
  private inScript = false;
  private queue: number[] = [];

  constructor(opts: TimelineOptions = {}) {
    super();
    this.totalFrames = opts.frames ?? 1;
    this.labels = opts.labels ?? {};
    this.fps = opts.fps ?? 25;
    this.playing = opts.play ?? false;
    this.onEnterFrame = (dt) => {
      if (!this.frame) {
        this.begin();
        return;
      }
      if (!this.playing) return;
      this.acc += dt;
      const step = 1000 / this.fps;
      // Cap catch-up so a stalled tab doesn't fast-forward through state machines.
      if (this.acc > step * 3) this.acc = step;
      while (this.acc >= step && this.playing) {
        this.acc -= step;
        if (this.frame >= this.totalFrames && !this.loop) {
          this.playing = false;
          break;
        }
        this.goto(this.frame >= this.totalFrames ? 1 : this.frame + 1);
      }
    };
  }

  /**
   * Place `what` on frames from..to (inclusive; default just `from`) at a depth (default:
   * placement order). Returns the node when given a node, or the timeline for a factory.
   */
  place<T extends Node>(what: T, from?: number | string, to?: number | string, depth?: number, keys?: Record<number, Keyframe>): T;
  place(what: () => Node, from?: number | string, to?: number | string, depth?: number, keys?: Record<number, Keyframe>): this;
  place(what: Node | (() => Node), from: number | string = 1, to?: number | string, depth?: number, keys: Record<number, Keyframe> = {}): Node | this {
    const make = typeof what === "function" ? what : () => what;
    const f = this.resolve(from) ?? 1;
    const t = to === undefined ? f : (this.resolve(to) ?? f);
    const k = Object.entries(keys)
      .map(([fr, v]) => [Number(fr), v] as [number, Keyframe])
      .sort((a, b) => a[0] - b[0]);
    this.spans.push({ make, from: f, to: t, depth: depth ?? this.seq++, keys: k, node: null });
    if (this.frame) this.sync(this.frame);
    return typeof what === "function" ? this : what;
  }

  /** Place on every frame. */
  placeAlways<T extends Node>(what: T, depth?: number): T;
  placeAlways(what: () => Node, depth?: number): this;
  placeAlways(what: Node | (() => Node), depth?: number): Node | this {
    return this.place(what as Node, 1, this.totalFrames, depth);
  }

  script(frame: number | string, fn: (tl: Timeline) => void): this {
    const f = this.resolve(frame);
    if (f === undefined) throw new Error(`Unknown frame label "${frame}"`);
    this.scripts.set(f, [...(this.scripts.get(f) ?? []), fn]);
    return this;
  }

  get currentFrame() {
    return this.frame;
  }

  /** Label of the current frame, if any. */
  get currentLabel(): string | undefined {
    return Object.entries(this.labels).find(([, f]) => f === this.frame)?.[0];
  }

  /** Frame number for a frame or label (labels match case-insensitively); undefined if unknown. */
  resolve(f: number | string): number | undefined {
    let n: number | undefined;
    if (typeof f === "number") n = f;
    else n = this.labels[f] ?? Object.entries(this.labels).find(([k]) => k.toLowerCase() === f.toLowerCase())?.[1];
    return n === undefined ? undefined : Math.max(1, Math.min(this.totalFrames, n));
  }

  gotoAndStop(f: number | string) {
    const n = this.resolve(f);
    if (n === undefined) return;
    this.playing = false;
    this.goto(n);
  }
  gotoAndPlay(f: number | string) {
    const n = this.resolve(f);
    if (n === undefined) return;
    this.playing = true;
    this.acc = 0;
    this.goto(n);
  }
  play() {
    this.playing = true;
  }
  stop() {
    this.playing = false;
  }
  nextFrame() {
    this.gotoAndStop(Math.min(this.totalFrames, this.frame + 1));
  }
  prevFrame() {
    this.gotoAndStop(Math.max(1, this.frame - 1));
  }

  /** Enter frame 1 if not started yet (runs its scripts). */
  begin(playing?: boolean): this {
    if (playing !== undefined) this.playing = playing;
    if (!this.frame) this.goto(1);
    return this;
  }

  private goto(n: number) {
    this.frame = n;
    this.sync(n);
    if (this.inScript) {
      this.queue.push(n);
      return;
    }
    this.inScript = true;
    try {
      this.runScripts(n);
      while (this.queue.length) this.runScripts(this.queue.shift()!);
    } finally {
      this.inScript = false;
    }
  }

  private runScripts(n: number) {
    for (const fn of this.scripts.get(n) ?? []) fn(this);
  }

  private sync(n: number) {
    const on = (s: Span) => n >= s.from && n <= s.to;
    // Removals first, so a node shared by two placements isn't removed after being re-placed.
    for (const s of this.spans) {
      if (s.node && !on(s)) {
        s.node.remove();
        s.node = null;
      }
    }
    const active = this.spans.filter(on).sort((a, b) => a.depth - b.depth);
    for (const s of active) {
      if (!s.node) {
        s.node = s.make();
        this.onCreate?.(s.node);
      }
      let key: Keyframe | undefined;
      for (const [f, v] of s.keys) if (f <= n && f >= s.from) key = v;
      if (typeof key === "function") key(s.node);
      else if (key) s.node.set(key);
    }
    const managed = new Set(active.map((s) => s.node!));
    // Managed nodes come first, in depth order; anything added by hand stays on top.
    active.forEach((s, i) => {
      const node = s.node!;
      const kids = this.children.filter((c) => managed.has(c));
      if (kids[i] !== node || node.parent !== this) this.addChildAt(node, i);
    });
    for (const s of active) if (s.node instanceof Timeline) s.node.begin();
  }
}
