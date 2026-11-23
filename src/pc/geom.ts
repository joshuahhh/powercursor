/** 2D affine matrix in Flash/CSS convention: [a c tx; b d ty]. */
export class Matrix {
  constructor(
    public a = 1,
    public b = 0,
    public c = 0,
    public d = 1,
    public tx = 0,
    public ty = 0,
  ) {}

  static fromTransform(
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    rotationDeg: number,
  ): Matrix {
    const r = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    return new Matrix(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y);
  }

  /** this * m  (apply m first, then this). */
  multiply(m: Matrix): Matrix {
    return new Matrix(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.tx + this.c * m.ty + this.tx,
      this.b * m.tx + this.d * m.ty + this.ty,
    );
  }

  invert(): Matrix {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) return new Matrix(0, 0, 0, 0, NaN, NaN);
    const a = this.d / det;
    const b = -this.b / det;
    const c = -this.c / det;
    const d = this.a / det;
    return new Matrix(a, b, c, d, -(a * this.tx + c * this.ty), -(b * this.tx + d * this.ty));
  }

  apply(x: number, y: number): Point {
    return { x: this.a * x + this.c * y + this.tx, y: this.b * x + this.d * y + this.ty };
  }

  /** Apply only the linear part (for direction vectors). */
  applyVector(x: number, y: number): Point {
    return { x: this.a * x + this.c * y, y: this.b * x + this.d * y };
  }

  toCSS(): string {
    return `matrix(${this.a},${this.b},${this.c},${this.d},${this.tx},${this.ty})`;
  }
}

export interface Point {
  x: number;
  y: number;
}

export const DEG = Math.PI / 180;

/**
 * The toolkit's favourite angle convention: degrees clockwise from "up" of the
 * vector (x, y) in y-down screen coordinates. Matches the AS2 idiom
 * `atan(x/-y)` + 180 when y > 0, including NaN for the zero vector.
 */
export function compassAngle(x: number, y: number): number {
  let angle = (Math.atan(x / -y) / (2 * Math.PI)) * 360;
  if (y > 0) angle += 180;
  return angle;
}
