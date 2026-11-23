import { Node } from "./node";
import { maskFromImage, type AlphaMask, type HitShape } from "./hit";

/** Resolve a path inside /public, honouring Vite's base URL. */
export function asset(path: string): string {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}

export interface ArtInfo {
  url: string;
  width: number;
  height: number;
  /** Where the symbol's registration point (local 0,0) sits inside the image. */
  regX: number;
  regY: number;
  img: HTMLImageElement;
}

const cache = new Map<string, Promise<ArtInfo>>();
const loaded = new Map<string, ArtInfo>();
const masks = new Map<string, AlphaMask>();

/**
 * Load an image. For JPEXS SVG exports the registration offset is read from
 * the root `<g transform="matrix(1,0,0,1,tx,ty)">`; bitmaps default to (0,0).
 */
export function loadArt(path: string, reg?: { x: number; y: number }): Promise<ArtInfo> {
  const url = asset(path);
  const key = url + (reg ? `#${reg.x},${reg.y}` : "");
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      let regX = reg?.x ?? 0;
      let regY = reg?.y ?? 0;
      let width = 0;
      let height = 0;
      if (/\.svg(\?|$)/i.test(url)) {
        const text = await (await fetch(url)).text();
        const head = text.slice(0, 2000);
        width = parseFloat(/\swidth="([\d.]+)/.exec(head)?.[1] ?? "0");
        height = parseFloat(/\sheight="([\d.]+)/.exec(head)?.[1] ?? "0");
        const m = /<g transform="matrix\(([^)]*)\)"/.exec(head);
        if (m && !reg) {
          const v = m[1].split(",").map(Number);
          regX = v[4];
          regY = v[5];
        }
      }
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode().catch(() => undefined);
      if (!width) width = img.naturalWidth;
      if (!height) height = img.naturalHeight;
      const info: ArtInfo = { url, width, height, regX, regY, img };
      loaded.set(key, info);
      return info;
    })();
    cache.set(key, p);
  }
  return p;
}

export function preload(paths: string[]): Promise<ArtInfo[]> {
  return Promise.all(paths.map((p) => loadArt(p)));
}

export function artMask(info: ArtInfo, res = 2): AlphaMask {
  const key = `${info.url}@${res}`;
  let m = masks.get(key);
  if (!m) {
    m = maskFromImage(info.img, info.width, info.height, info.regX, info.regY, res);
    masks.set(key, m);
  }
  return m;
}

/** A node showing one image, with its registration point at local (0,0). */
export class Art extends Node {
  readonly info: ArtInfo;
  readonly img: HTMLImageElement;

  constructor(info: ArtInfo, opts: { hit?: boolean } = {}) {
    super();
    this.info = info;
    const img = info.img.cloneNode() as HTMLImageElement;
    img.draggable = false;
    img.className = "pc-art";
    img.style.left = `${-info.regX}px`;
    img.style.top = `${-info.regY}px`;
    img.style.width = `${info.width}px`;
    img.style.height = `${info.height}px`;
    this.el.appendChild(img);
    this.img = img;
    if (opts.hit) this.hitShape = { kind: "mask", mask: artMask(info) };
  }

  /** Use the image's alpha as the hit area (Flash shape-flag hit testing). */
  enableHit(res = 2): this {
    this.hitShape = { kind: "mask", mask: artMask(this.info, res) };
    return this;
  }
}

/** Load + construct an Art node. */
export async function art(path: string, opts: { hit?: boolean; reg?: { x: number; y: number } } = {}): Promise<Art> {
  return new Art(await loadArt(path, opts.reg), opts);
}

/**
 * A multi-frame clip (Flash MovieClip timeline), one image per frame.
 * Frames are 1-based like Flash. Plays at `fps` when playing.
 */
export class Clip extends Node {
  readonly frames: Art[];
  readonly labels: Record<string, number>;
  fps: number;
  playing = false;
  loop = true;
  private _frame = 1;
  private acc = 0;
  /** Called when the playhead enters a frame (after it is shown). */
  onFrame: ((frame: number) => void) | null = null;

  constructor(infos: ArtInfo[], opts: { fps?: number; labels?: Record<string, number>; hit?: boolean; play?: boolean } = {}) {
    super();
    this.frames = infos.map((i) => this.addChild(new Art(i, { hit: opts.hit })));
    this.labels = opts.labels ?? {};
    this.fps = opts.fps ?? 25;
    this.playing = opts.play ?? false;
    this.show(1);
    this.onEnterFrame = (dt) => {
      if (!this.playing || this.frames.length < 2) return;
      this.acc += dt;
      const step = 1000 / this.fps;
      while (this.acc >= step) {
        this.acc -= step;
        let next = this._frame + 1;
        if (next > this.frames.length) {
          if (!this.loop) {
            this.playing = false;
            break;
          }
          next = 1;
        }
        this.show(next);
      }
    };
  }

  /** Only the visible frame takes part in hit testing (like a real timeline). */
  override hitTest(gx: number, gy: number): boolean {
    if (this.hitShape && super.hitTest(gx, gy)) return true;
    return this.frames[this._frame - 1]?.hitTest(gx, gy) ?? false;
  }

  get currentFrame() {
    return this._frame;
  }
  get totalFrames() {
    return this.frames.length;
  }

  private show(n: number) {
    this._frame = n;
    this.frames.forEach((f, i) => (f.visible = i === n - 1));
    this.onFrame?.(n);
  }

  private resolve(f: number | string): number {
    const n = typeof f === "string" ? (this.labels[f] ?? Object.entries(this.labels).find(([k]) => k.toLowerCase() === f.toLowerCase())?.[1]) : f;
    if (n === undefined) throw new Error(`Unknown frame label ${f}`);
    return Math.min(Math.max(1, n), this.frames.length);
  }

  gotoAndStop(f: number | string) {
    this.playing = false;
    this.show(this.resolve(f));
  }
  gotoAndPlay(f: number | string) {
    this.acc = 0;
    this.playing = true;
    this.show(this.resolve(f));
  }
  play() {
    this.playing = true;
  }
  stop() {
    this.playing = false;
  }
}

export async function clip(paths: string[], opts: ConstructorParameters<typeof Clip>[1] = {}): Promise<Clip> {
  return new Clip(await preload(paths), opts);
}

export function hitFromArt(info: ArtInfo, res = 2): HitShape {
  return { kind: "mask", mask: artMask(info, res) };
}
