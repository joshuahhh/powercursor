import { Art, Clip, loadArt, preload } from "./art";
import { Node } from "./node";
import { CursorSound } from "./sound";

export type CursorStyle = "Arrow" | "MacArrow" | "Finger" | "Ball" | "Hand" | "GrabHand";
export const CURSOR_STYLES: CursorStyle[] = ["Arrow", "MacArrow", "Finger", "Ball", "Hand", "GrabHand"];

export interface CursorParams {
  /** How quickly speed decays (0-100). AS2 default 50. */
  grip?: number;
  /** How slowly forces build up speed. AS2 default 10. */
  inertia?: number;
  /** Treat mouse movement as a force (balls) instead of a direct displacement. */
  mouseAsForce?: boolean;
}

/**
 * PC_Cursor: anything the engine displaces. Its position is the node's x/y
 * (the registration point is the hotspot).
 */
export class Cursor extends Node {
  grip = 50;
  inertia = 10;
  isBall = false;
  mouseLink = true;
  mouseAsForce = false;

  xSpeed = 0;
  ySpeed = 0;
  xLastMouseDisp = 0;
  yLastMouseDisp = 0;
  xLastForceDisp = 0;
  yLastForceDisp = 0;
  /** Set by surfaces (sand, slick) each frame; reset to 1 by the engine. */
  surfaceGrip = 1;

  /** Normalised to the engine's reference frame (see Engine.refFps). */
  get xLastDisp() {
    return this.xLastForceDisp + this.xLastMouseDisp;
  }
  get yLastDisp() {
    return this.yLastForceDisp + this.yLastMouseDisp;
  }

  readonly sound = new CursorSound();

  constructor(params: CursorParams = {}) {
    super();
    this.el.classList.add("pc-cursor");
    this.hitChildren = false;
    Object.assign(this, params);
  }

  setSpeed(xs: number, ys: number) {
    if (Number.isNaN(xs) || Number.isNaN(ys)) return;
    this.xSpeed = xs;
    this.ySpeed = ys;
  }

  setPosition(x: number, y: number) {
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    this.set({ x, y });
  }

  displace(dx: number, dy: number) {
    if (Number.isNaN(dx) || Number.isNaN(dy)) return;
    this.sound.onDisplace(dx, dy);
    this.set({ x: this.x + dx, y: this.y + dy });
  }

  /** Cursors with styles override this. */
  setCursorStyle(_style: CursorStyle | "Default" | "Null" | string) {}

  /** Visual only; the hotspot keeps working (AS2 sets graphics alpha). */
  get shown() {
    return this.el.style.visibility !== "hidden";
  }
  set shown(v: boolean) {
    this.el.style.visibility = v ? "" : "hidden";
  }
}

/** PC_ArrowCursor: the default mouse-linked cursor with switchable icons. */
export class ArrowCursor extends Cursor {
  private clip!: Clip;
  private defaultStyle: CursorStyle = "Arrow";
  private _style = "Arrow";

  static async create<T extends ArrowCursor>(this: new (p?: CursorParams) => T, params: CursorParams & { cursorStyle?: CursorStyle } = {}): Promise<T> {
    const infos = await preload(CURSOR_STYLES.map((s) => `lib/cursor/${s}.svg`));
    const c = new this(params);
    const labels: Record<string, number> = {};
    CURSOR_STYLES.forEach((s, i) => (labels[s] = i + 1));
    c.clip = c.addChild(new Clip(infos, { labels }));
    c.defaultStyle = params.cursorStyle ?? "Arrow";
    c._style = c.defaultStyle;
    c.showStyle(c.defaultStyle);
    return c;
  }

  /** The current style name (may be a name with no icon, like "Null"). */
  get style() {
    return this._style;
  }

  /**
   * AS2 setCursorStyle: only acts when the name changes; "Default" means the
   * cursor's own default. Names without an icon ("Null", "") change only the
   * name, keeping the current picture.
   */
  override setCursorStyle(style: string) {
    if (style === this._style) return;
    this._style = style === "Default" ? this.defaultStyle : style;
    this.showStyle(this._style);
  }

  /** Change only the picture (AS2 `cursor.gotoAndStop("Finger")`), not the style name. */
  showStyle(style: string) {
    const s = CURSOR_STYLES.find((c) => c.toLowerCase() === style.toLowerCase());
    if (s) this.clip.gotoAndStop(s);
  }
}

/**
 * PC_PowerBall: a free-floating ball moved only by forces. Mass (for
 * collisions) grows with scale squared; radius is 10px * scale.
 */
export class PowerBall extends Cursor {
  override isBall = true;
  override mouseLink = false;
  override mouseAsForce = true;

  static async create<T extends PowerBall>(
    this: new (p?: CursorParams) => T,
    params: CursorParams & { tint?: number; scale?: number } = {},
  ): Promise<T> {
    const [disc, shading] = await Promise.all([loadArt("lib/ball-disc.svg"), loadArt("lib/ball-shading.svg")]);
    const b = new this(params);
    const g = b.addChild(new Node());
    g.set({ x: -9.75, y: -9.75 });
    const d = g.addChild(new Art(disc));
    tintArt(d, params.tint ?? 0xdd2424);
    g.addChild(new Art(shading));
    if (params.scale) b.set({ scale: params.scale });
    return b;
  }

  /** Collision radius in stage px. */
  get radius() {
    return 10 * this.scaleX;
  }
}

/** PC_BallCursor: a PowerBall that is linked to the mouse (as a force). */
export class BallCursor extends PowerBall {
  override mouseLink = true;
}

/** Flash Color.setRGB: replace every colour with `rgb`, keeping alpha. */
export function tintArt(a: Art, rgb: number) {
  const hex = "#" + rgb.toString(16).padStart(6, "0");
  // CSS mask: paint a solid colour through the image's alpha.
  const box = document.createElement("div");
  box.className = "pc-art";
  const img = a.img;
  box.style.cssText = img.style.cssText;
  box.style.background = hex;
  box.style.maskImage = box.style.webkitMaskImage = `url("${img.src}")`;
  box.style.maskSize = box.style.webkitMaskSize = "100% 100%";
  img.replaceWith(box);
}
