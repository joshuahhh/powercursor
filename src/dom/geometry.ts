/** How an attached element's area is tested and measured. */
export type ShapeKind = "auto" | "rect" | "ellipse";

/** A point relative to an attached element, for fields to sample. */
export interface LocalPoint {
  /** Offset from the element's centre, in px. */
  dx: number;
  dy: number;
  /** Element size in px. */
  width: number;
  height: number;
  /** Offset normalised to the half-size: -1..1 across the box. */
  u: number;
  v: number;
  /** Elliptical radius: 0 at the centre, 1 on the inscribed ellipse. */
  r: number;
}

/** A per-frame snapshot of an element's geometry. */
export class Geometry {
  readonly rect: DOMRect;
  readonly kind: "rect" | "ellipse" | "svg";
  private radius = 0;

  constructor(
    readonly el: Element,
    shape: ShapeKind,
  ) {
    this.rect = el.getBoundingClientRect();
    if (el instanceof SVGGeometryElement && shape === "auto") {
      this.kind = "svg";
    } else if (shape === "auto") {
      const cs = getComputedStyle(el);
      const r = parseFloat(cs.borderTopLeftRadius) || 0;
      const min = Math.min(this.rect.width, this.rect.height);
      if (cs.borderTopLeftRadius.endsWith("%") ? parseFloat(cs.borderTopLeftRadius) >= 50 : r >= min / 2 - 0.5) this.kind = "ellipse";
      else {
        this.kind = "rect";
        this.radius = Math.min(r, min / 2);
      }
    } else {
      this.kind = shape;
    }
  }

  contains(x: number, y: number): boolean {
    const { left, top, width, height } = this.rect;
    if (x < left || y < top || x > left + width || y > top + height) return false;
    if (this.kind === "ellipse") return this.local(x, y).r <= 1;
    if (this.kind === "svg") {
      const g = this.el as SVGGeometryElement;
      const m = g.getScreenCTM();
      if (!m) return false;
      const p = new DOMPoint(x, y).matrixTransform(m.inverse());
      return g.isPointInFill(p) || g.isPointInStroke(p);
    }
    if (this.radius > 0) {
      // rounded corners
      const rx = Math.max(left + this.radius - x, x - (left + width - this.radius), 0);
      const ry = Math.max(top + this.radius - y, y - (top + height - this.radius), 0);
      return rx * rx + ry * ry <= this.radius * this.radius;
    }
    return true;
  }

  local(x: number, y: number): LocalPoint {
    const { left, top, width, height } = this.rect;
    const dx = x - (left + width / 2);
    const dy = y - (top + height / 2);
    const u = width ? dx / (width / 2) : 0;
    const v = height ? dy / (height / 2) : 0;
    return { dx, dy, width, height, u, v, r: Math.hypot(u, v) };
  }
}
