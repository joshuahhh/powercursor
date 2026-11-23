import type { Engine, ForceContext, ForceSource, PCEvent } from "./engine";
import type { Cursor } from "./cursor";
import { DEG } from "./geom";
import type { Node } from "./node";
import { applyDimmer, applySand, applySlick, type DimmerScopeParam, type DirectionDependency } from "./objects";

/*
 * Behaviours (PC_Behaviours.*): attach to any node to give its drawn shape
 * PowerCursor properties. The node itself (with its children) is hit-tested,
 * and pc_* events are emitted on it.
 *
 *     maze.addBehaviour(new WallMaker());
 */
export abstract class Behaviour implements ForceSource {
  node!: Node;
  rolloverCursorStyle?: string;
  rolloverCursorSound?: string;
  enabled = true;

  get hitTarget(): Node {
    return this.node;
  }
  get eventTarget(): Node {
    return this.node;
  }

  attach(node: Node) {
    this.node = node;
    this.onAttach();
  }
  protected onAttach() {}

  applyForce?(ctx: ForceContext): void;
  /** Called once per frame while on stage (before forces are applied). */
  update?(dtMs: number, engine: Engine): void;
}

/** Makes the node impassable. */
export class WallMaker extends Behaviour {
  readonly isWall = true;
}

/** Just makes the node dispatch pc_* events (listen with node.on()). */
export class EventDispatcher extends Behaviour {
  constructor(private handlers: Partial<Record<"pc_rollin" | "pc_rollover" | "pc_rollout" | "pc_mousedown" | "pc_mouseup" | "pc_plateau", (e: PCEvent) => void>> = {}) {
    super();
  }
  protected override onAttach() {
    for (const [type, fn] of Object.entries(this.handlers)) if (fn) this.node.on(type, fn);
  }
}

export class RampMaker extends Behaviour {
  constructor(
    public strength = 3,
    public angle = 0,
  ) {
    super();
  }
  override applyForce(ctx: ForceContext) {
    const a = (this.angle + this.node.totalRotation()) * DEG;
    ctx.addForce(this.strength * Math.sin(a), this.strength * -Math.cos(a));
  }
}

/** Pushes towards the nearest edge, found by spiralling outwards (AS2 algorithm). */
export class HillMaker extends Behaviour {
  constructor(public strength = 3) {
    super();
  }
  override applyForce(ctx: ForceContext) {
    const { x: gx, y: gy } = ctx.global;
    const r = this.node.el.getBoundingClientRect();
    const scale = ctx.engine.stage.displayScale;
    const maxRange = Math.min(r.width, r.height) / scale / 2;
    let angl = 0;
    let dist = 0.5;
    let miss = false;
    const inc = (2 * Math.PI) / 36;
    while (!miss && dist < maxRange) {
      if (!this.node.hitTest(gx + Math.sin(angl) * dist, gy - Math.cos(angl) * dist)) miss = true;
      else {
        angl += inc;
        dist *= 1.01;
      }
    }
    ctx.addForce((this.strength * (dist + 5)) / 50 * Math.sin(angl), (-this.strength * (dist + 5)) / 50 * Math.cos(angl));
  }
}

export class SandMaker extends Behaviour {
  constructor(
    public strengthRoughness = 3,
    public strengthStickyness = 3,
    public directionDependency: DirectionDependency = "None",
    public dirDepAngle = 0,
  ) {
    super();
  }
  override applyForce(ctx: ForceContext) {
    applySand(ctx, this.strengthRoughness, this.strengthStickyness, this.directionDependency, this.dirDepAngle);
  }
}

export class SlickMaker extends Behaviour {
  constructor(
    public strength = 3,
    public directionDependency: DirectionDependency = "None",
    public dirDepAngle = 0,
  ) {
    super();
  }
  override applyForce(ctx: ForceContext) {
    applySlick(ctx, this.strength, this.directionDependency, this.dirDepAngle);
  }
}

export class ForceDimmer extends Behaviour {
  constructor(
    public dimmingFactor = 0,
    public scope: DimmerScopeParam = "Global forces",
    public directionDependency: DirectionDependency = "None",
    public dirDepAngle = 0,
  ) {
    super();
  }
  override applyForce(ctx: ForceContext) {
    applyDimmer(ctx, this.dimmingFactor, this.scope, this.directionDependency, this.dirDepAngle);
  }
}

export type FrameRef = number | string | null;

export interface ButtonMakerParams {
  /** Frames (or labels) to show; null = don't change. AS2 defaults 1, 2, 3, 2. */
  out?: FrameRef;
  over?: FrameRef;
  down?: FrameRef;
  up?: FrameRef;
  rolloverCursorStyle?: string;
  /** How to "go to a frame"; defaults to node.gotoAndStop(frame). */
  goto?: (frame: number | string) => void;
}

/** Button-like behaviour: moves the node's playhead on rollin/rollout/press/release. */
export class ButtonMaker extends Behaviour {
  out: FrameRef = 1;
  over: FrameRef = 2;
  down: FrameRef = 3;
  up: FrameRef = 2;
  cursorStyle = "Finger";
  private gotoFn: ((f: number | string) => void) | null = null;

  constructor(p: ButtonMakerParams = {}) {
    super();
    if (p.out !== undefined) this.out = p.out;
    if (p.over !== undefined) this.over = p.over;
    if (p.down !== undefined) this.down = p.down;
    if (p.up !== undefined) this.up = p.up;
    if (p.rolloverCursorStyle !== undefined) this.cursorStyle = p.rolloverCursorStyle;
    this.gotoFn = p.goto ?? null;
  }

  private go(f: FrameRef) {
    if (f === null || f === "null") return;
    if (this.gotoFn) this.gotoFn(f);
    else (this.node as any).gotoAndStop?.(f);
  }

  protected override onAttach() {
    this.go(this.out);
    const n = this.node;
    n.on("pc_rollout", (e: PCEvent) => {
      e.cursor.setCursorStyle("Default");
      this.go(this.out);
    });
    n.on("pc_rollover", (e: PCEvent) => e.cursor.setCursorStyle(this.cursorStyle));
    n.on("pc_rollin", (e: PCEvent) => {
      e.cursor.setCursorStyle(this.cursorStyle);
      this.go(this.over);
    });
    n.on("pc_mousedown", () => this.go(this.down));
    n.on("pc_mouseup", () => this.go(this.up));
  }
}

/**
 * Drag the node with the cursor while the button is held. A rollout only ends
 * the drag after ~10 frames, so fast moves don't drop it.
 */
export class DraggerMaker extends Behaviour {
  private dragging: Cursor | null = null;
  private stopTimer = 0;
  onDragStart: (() => void) | null = null;
  onDragEnd: (() => void) | null = null;

  protected override onAttach() {
    const n = this.node;
    n.on("pc_mousedown", (e: PCEvent) => {
      this.stopTimer = 0;
      this.dragging = e.cursor;
      this.onDragStart?.();
    });
    n.on("pc_mouseup", () => {
      this.dragging = null;
      this.onDragEnd?.();
    });
    n.on("pc_rollout", () => {
      if (this.dragging) this.stopTimer = 1;
    });
    n.on("pc_rollin", () => (this.stopTimer = 0));
  }

  override applyForce(_ctx: ForceContext) {}

  override update(dt: number, engine: Engine) {
    const cur = this.dragging;
    if (cur) {
      // lastDisp is normalised to the reference frame; convert back.
      const k = engine.frameScale;
      this.node.set({ x: this.node.x + cur.xLastDisp * k, y: this.node.y + cur.yLastDisp * k });
    }
    if (this.stopTimer > 0) {
      this.stopTimer += dt;
      if (this.stopTimer > (10 * 1000) / engine.refFps) {
        this.dragging = null;
        this.stopTimer = 0;
      }
    }
  }
}

/**
 * Pulls the mock cursor back towards the real (system / raw) mouse position.
 * Mostly useful in free input mode.
 */
export class Synchronizer extends Behaviour {
  private xSync = 0;
  private ySync = 0;
  constructor(
    public strength = 3,
    public subtle = true,
  ) {
    super();
  }
  override applyForce(ctx: ForceContext) {
    if (ctx.probing) return;
    const cur = ctx.cursor;
    const xd = this.xSync + cur.xLastForceDisp;
    const yd = this.ySync + cur.yLastForceDisp;
    if (!this.subtle || Math.abs(cur.xLastMouseDisp) + Math.abs(cur.yLastMouseDisp) > 1) {
      if (Math.abs(xd) + Math.abs(yd) > 1) {
        ctx.addForce(this.strength * -0.1 * Math.sqrt(Math.abs(xd)) * Math.sign(xd), this.strength * -0.1 * Math.sqrt(Math.abs(yd)) * Math.sign(yd));
      }
    }
    this.xSync = cur.x - ctx.engine.mouseX;
    this.ySync = cur.y - ctx.engine.mouseY;
  }
}
