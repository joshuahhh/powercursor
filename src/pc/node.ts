import { Matrix, type Point } from "./geom";
import type { HitShape } from "./hit";
import { hitShapeContains } from "./hit";

export type Handler<E = any> = (event: E) => void;

/**
 * Minimal Flash-MovieClip-like display node, backed by an absolutely positioned
 * <div>. Coordinates are in stage pixels relative to the parent; registration
 * point is local (0, 0). Rotation is in degrees, clockwise (Flash convention).
 */
export class Node {
  readonly el: HTMLElement;
  parent: Node | null = null;
  readonly children: Node[] = [];
  name = "";

  /** Shape-flag hit area in local coordinates. Children are tested too. */
  hitShape: HitShape | null = null;
  /** Whether hitTest() recurses into children. */
  hitChildren = true;

  /** Called every display frame while the node is on an active stage. */
  onEnterFrame: ((dtMs: number) => void) | null = null;

  /** Behaviours attached to this node (see behaviours.ts). */
  readonly behaviours: import("./behaviours").Behaviour[] = [];

  private _x = 0;
  private _y = 0;
  private _scaleX = 1;
  private _scaleY = 1;
  private _rotation = 0;
  private _alpha = 1;
  private _visible = true;
  private listeners = new Map<string, Set<Handler>>();

  constructor(el?: HTMLElement) {
    this.el = el ?? document.createElement("div");
    this.el.classList.add("pc-node");
  }

  // --- transform ----------------------------------------------------------

  get x() {
    return this._x;
  }
  set x(v: number) {
    if (Number.isNaN(v)) return;
    this._x = v;
    this.applyTransform();
  }
  get y() {
    return this._y;
  }
  set y(v: number) {
    if (Number.isNaN(v)) return;
    this._y = v;
    this.applyTransform();
  }
  get scaleX() {
    return this._scaleX;
  }
  set scaleX(v: number) {
    this.matrixOverride = null;
    this._scaleX = v;
    this.applyTransform();
  }
  get scaleY() {
    return this._scaleY;
  }
  set scaleY(v: number) {
    this.matrixOverride = null;
    this._scaleY = v;
    this.applyTransform();
  }
  /** Degrees, clockwise. */
  get rotation() {
    return this._rotation;
  }
  set rotation(v: number) {
    this.matrixOverride = null;
    this._rotation = v;
    this.applyTransform();
  }
  /** 0..1 (Flash _alpha / 100). */
  get alpha() {
    return this._alpha;
  }
  set alpha(v: number) {
    this._alpha = v;
    this.el.style.opacity = v >= 1 ? "" : String(Math.max(0, v));
  }
  get visible() {
    return this._visible;
  }
  set visible(v: boolean) {
    this._visible = v;
    this.el.style.display = v ? "" : "none";
  }

  /** Assign several properties at once; returns this for chaining. */
  set(props: Partial<Pick<Node, "x" | "y" | "scaleX" | "scaleY" | "rotation" | "alpha" | "visible" | "name">> & { scale?: number }): this {
    if (props.scale !== undefined) {
      this.matrixOverride = null;
      this._scaleX = props.scale;
      this._scaleY = props.scale;
    }
    for (const k of ["x", "y", "scaleX", "scaleY", "rotation", "alpha", "visible", "name"] as const) {
      if (props[k] !== undefined) (this as any)[k] = props[k];
    }
    this.applyTransform();
    return this;
  }

  private applyTransform() {
    const m = this.localMatrix();
    this.el.style.transform =
      m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1
        ? `translate(${m.tx}px,${m.ty}px)`
        : m.toCSS();
  }

  /** An explicit (possibly skewed) matrix, from setMatrix(); x/y still move it. */
  private matrixOverride: Matrix | null = null;

  /** Set an arbitrary affine transform (Flash matrices can skew). Clear with null. */
  setMatrix(m: Matrix | null): this {
    this.matrixOverride = m;
    if (m) {
      this._x = m.tx;
      this._y = m.ty;
      // Keep the decomposed values meaningful (objects read totalRotation / scale for force directions).
      this._rotation = (Math.atan2(m.b, m.a) * 180) / Math.PI;
      this._scaleX = Math.hypot(m.a, m.b);
      this._scaleY = (m.a * m.d - m.b * m.c) / (this._scaleX || 1);
    }
    this.applyTransform();
    return this;
  }

  localMatrix(): Matrix {
    const o = this.matrixOverride;
    if (o) return new Matrix(o.a, o.b, o.c, o.d, this._x, this._y);
    return Matrix.fromTransform(this._x, this._y, this._scaleX, this._scaleY, this._rotation);
  }

  /** Local bounding box of the hit shapes (own and children's), or null. */
  localBounds(): { x0: number; y0: number; x1: number; y1: number } | null {
    let b: { x0: number; y0: number; x1: number; y1: number } | null = null;
    const add = (x0: number, y0: number, x1: number, y1: number) => {
      b = b ? { x0: Math.min(b.x0, x0), y0: Math.min(b.y0, y0), x1: Math.max(b.x1, x1), y1: Math.max(b.y1, y1) } : { x0, y0, x1, y1 };
    };
    const shape = (h: HitShape) => {
      if (h.kind === "rect") add(h.x, h.y, h.x + h.w, h.y + h.h);
      else if (h.kind === "ellipse") add(h.cx - h.rx, h.cy - h.ry, h.cx + h.rx, h.cy + h.ry);
      else if (h.kind === "mask") add(h.mask.x, h.mask.y, h.mask.x + h.mask.w / h.mask.res, h.mask.y + h.mask.h / h.mask.res);
      else if (h.kind === "union") h.shapes.forEach(shape);
    };
    if (this.hitShape) shape(this.hitShape);
    for (const c of this.children) {
      const cb = c.localBounds();
      if (!cb) continue;
      const m = c.localMatrix();
      for (const [x, y] of [[cb.x0, cb.y0], [cb.x1, cb.y0], [cb.x0, cb.y1], [cb.x1, cb.y1]]) {
        const p = m.apply(x, y);
        add(p.x, p.y, p.x, p.y);
      }
    }
    return b;
  }

  /** Diagonal of the bounding box in stage pixels (AS2 sqrt(_width² + _height²)). */
  globalDiagonal(): number {
    const b = this.localBounds();
    if (!b) return 0;
    const m = this.globalMatrix();
    const pts = [m.apply(b.x0, b.y0), m.apply(b.x1, b.y0), m.apply(b.x0, b.y1), m.apply(b.x1, b.y1)];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  }

  /** Matrix from local space to stage space. */
  globalMatrix(): Matrix {
    let m = this.localMatrix();
    for (let p = this.parent; p && p.parent; p = p.parent) m = p.localMatrix().multiply(m);
    return m;
  }

  globalToLocal(p: Point): Point {
    return this.globalMatrix().invert().apply(p.x, p.y);
  }

  localToGlobal(p: Point): Point {
    return this.globalMatrix().apply(p.x, p.y);
  }

  /** Sum of rotations up the chain (AS2 `totalRotation`). */
  totalRotation(): number {
    let r = 0;
    for (let n: Node | null = this; n; n = n.parent) r += n._rotation;
    return r;
  }

  // --- tree ---------------------------------------------------------------

  addChild<T extends Node>(child: T): T {
    child.parent?.removeChild(child);
    this.children.push(child);
    child.parent = this;
    this.el.appendChild(child.el);
    return child;
  }

  addChildAt<T extends Node>(child: T, index: number): T {
    child.parent?.removeChild(child);
    const before = this.children[index];
    this.children.splice(index, 0, child);
    child.parent = this;
    this.el.insertBefore(child.el, before ? before.el : null);
    return child;
  }

  removeChild(child: Node) {
    const i = this.children.indexOf(child);
    if (i >= 0) this.children.splice(i, 1);
    if (child.el.parentNode === this.el) this.el.removeChild(child.el);
    child.parent = null;
  }

  remove() {
    this.parent?.removeChild(this);
  }

  /** The root of the tree this node is in. */
  root(): Node {
    let n: Node = this;
    while (n.parent) n = n.parent;
    return n;
  }

  /** Depth-first, pre-order (paint order). */
  *walk(): Generator<Node> {
    yield this;
    for (const c of [...this.children]) yield* c.walk();
  }

  addBehaviour<B extends import("./behaviours").Behaviour>(b: B): B {
    this.behaviours.push(b);
    b.attach(this);
    return b;
  }

  // --- hit testing ----------------------------------------------------------

  /** Flash `hitTest(x, y, true)`: is the stage point on this node's shapes? */
  hitTest(gx: number, gy: number): boolean {
    if (this.hitShape) {
      const p = this.globalToLocal({ x: gx, y: gy });
      if (hitShapeContains(this.hitShape, p.x, p.y)) return true;
    }
    if (this.hitChildren) {
      for (const c of this.children) if (c.hitTest(gx, gy)) return true;
    }
    return false;
  }

  // --- events -----------------------------------------------------------------

  on<E = any>(type: string, fn: Handler<E>): () => void {
    let set = this.listeners.get(type);
    if (!set) this.listeners.set(type, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  off(type: string, fn: Handler) {
    this.listeners.get(type)?.delete(fn);
  }

  emit(type: string, event: any) {
    const set = this.listeners.get(type);
    if (set) for (const fn of [...set]) fn(event);
  }
}
