import { loadArt, Art } from "./art";
import type { Cursor } from "./cursor";
import type { Engine } from "./engine";
import { Node } from "./node";

/**
 * PowerGrid: visualises the force field by distorting a grid (and shading
 * walls). Covers the whole stage by default. Purely visual.
 */
export class ForceGrid extends Node {
  private canvas: HTMLCanvasElement;
  private acc = 0;
  cell = 16;
  /** Pixels of grid distortion per unit of force. */
  gain = 6;
  /** Redraw interval in ms. */
  interval = 80;

  constructor(
    private engine: Engine,
    private area = { x: 0, y: 0, w: engine.stage.width, h: engine.stage.height },
  ) {
    super();
    this.el.classList.add("pc-forcegrid");
    this.canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = area.w * dpr;
    this.canvas.height = area.h * dpr;
    this.canvas.style.cssText = `position:absolute;left:${area.x}px;top:${area.y}px;width:${area.w}px;height:${area.h}px;pointer-events:none`;
    this.el.appendChild(this.canvas);
    this.onEnterFrame = (dt) => {
      this.acc += dt;
      if (this.acc < this.interval) return;
      this.acc = 0;
      this.draw();
    };
  }

  draw() {
    const { x: ax, y: ay, w, h } = this.area;
    const ctx = this.canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const n = this.cell;
    const cols = Math.ceil(w / n) + 1;
    const rows = Math.ceil(h / n) + 1;
    const pts: { x: number; y: number; wall: boolean }[][] = [];
    const tmpl = this.engine.cursors.find((c) => c.mouseLink) as Cursor | undefined;
    for (let r = 0; r < rows; r++) {
      const row: { x: number; y: number; wall: boolean }[] = [];
      for (let c = 0; c < cols; c++) {
        const gx = ax + c * n;
        const gy = ay + r * n;
        const f = this.engine.probe(gx, gy, tmpl);
        const len = Math.hypot(f.x, f.y);
        const max = n * 0.9;
        const s = len * this.gain > max ? max / len : this.gain;
        row.push({ x: c * n + f.x * s, y: r * n + f.y * s, wall: this.engine.isOnWall(gx, gy) });
      }
      pts.push(row);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(120, 220, 255, 0.55)";
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = pts[r][c];
        if (c === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const p = pts[r][c];
        if (r === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 80, 80, 0.35)";
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (pts[r][c].wall) ctx.fillRect(c * n - n / 2, r * n - n / 2, n, n);
  }
}

/** PC_Watcher: shows one cursor's position, speed, forcing objects and force. */
export class Watcher extends Node {
  private text: HTMLElement;
  private arrow: HTMLElement;

  constructor(
    private engine: Engine,
    private cursorIndex = 0,
  ) {
    super();
    this.el.classList.add("pc-watcher");
    void loadArt("lib/watcher.svg").then((info) => this.addChildAt(new Art(info), 0));
    this.text = document.createElement("div");
    this.text.className = "pc-watcher-text";
    this.el.appendChild(this.text);
    this.arrow = document.createElement("div");
    this.arrow.className = "pc-watcher-arrow";
    this.el.appendChild(this.arrow);
    this.onEnterFrame = () => this.update();
  }

  private update() {
    const cur = this.engine.cursors[this.cursorIndex];
    if (!cur) return;
    const f = this.engine.lastForce.get(cur) ?? { x: 0, y: 0 };
    const objs = this.engine.lastForcers.get(cur) ?? "";
    this.text.innerHTML =
      `<span>Position:</span> ${Math.round(cur.x)}, ${Math.round(cur.y)}<br>` +
      `<span>Speed:</span> ${cur.xSpeed.toFixed(1)}, ${cur.ySpeed.toFixed(1)}<br>` +
      `<span>Object:</span> ${objs ? escapeHtml(objs) : "-"}<br>` +
      `<span>Force:</span> ${f.x.toFixed(2)}, ${f.y.toFixed(2)}`;
    const len = Math.hypot(f.x, f.y);
    const ang = Math.atan2(f.x, -f.y);
    this.arrow.style.transform = `rotate(${ang}rad) scaleY(${Math.min(2.5, 0.3 + len)})`;
    this.arrow.style.opacity = len > 0.01 ? "1" : "0.3";
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
