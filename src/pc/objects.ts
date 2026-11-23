import { Art, Clip, loadArt, preload, type ArtInfo } from "./art";
import { tintArt } from "./cursor";
import type { ForceContext, ForceSource } from "./engine";
import { compassAngle, DEG } from "./geom";
import { circle, rect, type HitShape } from "./hit";
import { Node } from "./node";

/*
 * Ready-made force objects (PC_Objects.*). Each has fixed local geometry like
 * its Flash library symbol (registration point top-left, e.g. a Hill is a
 * 100x100 disc centred at (50,50)); place it with x/y/scale/rotation.
 * Parameters keep their AS2 names, defaults and semantics.
 */

export type SlopeShape = "V-shaped" | "U-shaped" | "Sine-shaped";
export type DirectionDependency = "None" | "One-way" | "Two-way";

/** Load an image into a placeholder node (art never affects physics). */
export function lazyArt(parent: Node, path: string, setup?: (a: Art, holder: Node) => void): Node {
  const holder = parent.addChild(new Node());
  void loadArt(path).then((info) => {
    const a = holder.addChild(new Art(info));
    setup?.(a, holder);
  });
  return holder;
}

export function lazyClip(parent: Node, paths: string[], opts: ConstructorParameters<typeof Clip>[1], setup?: (c: Clip) => void): Node {
  const holder = parent.addChild(new Node());
  void preload(paths).then((infos: ArtInfo[]) => {
    const c = holder.addChild(new Clip(infos, opts));
    setup?.(c);
  });
  return holder;
}

/** Base for ready-made objects: the object is its own hit target and event target. */
export abstract class PCObject extends Node implements ForceSource {
  rolloverCursorStyle = "Null";
  rolloverCursorSound = "";
  enabled = true;
  /** Visual layer, rebuilt by draw(). */
  protected visual: Node;

  constructor() {
    super();
    this.el.classList.add("pc-object");
    this.hitChildren = false;
    this.visual = this.addChild(new Node());
    this.visual.el.classList.add("pc-object-visual");
  }

  get hitTarget(): Node {
    return this;
  }
  get eventTarget(): Node {
    return this;
  }
  get soundStrength(): number | undefined {
    return (this as any).strength;
  }

  /** Rebuild the visualisation from the current parameters. */
  redraw() {
    for (const c of [...this.visual.children]) c.remove();
    this.draw();
  }
  protected abstract draw(): void;

  applyForce?(ctx: ForceContext): void;

  protected init<P extends object>(params: P | undefined) {
    if (params) Object.assign(this, params);
    this.redraw();
  }
}

export interface ObjectParams {
  rolloverCursorStyle?: string;
  rolloverCursorSound?: string;
}

// -----------------------------------------------------------------------------
// Round objects: Hill, Hole, Twister, Target

export type RoundStyle = "None" | "Circle" | "Disc" | "Just shading" | "Circle with shading" | "Disc with shading";

export interface RoundParams extends ObjectParams {
  strength?: number;
  plateauDiameter?: number;
  shape?: SlopeShape;
  style?: RoundStyle;
  tint?: number;
}

/** Shared slope formula of the round objects. `dist` is from the centre. */
export function roundSlope(shape: SlopeShape, dist: number): number {
  if (shape === "V-shaped") return 4;
  if (shape === "U-shaped") return 0.12 * dist;
  return 5 * Math.sin((dist * Math.PI) / 51);
}

abstract class RoundObject extends PCObject {
  strength = 3;
  plateauDiameter = 20;
  shape: SlopeShape = "U-shaped";
  style: RoundStyle = "Disc with shading";
  tint = 0xdd2424;
  /** Rotate shading 180° (holes and targets look sunken). */
  protected sunken = false;
  protected shadingNodes: Node[] = [];

  constructor() {
    super();
    this.hitShape = circle(50, 50, 50);
  }

  protected draw() {
    const v = this.visual;
    const s = this.style;
    if (s === "Circle" || s === "Circle with shading") {
      lazyArt(v, "lib/circle.svg", (a, h) => {
        h.set({ x: 50.5, y: 50.5 });
        tintArt(a, this.tint);
      });
    } else if (s === "Disc" || s === "Disc with shading") {
      lazyArt(v, "lib/disc.svg", (a, h) => {
        h.set({ x: 50, y: 50 });
        tintArt(a, this.tint);
      });
    }
    this.shadingNodes = [];
    if (s === "Disc with shading" || s === "Circle with shading" || s === "Just shading") {
      // Sunken (hole) shading is the hill's rotated by 180°; a negative
      // strength flips it again.
      const flip = this.sunken !== this.strength < 0;
      for (const path of ["lib/round-light.svg", "lib/round-shade.svg"]) {
        const h = lazyArt(v, path);
        if (flip) h.set({ rotation: 180, x: 100, y: 100 });
        this.shadingNodes.push(h);
      }
    }
    // (Deployed demos imported the toolkit at runtime, so none of its drawings showed; skip with style None.)
    if (this.plateauDiameter > 0 && s !== "None") {
      const d = v.addChild(new Node());
      const p = this.plateauDiameter;
      d.el.style.cssText += `width:${p}px;height:${p}px;left:${50 - p / 2}px;top:${50 - p / 2}px;border-radius:50%;background:rgba(255,255,255,0.1)`;
    }
  }

  /** Common hill/hole math; `sign` +1 pushes outward, -1 pulls inward. */
  protected radial(ctx: ForceContext, sign: number) {
    const relx = ctx.local.x - 50;
    const rely = ctx.local.y - 50;
    const dist = Math.hypot(relx, rely);
    if (dist > this.plateauDiameter / 2) {
      const angle = compassAngle(relx, rely) * DEG;
      const slope = roundSlope(this.shape, dist);
      const f = sign * this.strength * (slope / 10);
      this.addRotated(ctx, f * Math.sin(angle), -f * Math.cos(angle));
    } else {
      ctx.plateau();
      ctx.addForce(0, 0);
    }
  }

  /**
   * AS2 hills/holes added their local-space force unrotated; that is only
   * right for unrotated objects, so we rotate it by the object's total
   * rotation (identical for every demo, which never rotate round objects).
   */
  protected addRotated(ctx: ForceContext, fx: number, fy: number) {
    const r = this.totalRotation() * DEG;
    if (r === 0) return ctx.addForce(fx, fy);
    ctx.addForce(fx * Math.cos(r) - fy * Math.sin(r), fx * Math.sin(r) + fy * Math.cos(r));
  }
}

/** Pushes cursors away from its centre. */
export class Hill extends RoundObject {
  constructor(params?: RoundParams) {
    super();
    this.init(params);
  }
  override applyForce(ctx: ForceContext) {
    this.radial(ctx, +1);
  }
}

/** Pulls cursors towards its centre. */
export class Hole extends RoundObject {
  protected override sunken = true;
  constructor(params?: RoundParams) {
    super();
    this.sunken = true;
    this.init(params);
  }
  override applyForce(ctx: ForceContext) {
    this.radial(ctx, -1);
  }
}

export type Spin = "Left In" | "Left Out" | "Right In" | "Right Out";
export interface TwisterParams extends RoundParams {
  spin?: Spin;
  vortexStyle?: "None" | "Still" | "Animated";
  /** Frame rate of the animated vortex (the host movie's fps). */
  fps?: number;
}

/** Spins cursors around its centre, like water down a drain. */
export class Twister extends RoundObject {
  spin: Spin = "Right In";
  vortexStyle: "None" | "Still" | "Animated" = "Still";
  fps = 25;
  constructor(params?: TwisterParams) {
    super();
    this.init(params);
  }

  protected override draw() {
    super.draw();
    const dir = this.spin.startsWith("Left") ? "l" : "r";
    if (this.vortexStyle === "Animated") {
      const frames = Array.from({ length: 45 }, (_, i) => `lib/vortex-anim-${dir}/${i + 1}.svg`);
      const h = lazyClip(this.visual, frames, { fps: this.fps, play: true });
      h.set({ x: 50, y: 50 });
    } else if (this.vortexStyle === "Still") {
      lazyArt(this.visual, `lib/vortex-${dir}.svg`, (_a, h) => h.set({ x: 50.05, y: 50 }));
    }
  }

  override applyForce(ctx: ForceContext) {
    const relx = ctx.local.x - 50;
    const rely = ctx.local.y - 50;
    let angle = compassAngle(relx, rely);
    const dist = Math.hypot(relx, rely);
    if (dist > this.plateauDiameter / 2) {
      let slope: number;
      if (this.shape === "V-shaped") slope = 4;
      else if (this.shape === "U-shaped") slope = 0.12 * dist;
      // (sic) AS2 Twister's sine shape: 5 * sin(dist) * PI / 51
      else slope = (5 * Math.sin(dist) * Math.PI) / 51;
      const spinboost = Math.pow((50 - dist) / 20, 2) * this.strength;
      switch (this.spin) {
        case "Left In":
          angle += -100 - spinboost;
          break;
        case "Left Out":
          angle += -88 + spinboost;
          break;
        case "Right Out":
          angle += +88 - spinboost;
          break;
        default:
          angle += +100 + spinboost;
      }
      let xForce = this.strength * (slope / 10) * Math.sin(angle * DEG);
      let yForce = this.strength * (slope / 10) * Math.cos(angle * DEG);
      xForce *= this.scaleX;
      yForce *= this.scaleY;
      const rot = this.totalRotation() * DEG;
      ctx.addForce(xForce * Math.cos(rot) + yForce * Math.sin(rot), -(yForce * Math.cos(rot) - xForce * Math.sin(rot)));
    } else {
      ctx.plateau();
      ctx.addForce(0, 0);
    }
  }
}

export interface TargetParams extends RoundParams {
  showBullseye?: boolean;
}

/**
 * A hole that switches itself off once the cursor reaches its centre, so it is
 * easy to enter and easy to leave. Resets when the cursor rolls out.
 */
export class Target extends RoundObject {
  showBullseye = true;
  private initStrength = 3;
  private bullseye: Node | null = null;

  constructor(params?: TargetParams) {
    super();
    this.sunken = true;
    this.init(params);
    this.initStrength = this.strength;
    this.on("pc_rollin", () => (this.strength = this.initStrength));
    this.on("pc_rollout", () => {
      this.visual.visible = true;
      this.strength = this.initStrength;
    });
  }

  protected override draw() {
    super.draw();
    this.bullseye = lazyArt(this.visual, "lib/target-design.svg");
    this.bullseye.alpha = this.showBullseye ? 1 : 0;
    // shading above the bullseye
    for (const s of this.shadingNodes) this.visual.addChild(s);
  }

  override applyForce(ctx: ForceContext) {
    const relx = ctx.local.x - 50;
    const rely = ctx.local.y - 50;
    const dist = Math.hypot(relx, rely);
    if (dist > this.plateauDiameter / 2) {
      const angle = compassAngle(relx, rely) * DEG;
      const f = this.strength * (roundSlope(this.shape, dist) / 10);
      this.addRotated(ctx, -f * Math.sin(angle), f * Math.cos(angle));
    } else {
      ctx.plateau();
      if (!ctx.probing) {
        this.visual.visible = false;
        this.strength = 0;
        ctx.addForce(0, 0);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Gutter & Pushgutter: 200 x 25, centre line y = 12.5

export type GutterStyle = "None" | "Rectangle" | "Block" | "Just shading" | "Rectangle with shading" | "Block with shading";
export interface GutterParams extends ObjectParams {
  strength?: number;
  plateauDiameter?: number;
  shape?: SlopeShape;
  graphicsStyle?: GutterStyle;
  tint?: number;
}

/** Draws cursors to its centre line (a one-dimensional hole). */
export class Gutter extends PCObject {
  strength = 3;
  plateauDiameter = 20;
  shape: SlopeShape = "U-shaped";
  graphicsStyle: GutterStyle = "Block with shading";
  tint = 0xdd2424;

  constructor(params?: GutterParams) {
    super();
    this.hitShape = rect(0, 0, 200, 25);
    if (new.target === Gutter) this.init(params);
  }

  protected draw() {
    const s = this.graphicsStyle;
    if (s === "Rectangle" || s === "Rectangle with shading") {
      lazyArt(this.visual, "lib/gutter-rectangle.svg", (a, h) => {
        h.set({ x: 100.5, y: 13 });
        tintArt(a, this.tint);
      });
    } else if (s === "Block" || s === "Block with shading") {
      lazyArt(this.visual, "lib/gutter-block.svg", (a, h) => {
        h.set({ x: 100, y: 12.5 });
        tintArt(a, this.tint);
      });
    }
    if (s === "Block with shading" || s === "Rectangle with shading" || s === "Just shading") {
      lazyArt(this.visual, "lib/gutter-shading.svg", (_a, h) => h.set({ x: 100, y: 12.5 }));
    }
  }

  protected slope(ctx: ForceContext): number {
    const rely = ctx.local.y - 12.5;
    if (Math.abs(rely) > this.plateauDiameter / 16) {
      if (this.shape === "V-shaped") return 4 * Math.sign(rely);
      if (this.shape === "U-shaped") return rely / 2;
      return 5 * Math.sin((rely * Math.PI) / 12.5);
    }
    ctx.plateau();
    return 0;
  }

  override applyForce(ctx: ForceContext) {
    const rot = this.totalRotation() * DEG;
    const slope = this.slope(ctx);
    ctx.addForce(((this.strength * slope) / 8) * Math.sin(rot), ((-this.strength * slope) / 8) * Math.cos(rot));
  }
}

export interface PushgutterParams extends GutterParams {
  pushStrength?: number;
  arrowStyle?: "None" | "Still" | "Animated";
  fps?: number;
}

/** A gutter that also pushes cursors along its length (local +x). */
export class Pushgutter extends Gutter {
  pushStrength = 3;
  arrowStyle: "None" | "Still" | "Animated" = "Still";
  fps = 25;

  constructor(params?: PushgutterParams) {
    super();
    this.init(params);
  }

  protected override draw() {
    super.draw();
    if (this.arrowStyle === "Animated") {
      const frames = Array.from({ length: 50 }, (_, i) => `lib/gutter-arrows-anim/${i + 1}.svg`);
      lazyClip(this.visual, frames, { fps: this.fps, play: true }, (c) => c.parent!.set({ x: 100, y: 12.5 }));
    } else if (this.arrowStyle === "Still") {
      lazyArt(this.visual, "lib/gutter-arrows.svg", (_a, h) => h.set({ x: 175 * (9 / 16), y: 12 }));
    }
  }

  override applyForce(ctx: ForceContext) {
    const rot = this.totalRotation() * DEG;
    const slope = this.slope(ctx);
    ctx.addForce(
      this.strength * slope * 0.15 * Math.sin(rot) + (this.pushStrength * Math.cos(rot)) / 2,
      -this.strength * slope * 0.15 * Math.cos(rot) + (this.pushStrength * Math.sin(rot)) / 2,
    );
  }
}

// -----------------------------------------------------------------------------
// Ramp: constant force (wind / gravity)

export interface RampParams extends ObjectParams {
  strength?: number;
  /** Degrees clockwise from up, relative to the object. */
  angle?: number;
  graphicsStyle?: "None" | "Square" | "Square with shading" | "Just shading";
  tint?: number;
}

export class Ramp extends PCObject {
  strength = 3;
  angle = 0;
  graphicsStyle: "None" | "Square" | "Square with shading" | "Just shading" = "Square with shading";
  tint = 0xdd2424;

  constructor(params?: RampParams) {
    super();
    this.hitShape = rect(0, 0, 100, 100);
    this.init(params);
  }

  protected draw() {
    const s = this.graphicsStyle;
    if (s === "Square" || s === "Square with shading") {
      lazyArt(this.visual, "lib/square.svg", (a, h) => {
        h.set({ x: 50, y: 50 });
        tintArt(a, this.tint);
      });
    }
    if (s === "Square with shading" || s === "Just shading") {
      const box = this.visual.addChild(new Node());
      box.el.style.cssText += "width:100px;height:100px;overflow:hidden";
      const a = this.angle % 90;
      const mult = a !== 0 ? Math.cos(a * DEG) + Math.sin(a * DEG) : 1;
      lazyArt(box, "lib/ramp-shading.svg", (_a, h) => h.set({ x: 50, y: 50, rotation: this.angle, scale: mult }));
    }
  }

  override applyForce(ctx: ForceContext) {
    const a = (this.angle + this.totalRotation()) * DEG;
    ctx.addForce(this.strength * Math.sin(a), this.strength * -Math.cos(a));
  }
}

// -----------------------------------------------------------------------------
// Wedge: a slice of a hill, registration at the tip

export interface WedgeParams extends ObjectParams {
  strength?: number;
  graphicsStyle?: "None" | "Wedge" | "Wedge with shading" | "Just shading";
  tint?: number;
}

const WEDGE_R = 100.85;
const WEDGE_HALF = Math.asin(38.5 / WEDGE_R);

export class Wedge extends PCObject {
  strength = 3;
  graphicsStyle: "None" | "Wedge" | "Wedge with shading" | "Just shading" = "Wedge with shading";
  tint = 0xdd2424;

  constructor(params?: WedgeParams) {
    super();
    this.hitShape = {
      kind: "fn",
      test: (x, y) => Math.hypot(x, y) <= WEDGE_R && x >= 0 && Math.abs(Math.atan2(y, x)) <= WEDGE_HALF,
    };
    this.init(params);
  }

  protected draw() {
    const s = this.graphicsStyle;
    if (s === "Wedge" || s === "Wedge with shading") lazyArt(this.visual, "lib/pie.svg", (a) => tintArt(a, this.tint));
    if (s === "Wedge with shading" || s === "Just shading") lazyArt(this.visual, "lib/wedge-shading.svg");
  }

  override applyForce(ctx: ForceContext) {
    const angle = compassAngle(ctx.local.x, ctx.local.y) * DEG;
    let xForce = this.strength * 0.4 * Math.sin(angle);
    let yForce = this.strength * 0.4 * Math.cos(angle);
    xForce *= this.scaleX;
    yForce *= this.scaleY;
    const rot = this.totalRotation() * DEG;
    ctx.addForce(xForce * Math.cos(rot) + yForce * Math.sin(rot), -(yForce * Math.cos(rot) - xForce * Math.sin(rot)));
  }
}

// -----------------------------------------------------------------------------
// Surfaces: Sand, Slick, Dimmer (direction-dependent)

/** How well the cursor's last movement aligns with a preferred direction (0..1). */
export function alignment(dep: DirectionDependency, depAngle: number, vx: number, vy: number, sqrt: boolean): number {
  if (dep === "None") return 1;
  const angle = compassAngle(vx, vy);
  if (Number.isNaN(angle)) return 1;
  let diff = Math.abs(angle - (depAngle % 360));
  if (dep === "One-way") {
    if (diff > 180) diff = 360 - diff;
    diff /= 180;
  } else {
    if (diff > 180) diff -= 180;
    if (diff > 90) diff = 180 - diff;
    diff /= 90;
  }
  const a = 1 - diff;
  return sqrt ? Math.sqrt(a) : a;
}

export interface SandParams extends ObjectParams {
  strengthRoughness?: number;
  strengthStickyness?: number;
  directionDependency?: DirectionDependency;
  dirDepAngle?: number;
  style?: "None" | "Square" | "Just shading" | "Square with shading";
  tint?: number;
}

/** Rough, sticky area: random friction while moving, extra speed loss. */
export class Sand extends PCObject {
  strengthRoughness = 3;
  strengthStickyness = 3;
  directionDependency: DirectionDependency = "None";
  dirDepAngle = 0;
  style: "None" | "Square" | "Just shading" | "Square with shading" = "Square with shading";
  tint = 0xdd2424;

  constructor(params?: SandParams) {
    super();
    this.hitShape = rect(0, 0, 100, 100);
    this.init(params);
  }

  override get soundStrength() {
    return this.strengthRoughness;
  }

  protected draw() {
    if (this.style === "Square" || this.style === "Square with shading") {
      lazyArt(this.visual, "lib/square.svg", (a, h) => {
        h.set({ x: 50, y: 50 });
        tintArt(a, this.tint);
      });
    }
    if (this.style === "Just shading" || this.style === "Square with shading") {
      lazyArt(this.visual, "lib/sand-shading.svg", (_a, h) => h.set({ x: 50, y: 50 }));
    }
  }

  override applyForce(ctx: ForceContext) {
    applySand(ctx, this.strengthRoughness, this.strengthStickyness, this.directionDependency, this.dirDepAngle);
  }
}

export function applySand(ctx: ForceContext, roughness: number, stickyness: number, dep: DirectionDependency, depAngle: number) {
  const vx = ctx.cursor.xLastDisp;
  const vy = ctx.cursor.yLastDisp;
  const a = alignment(dep, depAngle, vx, vy, true);
  ctx.addForce(
    ((roughness * (vx + vx + vx + vy)) / 8) * (Math.random() - 0.8) * a,
    ((roughness * (vx + vy + vy + vy)) / 8) * (Math.random() - 0.8) * a,
  );
  ctx.cursor.surfaceGrip = 1 + (stickyness * a) / 3;
}

export interface SlickParams extends ObjectParams {
  strength?: number;
  directionDependency?: DirectionDependency;
  dirDepAngle?: number;
  style?: "None" | "Square" | "Icy";
  tint?: number;
}

/** Low-grip area: cursors keep their speed (negative strength = sticky). */
export class Slick extends PCObject {
  strength = 3;
  directionDependency: DirectionDependency = "None";
  dirDepAngle = 0;
  style: "None" | "Square" | "Icy" = "Icy";
  tint = 0xdd2424;

  constructor(params?: SlickParams) {
    super();
    this.hitShape = rect(0, 0, 100, 100);
    this.init(params);
  }

  protected draw() {
    if (this.style === "Square" || this.style === "Icy") {
      lazyArt(this.visual, "lib/square.svg", (a, h) => {
        h.set({ x: 50, y: 50 });
        tintArt(a, this.tint);
      });
    }
    // (sic) AS2 used `if (__style = "Icy")`, so the ice is always drawn.
    lazyArt(this.visual, "lib/ice.svg", (_a, h) => h.set({ x: 50, y: 50 }));
  }

  override applyForce(ctx: ForceContext) {
    applySlick(ctx, this.strength, this.directionDependency, this.dirDepAngle);
  }
}

export function applySlick(ctx: ForceContext, strength: number, dep: DirectionDependency, depAngle: number) {
  const a = alignment(dep, depAngle, ctx.cursor.xLastDisp, ctx.cursor.yLastDisp, false);
  ctx.cursor.surfaceGrip = 1 - Math.abs(a * strength) / (a * strength + 2);
}

export type DimmerScopeParam = "Global forces" | "Local forces" | "Mouse" | "Global" | "Local";
export interface DimmerParams extends ObjectParams {
  /** Percentage of force that remains (0 = fully off). */
  dimmingFactor?: number;
  scope?: DimmerScopeParam;
  directionDependency?: DirectionDependency;
  dirDepAngle?: number;
  tint?: number;
}

export function normScope(s: DimmerScopeParam): "Global" | "Local" | "Mouse" {
  const l = s.toLowerCase();
  if (l.startsWith("global")) return "Global";
  if (l.startsWith("local")) return "Local";
  return "Mouse";
}

/** Weakens other forces (or the mouse) where it overlaps them. */
export class Dimmer extends PCObject {
  dimmingFactor = 0;
  scope: DimmerScopeParam = "Global forces";
  directionDependency: DirectionDependency = "None";
  dirDepAngle = 0;
  tint = 0xeeabab;

  constructor(params?: DimmerParams) {
    super();
    this.hitShape = rect(0, 0, 100, 100);
    this.init(params);
  }

  protected draw() {
    lazyArt(this.visual, "lib/square.svg", (a, h) => {
      h.set({ x: 50, y: 50 });
      tintArt(a, this.tint);
    });
  }

  override applyForce(ctx: ForceContext) {
    applyDimmer(ctx, this.dimmingFactor, this.scope, this.directionDependency, this.dirDepAngle);
  }
}

export function applyDimmer(ctx: ForceContext, factor: number, scope: DimmerScopeParam, dep: DirectionDependency, depAngle: number) {
  const a = alignment(dep, depAngle, ctx.cursor.xLastDisp, ctx.cursor.yLastDisp, true);
  ctx.addDimmer(100 - (100 - factor) * a, normScope(scope));
}

// -----------------------------------------------------------------------------
// Wall

/** An area the cursor can never enter (it steers around it). */
export class Wall extends PCObject {
  readonly isWall = true;
  tint = 0xdd2424;

  constructor(params?: { tint?: number }) {
    super();
    this.hitShape = rect(0, 0, 100, 100);
    this.init(params);
  }

  protected draw() {
    lazyArt(this.visual, "lib/square.svg", (a, h) => {
      h.set({ x: 50, y: 50 });
      tintArt(a, this.tint);
    });
  }
}

// -----------------------------------------------------------------------------
// Button (no force; PowerCursor events drive its look and an action)

export interface ButtonParams extends ObjectParams {
  style?: "None" | "Basic Rectangle" | "Basic Rounded" | "Basic Circle" | "PowerCursor";
  normalColor?: number;
  rolloverColor?: number;
  downColor?: number;
  /** Called on pc_mouseup (AS2 onRelease action/target/parameter). */
  onRelease?: () => void;
  width?: number;
  height?: number;
}

export class Button extends PCObject {
  style: NonNullable<ButtonParams["style"]> = "PowerCursor";
  normalColor = 0xff0000;
  rolloverColor = 0xff0000;
  downColor = 0xff0000;
  override rolloverCursorStyle = "Finger";
  onRelease: (() => void) | null = null;
  private w = 100;
  private h = 20;
  private skin: Clip | null = null;
  private fill: HTMLElement | null = null;

  constructor(params: ButtonParams = {}) {
    super();
    this.w = params.width ?? 100;
    this.h = params.height ?? 20;
    this.hitShape = rect(0, 0, this.w, this.h);
    this.init(params);
    const look = (state: "normal" | "rollover" | "down", color: number) => {
      if (this.style === "PowerCursor") this.skin?.gotoAndStop(state === "normal" ? 1 : state === "rollover" ? 2 : 3);
      else if (this.fill) this.fill.style.background = hex(color);
    };
    this.on("pc_rollin", () => look("rollover", this.rolloverColor));
    this.on("pc_rollout", () => look("normal", this.normalColor));
    this.on("pc_mousedown", () => look("down", this.downColor));
    this.on("pc_mouseup", () => {
      this.onRelease?.();
      look("rollover", this.rolloverColor);
    });
  }

  protected draw() {
    if (this.style === "PowerCursor") {
      lazyClip(this.visual, [1, 2, 3].map((i) => `lib/btn-powercursor/${i}.svg`), {}, (c) => {
        this.skin = c;
        c.set({ scaleX: this.w / 100, scaleY: this.h / 20 });
      });
    } else if (this.style !== "None") {
      const box = this.visual.addChild(new Node());
      const radius = this.style === "Basic Rounded" ? "6px" : this.style === "Basic Circle" ? "50%" : "0";
      box.el.style.cssText += `width:${this.w}px;height:${this.h}px;border-radius:${radius};background:${hex(this.normalColor)}`;
      this.fill = box.el;
    }
  }
}

export function hex(rgb: number): string {
  return "#" + rgb.toString(16).padStart(6, "0");
}

export type { HitShape };
