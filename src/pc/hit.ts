/** Shape-flag hit areas, all in the owning node's local coordinates. */
export type HitShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "path"; path: Path2D; rule?: CanvasFillRule }
  | { kind: "mask"; mask: AlphaMask }
  | { kind: "union"; shapes: HitShape[] }
  | { kind: "fn"; test: (x: number, y: number) => boolean };

/** A rasterised alpha mask: `data[row * w + col]` is alpha 0..255. */
export interface AlphaMask {
  /** Local coordinates of the mask's top-left corner. */
  x: number;
  y: number;
  /** Pixels per local unit. */
  res: number;
  w: number;
  h: number;
  data: Uint8Array;
}

let pathCtx: CanvasRenderingContext2D | null = null;
function ctx(): CanvasRenderingContext2D {
  if (!pathCtx) pathCtx = document.createElement("canvas").getContext("2d")!;
  return pathCtx;
}

export function hitShapeContains(s: HitShape, x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  switch (s.kind) {
    case "rect":
      return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
    case "ellipse": {
      const dx = (x - s.cx) / s.rx;
      const dy = (y - s.cy) / s.ry;
      return dx * dx + dy * dy <= 1;
    }
    case "path":
      return ctx().isPointInPath(s.path, x, y, s.rule ?? "nonzero");
    case "mask": {
      const m = s.mask;
      const col = Math.floor((x - m.x) * m.res);
      const row = Math.floor((y - m.y) * m.res);
      if (col < 0 || row < 0 || col >= m.w || row >= m.h) return false;
      return m.data[row * m.w + col] > 8;
    }
    case "union":
      return s.shapes.some((sh) => hitShapeContains(sh, x, y));
    case "fn":
      return s.test(x, y);
  }
}

export const rect = (x: number, y: number, w: number, h: number): HitShape => ({ kind: "rect", x, y, w, h });
export const circle = (cx: number, cy: number, r: number): HitShape => ({ kind: "ellipse", cx, cy, rx: r, ry: r });
export const pathShape = (d: string | Path2D, rule?: CanvasFillRule): HitShape => ({
  kind: "path",
  path: typeof d === "string" ? new Path2D(d) : d,
  rule,
});

/**
 * Rasterise an image (typically an SVG) into an alpha mask.
 * `regX/regY` is where local (0,0) sits inside the image.
 */
export function maskFromImage(img: CanvasImageSource, width: number, height: number, regX: number, regY: number, res = 2): AlphaMask {
  const w = Math.max(1, Math.ceil(width * res));
  const h = Math.max(1, Math.ceil(height * res));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext("2d", { willReadFrequently: true })!;
  c.drawImage(img, 0, 0, w, h);
  const rgba = c.getImageData(0, 0, w, h).data;
  const data = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3];
  return { x: -regX, y: -regY, res, w, h, data };
}
