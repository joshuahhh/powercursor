import type { Point } from "./geom";
import { Node } from "./node";
import { Cursor } from "./cursor";
import { unlockAudio } from "./sound";

/*
 * PowerCursor engine — a TypeScript port of PC_System.PC_Engine (AS2, 2006-2009,
 * Mensvoort / Hendrix / de Man).
 *
 * Every frame:
 *   1. every force source (ready-made object or behaviour) on the stage
 *      hit-tests every cursor and, where touching, contributes forces /
 *      dimmers / surface grip (PC_Object.heartbeat);
 *   2. the engine combines those per cursor with the mouse movement and the
 *      cursor's inertia & grip into one displacement, resolves walls, and
 *      moves the cursor (PC_Engine.heartbeat).
 *
 * Frame-rate independence: the AS2 engine ran once per Flash frame (25-30
 * fps) and added forces to the cursor speed once per frame. We run at display
 * rate, so per-frame force impulses are scaled by k = dt / refDt, where refDt
 * is the original movie's frame time. Speed decay and integration already
 * used AS2's own `timeFactor = frameTime / 50`, which we keep. Quantities the
 * objects read back per frame (last displacement) are normalised to the
 * reference frame, so every object formula can stay exactly as in AS2.
 */

export type CombineForces = "Add" | "Strongest" | "Topmost";
export type SpeedLimit = "low speed" | "average speed" | "high speed" | "never";
export type DimmerScope = "Global" | "Local" | "Mouse";
export type InputMode = "lock" | "free";

export interface EngineOptions {
  /** Original movie frame rate; dynamics are tuned to it. Default 30. */
  fps?: number;
  /** Scales all object forces, in percent. Default 100. */
  baseForce?: number;
  /** Multiply forces by their object's alpha. Default true. */
  scaleToAlpha?: boolean;
  combineForces?: CombineForces;
  /** Ignore forces while the mouse moves faster than this. Default "high speed". */
  speedLimit?: SpeedLimit;
  bouncingBalls?: boolean;
  hideAllObjects?: boolean;
  /** "lock" = Pointer Lock API (default), "free" = Flash-style hidden system cursor. */
  input?: InputMode;
  /** Show the system cursor in free mode (AS2 hideRealCursor = false). */
  showRealCursor?: boolean;
}

/** What an object sees when it's asked to apply its force to one cursor. */
export interface ForceContext {
  engine: Engine;
  cursor: Cursor;
  cursorIndex: number;
  /** Cursor position in the hit target's local coordinates. */
  local: Point;
  /** Cursor position in stage coordinates. */
  global: Point;
  /** Add a force (AS2 units, per reference frame). */
  addForce(fx: number, fy: number): void;
  /** Add a dimmer (0..100 = % of force that remains). */
  addDimmer(dimming: number, scope: DimmerScope): void;
  /** Dispatch pc_plateau (suppressed while probing). */
  plateau(): void;
  /** True when the engine is only sampling the field (debug grid). */
  probing: boolean;
}

/** Anything that exerts forces: ready-made objects and behaviours. */
export interface ForceSource {
  /** The node whose shapes are hit-tested. */
  readonly hitTarget: Node;
  /** The node that dispatches pc_* events and whose alpha/depth/parent count. */
  readonly eventTarget: Node;
  rolloverCursorStyle?: string;
  rolloverCursorSound?: string;
  /** Object "strength" for the initial sound volume (AS2 __strength * 10). */
  readonly soundStrength?: number;
  /** Walls are never touched; the engine steers around them instead. */
  readonly isWall?: boolean;
  /** Whether this source is currently active (default true). */
  enabled?: boolean;
  applyForce?(ctx: ForceContext): void;
}

export interface PCEvent {
  type: string;
  target: Node;
  cursor: Cursor;
  cursorIndex: number;
  x: number;
  y: number;
  xLastDisp: number;
  yLastDisp: number;
}

interface ForceRec {
  x: number;
  y: number;
  sender: Node;
}
interface DimmerRec {
  dimming: number;
  scope: DimmerScope;
  sender: Node;
}

const SPEED_PRESETS: Record<string, number> = { "low speed": 5, "average speed": 25, "high speed": 50 };

export class Engine {
  readonly stage: Stage;
  baseForce = 100;
  scaleToAlpha = true;
  combineForces: CombineForces = "Add";
  speedLimit: SpeedLimit = "high speed";
  bouncingBalls = true;
  hideAllObjects = false;
  input: InputMode = "lock";
  showRealCursor = false;
  refFps = 30;
  /** Freeze the simulation (cursor still drawn). */
  paused = false;

  /** Cursors and sources found on the stage this frame (paint order). */
  cursors: Cursor[] = [];
  sources: ForceSource[] = [];
  walls: ForceSource[] = [];

  /** Real/raw mouse position in stage coordinates (see input modes). */
  mouseX = 0;
  mouseY = 0;
  mouseIsDown = false;
  locked = false;

  /** Per-frame callbacks (after the physics step). */
  private frameFns = new Set<(dt: number) => void>();
  private forces = new Map<Cursor, ForceRec[]>();
  private dimmers = new Map<Cursor, DimmerRec[]>();
  private forcedLastFrame = new Map<Cursor, boolean>();
  private forced = new Map<Cursor, boolean>();
  private inside = new Map<ForceSource, Map<Cursor, boolean>>();
  private paintOrder = new Map<Node, number>();
  private speedHistory: { d: number; dt: number }[] = [];
  /** Debug: the text list of objects forcing each cursor (Watcher). */
  lastForcers = new Map<Cursor, string>();
  lastForce = new Map<Cursor, Point>();

  private pendingMove = { x: 0, y: 0 };
  private onstage = false;
  private enteredOnce = false;
  private raf = 0;
  private lastTime = 0;
  private k = 1;
  private cleanup: (() => void)[] = [];

  constructor(stage: Stage, opts: EngineOptions = {}) {
    this.stage = stage;
    stage.engine = this;
    this.configure(opts);
    this.mouseX = stage.width / 2;
    this.mouseY = stage.height / 2;
    this.bindInput();
  }

  configure(opts: EngineOptions) {
    if (opts.fps !== undefined) this.refFps = opts.fps;
    if (opts.baseForce !== undefined) this.baseForce = opts.baseForce;
    if (opts.scaleToAlpha !== undefined) this.scaleToAlpha = opts.scaleToAlpha;
    if (opts.combineForces !== undefined) this.combineForces = opts.combineForces;
    if (opts.speedLimit !== undefined) this.speedLimit = opts.speedLimit;
    if (opts.bouncingBalls !== undefined) this.bouncingBalls = opts.bouncingBalls;
    if (opts.hideAllObjects !== undefined) this.hideAllObjects = opts.hideAllObjects;
    if (opts.input !== undefined) this.setInputMode(opts.input);
    if (opts.showRealCursor !== undefined) this.showRealCursor = opts.showRealCursor;
    this.stage.el.classList.toggle("pc-hide-objects", this.hideAllObjects);
    this.updateCursorCss();
  }

  /** Ratio of the current frame to the reference (AS2) frame. */
  get frameScale() {
    return this.k;
  }

  onFrame(fn: (dt: number) => void): () => void {
    this.frameFns.add(fn);
    return () => this.frameFns.delete(fn);
  }

  start() {
    if (this.raf) return;
    this.lastTime = performance.now();
    const tick = (t: number) => {
      this.raf = requestAnimationFrame(tick);
      const dt = Math.min(100, Math.max(1, t - this.lastTime));
      this.lastTime = t;
      this.step(dt);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy() {
    this.stop();
    if (document.pointerLockElement === this.stage.el) document.exitPointerLock();
    for (const c of this.cursors) c.sound.stop();
    this.cleanup.forEach((f) => f());
    this.cleanup = [];
  }

  // ---------------------------------------------------------------------------
  // Registration by tree walk: whatever is on the stage this frame takes part.

  private collect() {
    this.cursors = [];
    this.sources = [];
    this.walls = [];
    this.paintOrder.clear();
    let i = 0;
    const visit = (n: Node) => {
      this.paintOrder.set(n, i++);
      if (n instanceof Cursor) this.cursors.push(n);
      if (isForceSource(n)) this.addSource(n);
      for (const b of n.behaviours) this.addSource(b);
      for (const c of n.children) visit(c);
    };
    visit(this.stage);
    const present = new Set<ForceSource>(this.sources);
    for (const src of this.inside.keys()) if (!present.has(src)) this.inside.delete(src);
  }

  private addSource(s: ForceSource) {
    if (s.enabled === false) return;
    if (s.isWall) this.walls.push(s);
    else this.sources.push(s);
  }

  // ---------------------------------------------------------------------------
  // Force API used by objects

  private record(cursor: Cursor, fx: number, fy: number, sender: Node) {
    const ff = this.baseForce / 100;
    if (this.scaleToAlpha) {
      fx *= sender.alpha;
      fy *= sender.alpha;
    }
    const rec = { x: (5 * fx * ff) / cursor.inertia, y: (5 * fy * ff) / cursor.inertia, sender };
    let list = this.forces.get(cursor);
    if (!list) this.forces.set(cursor, (list = []));
    list.push(rec);
    this.forced.set(cursor, true);
  }

  private recordDimmer(cursor: Cursor, dimming: number, scope: DimmerScope, sender: Node) {
    if (!(dimming >= 0 && dimming <= 100)) return;
    if (this.scaleToAlpha) dimming *= sender.alpha;
    let list = this.dimmers.get(cursor);
    if (!list) this.dimmers.set(cursor, (list = []));
    list.push({ dimming, scope, sender });
  }

  dispatch(type: string, target: Node, cursor: Cursor) {
    const ev: PCEvent = {
      type,
      target,
      cursor,
      cursorIndex: this.cursors.indexOf(cursor),
      x: cursor.x,
      y: cursor.y,
      xLastDisp: cursor.xLastDisp,
      yLastDisp: cursor.yLastDisp,
    };
    target.emit(type, ev);
  }

  // ---------------------------------------------------------------------------
  // The frame

  step(dt: number) {
    this.k = dt / (1000 / this.refFps);
    this.collect();
    for (const n of [...this.stage.walk()]) {
      n.onEnterFrame?.(dt);
      for (const b of n.behaviours) (b as { update?: (dt: number, e: Engine) => void }).update?.(dt, this);
    }
    this.collect();
    if (!this.paused) {
      this.objectsHeartbeat();
      this.heartbeat(dt);
    }
    for (const fn of [...this.frameFns]) fn(dt);
  }

  /**
   * PC_Object.heartbeat for every source, with AS2's quirks kept:
   * - an object's first look at a cursor fires neither pc_rollin nor pc_rollout
   *   (AS2 `cursorsInside[i]` starts undefined, and `undefined == false` is false);
   * - on rollin the cursor style and sound are set to the object's, even when those are
   *   "Null"/unset (AS2 compared against lowercase "null"): unset styles change only the
   *   style name, and unset sounds stop the current sound;
   * - on rollout the style is reset to "Arrow" and the sound stopped, for every object.
   * Sources removed from the stage mid-frame (by a handler) are skipped.
   */
  private objectsHeartbeat() {
    for (const s of this.sources) {
      if (s.hitTarget.root() !== this.stage) continue;
      let inside = this.inside.get(s);
      if (!inside) this.inside.set(s, (inside = new Map()));
      this.cursors.forEach((cur, i) => {
        const was = inside!.get(cur);
        if (s.hitTarget.hitTest(cur.x, cur.y)) {
          const local = s.hitTarget.globalToLocal({ x: cur.x, y: cur.y });
          s.applyForce?.(this.context(s, cur, i, local));
          if (was === false) {
            this.dispatch("pc_rollin", s.eventTarget, cur);
            cur.setCursorStyle(s.rolloverCursorStyle ?? "");
            const strength = s.soundStrength;
            cur.sound.set(s.rolloverCursorSound ?? "", strength !== undefined ? strength * 10 : 50, s.eventTarget.globalDiagonal());
          }
          this.dispatch("pc_rollover", s.eventTarget, cur);
          inside!.set(cur, true);
        } else {
          inside!.set(cur, false);
          if (was === true) {
            this.dispatch("pc_rollout", s.eventTarget, cur);
            cur.setCursorStyle("Arrow");
            cur.sound.set("Null");
          }
        }
      });
    }
  }

  private context(s: ForceSource, cursor: Cursor, cursorIndex: number, local: Point): ForceContext {
    return {
      engine: this,
      cursor,
      cursorIndex,
      local,
      global: { x: cursor.x, y: cursor.y },
      probing: false,
      addForce: (fx, fy) => this.record(cursor, fx, fy, s.eventTarget),
      addDimmer: (d, scope) => this.recordDimmer(cursor, d, scope, s.eventTarget),
      plateau: () => this.dispatch("pc_plateau", s.eventTarget, cursor),
    };
  }

  private mouseSpeed(): number {
    // Average mouse travel per reference frame over the last 5 reference frames.
    const window = 5 * (1000 / this.refFps);
    let t = 0;
    let d = 0;
    for (let i = this.speedHistory.length - 1; i >= 0 && t < window; i--) {
      t += this.speedHistory[i].dt;
      d += this.speedHistory[i].d;
    }
    if (this.speedHistory.length > 60) this.speedHistory.splice(0, this.speedHistory.length - 60);
    return t > 0 ? d / (t / (1000 / this.refFps)) : 0;
  }

  /** PC_Engine.heartbeat */
  private heartbeat(dt: number) {
    const k = this.k;
    const timeFactor = dt / 50;
    const mm = this.pendingMove;
    this.pendingMove = { x: 0, y: 0 };
    const mouseMovX = this.onstage ? mm.x : 0;
    const mouseMovY = this.onstage ? mm.y : 0;
    this.speedHistory.push({ d: Math.hypot(mouseMovX, mouseMovY), dt });
    const numDst = this.mouseSpeed();

    if (this.bouncingBalls) this.bounceBalls();

    this.cursors.forEach((cur) => {
      cur.sound.frameScale = k;
      const forces = this.forces.get(cur) ?? [];
      const dimmers = this.dimmers.get(cur) ?? [];
      this.forces.set(cur, []);
      this.dimmers.set(cur, []);

      if (!this.onstage) {
        cur.setSpeed(0, 0);
        return;
      }

      // cursor events
      const forced = this.forced.get(cur) ?? false;
      if (forced) {
        if (!this.forcedLastFrame.get(cur)) cur.emit("pc_forceStart", { cursor: cur });
        cur.emit("pc_force", { cursor: cur });
        this.forcedLastFrame.set(cur, true);
      } else {
        if (this.forcedLastFrame.get(cur)) cur.emit("pc_forceEnd", { cursor: cur });
        this.forcedLastFrame.set(cur, false);
      }
      this.forced.set(cur, false);

      let dX = 0;
      let dY = 0;
      let dxSpeed = 0;
      let dySpeed = 0;

      if (cur.mouseLink) {
        let mdim = 1;
        for (const d of dimmers) if (d.scope === "Mouse") mdim *= d.dimming / 100;
        if (cur.mouseAsForce) {
          // An impulse per unit of mouse travel: rate-independent as is.
          dxSpeed += (5 * mouseMovX * mdim) / cur.inertia;
          dySpeed += (5 * mouseMovY * mdim) / cur.inertia;
        } else {
          dX += (mouseMovX * mdim) / cur.surfaceGrip;
          dY += (mouseMovY * mdim) / cur.surfaceGrip;
          cur.xLastMouseDisp = mouseMovX / cur.surfaceGrip / k;
          cur.yLastMouseDisp = mouseMovY / cur.surfaceGrip / k;
        }
      }

      // apply dimmers to forces
      const fx: number[] = [];
      const fy: number[] = [];
      forces.forEach((f, i) => {
        fx[i] = f.x;
        fy[i] = f.y;
        for (const d of dimmers) {
          if (d.scope === "Global" || (d.scope === "Local" && f.sender.parent === d.sender.parent)) {
            fx[i] *= d.dimming / 100;
            fy[i] *= d.dimming / 100;
          }
        }
      });

      const names: string[] = [];
      let cx = 0;
      let cy = 0;
      if (fx.length > 0) {
        let pick = -1;
        if (this.combineForces === "Strongest") {
          let max = -1;
          fx.forEach((x, i) => {
            const s = Math.hypot(x, fy[i]);
            if (s > max) {
              max = s;
              pick = i;
            }
          });
        } else if (this.combineForces === "Topmost") {
          let top = -1;
          forces.forEach((f, i) => {
            const o = this.paintOrder.get(f.sender) ?? -1;
            if (o > top) {
              top = o;
              pick = i;
            }
          });
        }
        forces.forEach((f, i) => {
          const n = f.sender.name || f.sender.constructor.name;
          names.push(pick >= 0 && i !== pick ? `(${n})` : n);
          if (pick < 0 || i === pick) {
            cx += fx[i];
            cy += fy[i];
          }
        });
      }
      dxSpeed += cx * k;
      dySpeed += cy * k;
      this.lastForcers.set(cur, names.join(", "));
      this.lastForce.set(cur, { x: cx, y: cy });

      cur.xSpeed += dxSpeed;
      cur.ySpeed += dySpeed;
      dX += cur.xSpeed * timeFactor;
      dY += cur.ySpeed * timeFactor;
      cur.xLastForceDisp = (cur.xSpeed * timeFactor) / k;
      cur.yLastForceDisp = (cur.ySpeed * timeFactor) / k;

      // Walls: try the displacement; if it lands on a wall, try shorter and
      // increasingly rotated alternatives (up to ±90°), as in AS2.
      let disableDisplacement = false;
      let onWall = true;
      let step = 11;
      let tdX = dX;
      let tdY = dY;
      const cx0 = cur.x;
      const cy0 = cur.y;
      const hitsWall = (x: number, y: number) => this.walls.some((w) => w.hitTarget.hitTest(x, y));
      if (this.walls.length) {
        while (onWall && step >= 0) {
          step--;
          onWall = false;
          let ang = ((10 - step) / 10) * (Math.PI / 2);
          const m = Math.sqrt(step / 10);
          tdX = Math.cos(ang) * (dX * m) + Math.sin(ang) * (dY * m);
          tdY = Math.cos(ang) * (dY * m) - Math.sin(ang) * (dX * m);
          if (hitsWall(cx0 + tdX, cy0 + tdY)) {
            disableDisplacement = true;
            ang = -ang;
            tdX = Math.cos(ang) * (dX * m) + Math.sin(ang) * (dY * m);
            tdY = Math.cos(ang) * (dY * m) - Math.sin(ang) * (dX * m);
            onWall = hitsWall(cx0 + tdX, cy0 + tdY);
          }
        }
      }

      const limit = this.speedLimit === "never" ? -1 : SPEED_PRESETS[this.speedLimit];
      if (disableDisplacement || numDst <= limit || limit === -1 || !cur.mouseLink) {
        cur.displace(tdX, tdY);
      } else {
        cur.displace(mouseMovX, mouseMovY);
      }

      // speed decay from cursor grip and surface grip
      let slowdown = 1 - cur.grip / 100;
      slowdown = Math.pow(slowdown, cur.surfaceGrip);
      slowdown = Math.pow(slowdown, timeFactor);
      cur.setSpeed(cur.xSpeed * slowdown, cur.ySpeed * slowdown);

      if (cur.mouseLink && cur.mouseAsForce) {
        // Low surface grip (slick) lets mouse pushes carry further.
        const gripPush = Math.max(1 - cur.surfaceGrip, 0);
        if (gripPush > 0) {
          cur.xSpeed += (5 * mouseMovX * gripPush) / cur.inertia;
          cur.ySpeed += (5 * mouseMovY * gripPush) / cur.inertia;
        }
      }
      cur.surfaceGrip = 1;

      this.keepOnStage(cur);
    });
  }

  /** AS2 bounced cursors back toward the real mouse when they left the stage. */
  private keepOnStage(cur: Cursor) {
    const { width, height } = this.stage;
    const out = cur.x < 0 || cur.x > width || cur.y < 0 || cur.y > height;
    if (!out) return;
    if (this.input === "lock" || !cur.mouseLink) {
      // No real mouse to return to: clamp, and kill the outward speed.
      if (cur.x < 0 || cur.x > width) cur.xSpeed = 0;
      if (cur.y < 0 || cur.y > height) cur.ySpeed = 0;
      cur.setPosition(Math.min(width, Math.max(0, cur.x)), Math.min(height, Math.max(0, cur.y)));
      return;
    }
    const s = this.stage.eventTarget;
    if (cur.x < 0 || cur.x > width) this.record(cur, (this.mouseX - cur.x) / 8, (this.mouseY - cur.y) / 16, s);
    if (cur.y < 0 || cur.y > height) this.record(cur, (this.mouseX - cur.x) / 16, (this.mouseY - cur.y) / 8, s);
  }

  private bounceBalls() {
    const hardness = 0.9;
    const balls = this.cursors.filter((c) => c.isBall);
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i];
        const b2 = balls[j];
        const mass1 = b1.scaleX ** 2;
        const mass2 = b2.scaleX ** 2;
        if (b1.x === b2.x && b1.y === b2.y) b1.displace(10, 10);
        let dx = b1.x - b2.x;
        let dy = b1.y - b2.y;
        let dist = Math.hypot(dx, dy);
        const minDist = 10 * (b1.scaleX + b2.scaleX);
        if (dist < minDist) {
          let guard = 0;
          while (dist < minDist && guard++ < 1000) {
            b1.set({ x: b1.x + dx / 100, y: b1.y + dy / 100 });
            b2.set({ x: b2.x - dx / 100, y: b2.y - dy / 100 });
            dx = b1.x - b2.x;
            dy = b1.y - b2.y;
            dist = Math.hypot(dx, dy);
          }
          const nx = dx / dist;
          const ny = dy / dist;
          const b1p = b1.xSpeed * nx + b1.ySpeed * ny;
          const b2p = b2.xSpeed * nx + b2.ySpeed * ny;
          const b1k = b1.xSpeed * -ny + b1.ySpeed * nx;
          const b2k = b2.xSpeed * -ny + b2.ySpeed * nx;
          const m = mass1 + mass2;
          const v1p = ((mass1 - mass2) / m) * b1p + ((2 * mass2) / m) * b2p;
          const v2p = ((mass2 - mass1) / m) * b2p + ((2 * mass1) / m) * b1p;
          b1.xSpeed = b1k * -ny + hardness * v1p * nx;
          b1.ySpeed = b1k * nx + hardness * v1p * ny;
          b2.xSpeed = b2k * -ny + hardness * v2p * nx;
          b2.ySpeed = b2k * nx + hardness * v2p * ny;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Debug probing (PowerGrid / ForceSensor)

  /**
   * The combined force a resting cursor would receive at stage point (x, y),
   * in speed-per-reference-frame units. No events fire.
   */
  probe(x: number, y: number, template?: Cursor): Point {
    const probe = new Cursor({ grip: template?.grip ?? 50, inertia: template?.inertia ?? 10 });
    probe.set({ x, y });
    const forces: ForceRec[] = [];
    const dimmers: DimmerRec[] = [];
    const ff = this.baseForce / 100;
    for (const s of this.sources) {
      if (!s.applyForce || !s.hitTarget.hitTest(x, y)) continue;
      const local = s.hitTarget.globalToLocal({ x, y });
      s.applyForce({
        engine: this,
        cursor: probe,
        cursorIndex: -1,
        local,
        global: { x, y },
        probing: true,
        addForce: (fx, fy) => {
          const a = this.scaleToAlpha ? s.eventTarget.alpha : 1;
          forces.push({ x: (5 * fx * a * ff) / probe.inertia, y: (5 * fy * a * ff) / probe.inertia, sender: s.eventTarget });
        },
        addDimmer: (d, scope) => dimmers.push({ dimming: d * (this.scaleToAlpha ? s.eventTarget.alpha : 1), scope, sender: s.eventTarget }),
        plateau: () => {},
      });
    }
    let rx = 0;
    let ry = 0;
    let best = -1;
    let bestVal = -1;
    const vals = forces.map((f) => {
      let x2 = f.x;
      let y2 = f.y;
      for (const d of dimmers) {
        if (d.scope === "Global" || (d.scope === "Local" && f.sender.parent === d.sender.parent)) {
          x2 *= d.dimming / 100;
          y2 *= d.dimming / 100;
        }
      }
      return { x: x2, y: y2, sender: f.sender };
    });
    vals.forEach((v, i) => {
      const key = this.combineForces === "Strongest" ? Math.hypot(v.x, v.y) : this.combineForces === "Topmost" ? (this.paintOrder.get(v.sender) ?? -1) : 0;
      if (key > bestVal) {
        bestVal = key;
        best = i;
      }
    });
    vals.forEach((v, i) => {
      if (this.combineForces === "Add" || i === best) {
        rx += v.x;
        ry += v.y;
      }
    });
    return { x: rx, y: ry };
  }

  isOnWall(x: number, y: number): boolean {
    return this.walls.some((w) => w.hitTarget.hitTest(x, y));
  }

  // ---------------------------------------------------------------------------
  // Input

  setInputMode(mode: InputMode) {
    this.input = mode;
    if (mode === "free" && document.pointerLockElement === this.stage.el) document.exitPointerLock();
    this.onstage = false;
    this.updateCursorCss();
    this.stage.el.dataset.input = mode;
  }

  private updateCursorCss() {
    const hide = this.input === "lock" ? this.locked : !this.showRealCursor;
    this.stage.el.style.cursor = hide ? "none" : this.input === "lock" ? "pointer" : "";
    this.stage.el.classList.toggle("pc-locked", this.locked);
  }

  private stagePoint(e: MouseEvent): Point {
    const r = this.stage.el.getBoundingClientRect();
    const s = this.stage.displayScale;
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
  }

  private mouseLinked() {
    return this.cursors.filter((c) => c.mouseLink);
  }

  private bindInput() {
    const el = this.stage.el;
    const listen = <K extends keyof DocumentEventMap>(target: EventTarget, type: K | string, fn: (e: any) => void, opts?: AddEventListenerOptions) => {
      target.addEventListener(type, fn, opts);
      this.cleanup.push(() => target.removeEventListener(type, fn, opts));
    };

    listen(document, "pointerlockchange", () => {
      this.locked = document.pointerLockElement === el;
      this.onstage = this.input === "lock" ? this.locked : this.onstage;
      if (this.locked) this.pendingMove = { x: 0, y: 0 };
      this.updateCursorCss();
      this.stage.emit("lockchange", this.locked);
    });

    listen(document, "mousemove", (e: MouseEvent) => {
      if (this.input === "lock") {
        if (!this.locked) return;
        const s = this.stage.displayScale;
        let mx = e.movementX / s;
        let my = e.movementY / s;
        // Some browsers deliver a bogus jump on the first event after locking.
        if (Math.abs(mx) > 400 || Math.abs(my) > 400) return;
        this.pendingMove.x += mx;
        this.pendingMove.y += my;
        this.mouseX = Math.min(this.stage.width, Math.max(0, this.mouseX + mx));
        this.mouseY = Math.min(this.stage.height, Math.max(0, this.mouseY + my));
      } else {
        const p = this.stagePoint(e);
        const inStage = p.x >= 0 && p.y >= 0 && p.x < this.stage.width && p.y < this.stage.height;
        if (inStage && !this.onstage) {
          // Entering: snap mouse-linked cursors to the real mouse. AS2 started
          // "Onstage", so on the very first entry balls (mouse-as-force) stay put.
          this.onstage = true;
          this.pendingMove = { x: 0, y: 0 };
          const first = !this.enteredOnce;
          this.enteredOnce = true;
          for (const c of this.mouseLinked()) {
            if (!(first && c.mouseAsForce)) c.setPosition(p.x, p.y);
            c.setSpeed(0, 0);
            c.shown = true;
          }
        } else if (!inStage && this.onstage) {
          this.onstage = false;
          for (const c of this.mouseLinked()) {
            c.shown = false;
            c.sound.set("Null");
          }
        } else if (inStage) {
          this.pendingMove.x += p.x - this.mouseX;
          this.pendingMove.y += p.y - this.mouseY;
        }
        this.mouseX = p.x;
        this.mouseY = p.y;
      }
    });

    // Free mode: leaving the window entirely also takes the mouse off stage.
    listen(document, "mouseout", (e: MouseEvent) => {
      if (this.input !== "free" || e.relatedTarget || !this.onstage) return;
      this.onstage = false;
      for (const c of this.mouseLinked()) {
        c.shown = false;
        c.sound.set("Null");
      }
    });

    listen(el, "mousedown", (e: MouseEvent) => {
      unlockAudio();
      if (this.input === "lock" && !this.locked) {
        e.preventDefault();
        void el.requestPointerLock?.();
        return;
      }
      if (e.button !== 0) return;
      e.preventDefault();
      this.mouseIsDown = true;
      this.mouseEvent("pc_mousedown");
    });
    listen(document, "mouseup", (e: MouseEvent) => {
      if (e.button !== 0 || !this.mouseIsDown) return;
      this.mouseIsDown = false;
      this.mouseEvent("pc_mouseup");
    });
  }

  /** PC_Object.hitTestToEvent for every source. */
  private mouseEvent(type: "pc_mousedown" | "pc_mouseup") {
    if (!this.onstage) return;
    this.collect();
    for (const s of this.sources) {
      for (const cur of this.cursors) {
        if (s.hitTarget.root() !== this.stage) break; // removed by an earlier handler
        if (s.hitTarget.hitTest(cur.x, cur.y)) this.dispatch(type, s.eventTarget, cur);
      }
    }
    this.stage.emit(type, { type });
  }

  /** Programmatic lock request (e.g. from a "click to start" overlay). */
  requestLock() {
    if (this.input === "lock") void this.stage.el.requestPointerLock?.();
  }

  /** Put mouse-linked cursors at a point (e.g. at start). */
  placeCursors(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
    for (const c of this.stage.walk()) if (c instanceof Cursor && c.mouseLink) c.setPosition(x, y);
  }
}

function isForceSource(n: Node): n is Node & ForceSource {
  return "hitTarget" in n && "eventTarget" in n;
}

/** The root node: a fixed-size, clipped stage. Its own transform is ignored. */
export class Stage extends Node {
  readonly width: number;
  readonly height: number;
  engine: Engine | null = null;
  /** CSS scale applied to the stage for display (input is divided by it). */
  displayScale = 1;
  /** Sender used for engine-generated forces. */
  readonly eventTarget: Node;

  constructor(width: number, height: number, background = "#333333") {
    super();
    this.width = width;
    this.height = height;
    this.el.classList.add("pc-stage");
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
    this.el.style.background = background;
    this.eventTarget = new Node();
  }
}
