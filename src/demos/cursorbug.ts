import { ArrowCursor, ButtonMaker, Hill, Node, Pushgutter, Timeline, art, asset, audio, isMuted, loadSound, type FrameProps } from "../pc";
import type { Demo } from "./types";

/*
 * Spec: reference/specs/cursorbug.md
 *
 * mc_video (sprite 13) is a 25 fps Timeline; the embedded video streams are three <video> clips kept
 * in step with it. All force objects are invisible.
 */

const FPS = 25;
const DIR = "demos/cursorbug/";

type M6 = [number, number, number, number, number, number];

/** Depth-8 PushGutter keyframes per mc_video frame (no skew): instance A 75-76, B 77-81, C 116-121. */
// prettier-ignore
const GUTTER: Record<number, M6> = {
  75: [0.38519, -0.013092, 0.13326, 3.9172, 176.55, 90.45],
  76: [0.52077, -0.028915, 0.2171, 3.9112, 177.6, 55.4],
  77: [0.45882, 0.11714, -1.0948, 4.288, 213, 37.55],
  78: [0.47041, 0.10696, -0.99629, 4.3823, 232.2, 39.15],
  79: [0.18997, 0.39516, -3.8838, 1.8675, 309.5, 79.45],
  80: [0.066544, 0.43333, -4.0051, 0.61505, 321.4, 113.6],
  81: [-1.5259e-5, 0.41777, -3.5987, 3.0518e-5, 318.05, 134.1],
  116: [-0.33186, -0.081299, 0.92467, -3.7756, 258.15, 164.1],
  117: [-0.42793, -0.14552, 1.1977, -3.5225, 269.75, 149.35],
  118: [-0.39473, -0.23676, 1.9488, -3.2494, 248, 141.55],
  119: [-0.47444, 0.11629, -0.89244, -3.6402, 226.35, 153],
  120: [-0.31235, 0.32512, -2.7522, -2.6439, 227.7, 147.9],
  121: [-0.14825, 0.4263, -3.3813, -1.1758, 238.2, 144.75],
};

/** A skew-free Flash matrix as Node x/y/scale/rotation (the gutter's push direction comes from its rotation). */
function fromMatrix([a, b, c, d, tx, ty]: M6): FrameProps {
  return { x: tx, y: ty, scaleX: Math.hypot(a, b), scaleY: Math.hypot(c, d), rotation: (Math.atan2(b, a) * 180) / Math.PI };
}

type ClipName = "idle" | "left" | "right";

/** The video layer: one <video> per clip, shown and kept within a couple of frames of the timeline. */
class VideoLayer extends Node {
  readonly videos: Record<ClipName, HTMLVideoElement>;
  private active: HTMLVideoElement | null = null;

  constructor() {
    super();
    const make = (file: string) => {
      const v = document.createElement("video");
      v.src = asset(DIR + file);
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      v.disablePictureInPicture = true;
      // 500x376 (H.264 needs even sizes); the stage clips the padding row and the 8 px past x=492.
      v.style.cssText = "position:absolute;left:0;top:0;width:500px;height:376px;visibility:hidden;pointer-events:none";
      this.el.appendChild(v);
      return v;
    };
    this.videos = { idle: make("video-idle.mp4"), left: make("video-hit-left.mp4"), right: make("video-hit-right.mp4") };
    this.videos.idle.autoplay = true;
  }

  /** Resolves once every clip can show its first frame (or after a timeout). */
  ready(): Promise<void> {
    const one = (v: HTMLVideoElement) =>
      new Promise<void>((res) => {
        if (v.readyState >= 2) return res();
        v.addEventListener("loadeddata", () => res(), { once: true });
        v.addEventListener("error", () => res(), { once: true });
        setTimeout(res, 4000);
      });
    return Promise.all(Object.values(this.videos).map(one)).then(() => undefined);
  }

  /** Show video frame `index` (0-based) of `clip`. */
  sync(clip: ClipName, index: number) {
    const v = this.videos[clip];
    const t = (index + 0.3) / FPS;
    if (v !== this.active) {
      const prev = this.active;
      this.active = v;
      // Keep the old clip up until the new one has reached its frame.
      const reveal = () => {
        if (this.active !== v) return;
        for (const o of Object.values(this.videos)) o.style.visibility = o === v ? "" : "hidden";
        if (prev && prev !== v) {
          prev.pause();
          prev.currentTime = 0; // ready for its next start
        }
      };
      if (Math.abs(v.currentTime - t) > 0.5 / FPS) {
        v.currentTime = t;
        v.addEventListener("seeked", reveal, { once: true });
      } else reveal();
    } else if (!v.seeking && Math.abs(v.currentTime * FPS - (index + 0.5)) > 2) {
      v.currentTime = t;
    }
    if (v.paused) void v.play().catch(() => {});
  }

  dispose() {
    for (const v of Object.values(this.videos)) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
  }
}

const demo: Demo = {
  id: "cursorbug",
  title: "Cursor Bug",
  description: "You are cursor bug flying in the room. Try to land it on his Nose! Created by Holland Interactive",
  icon: "cursorbug.jpg",
  width: 492,
  height: 375,
  background: "#FFFFFF",
  fps: FPS,
  original: "cursorbug.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: true, bouncingBalls: true, hideAllObjects: false },
  async build({ stage, engine }) {
    // --- sound: `new Sound(_root)` sets the GLOBAL volume and pan, so "hit" goes through the same bus ---
    const ctx = audio();
    const master = ctx.createGain();
    // Flash setPan is a balance control (the far channel fades linearly), not an equal-power pan.
    const left = ctx.createGain();
    const right = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    master.connect(left).connect(merger, 0, 0);
    master.connect(right).connect(merger, 0, 1);
    merger.connect(ctx.destination);
    let disposed = false;
    let buzz: AudioBufferSourceNode | null = null;
    void loadSound(DIR + "buzz.mp3").then((buf) => {
      if (!buf || disposed) return;
      buzz = ctx.createBufferSource();
      buzz.buffer = buf;
      buzz.loop = true; // buzz.start(0, 99999)
      buzz.connect(master);
      buzz.start();
    });
    const hitSound = loadSound(DIR + "hit.mp3");
    const playHit = async () => {
      const buf = await hitSound;
      if (!buf || disposed || isMuted()) return;
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      g.gain.value = 16236 / 32768; // StartSound envelope
      src.buffer = buf;
      src.connect(g).connect(master);
      src.start();
    };

    // --- mc_video ---------------------------------------------------------------------------
    const tl = stage.addChild(new Timeline({ frames: 140, fps: FPS, labels: { start: 1, start_loop: 14, hit_left: 75, hit_right: 115 } }));
    const video = new VideoLayer();
    tl.placeAlways(video, 1);
    // The brass knob (doorbell) top right: an invisible bump.
    const hill = new Hill({ strength: 15, shape: "U-shaped", plateauDiameter: 20, style: "None", tint: 0xdd2424, rolloverCursorStyle: "Null", rolloverCursorSound: "" });
    tl.placeAlways(hill.set({ x: 424.8, y: 32.65, scale: 0.235992 }), 2);

    const gutter = (tint: number) =>
      new Pushgutter({
        strength: 0,
        pushStrength: 250,
        shape: "U-shaped",
        plateauDiameter: 100,
        arrowStyle: "None",
        graphicsStyle: "None",
        tint,
        rolloverCursorStyle: "Null",
        rolloverCursorSound: "",
      });
    // A fresh instance on each entry: A 75-76, B 77-81, C 116-121, one keyframe per frame.
    const keys = (from: number, to: number) => Object.fromEntries(Object.entries(GUTTER).filter(([f]) => +f >= from && +f <= to).map(([f, m]) => [f, fromMatrix(m)]));
    tl.place(() => gutter(0), 75, 76, 8, keys(75, 76));
    tl.place(() => gutter(0xdd2424), 77, 81, 8, keys(77, 81));
    tl.place(() => gutter(0xdd2424), 116, 121, 8, keys(116, 121));

    // The two invisible halves of the head (alpha 0, still hit-tested). Their names are crossed, as in the original.
    const zone = async (file: string, x: number, y: number, depth: number, label: string) => {
      const z = new Node().set({ x, y, alpha: 0 });
      z.addChild(await art(DIR + file, { hit: true }));
      // Its parent has one frame, so only the cursor style matters.
      z.addBehaviour(new ButtonMaker({ out: 1, over: 2, down: 3, up: 2, rolloverCursorStyle: "Arrow" }));
      z.on("pc_rollin", () => tl.gotoAndPlay(label));
      return tl.placeAlways(z, depth);
    };
    await Promise.all([zone("hit-zone-left.svg", 215, 104, 14, "hit_right"), zone("hit-zone-right.svg", 267, 103.5, 17, "hit_left")]);

    // Frame scripts: the jumps first; the target's actions run after, so a frame that jumps is replaced by its target.
    tl.script(69, () => (tl.gotoAndStop("start_loop"), tl.play()));
    tl.script(111, () => (tl.gotoAndStop("start"), tl.play()));
    tl.script(140, () => (tl.gotoAndStop("start_loop"), tl.play()));
    tl.script(75, () => void playHit());
    tl.script(115, () => void playHit());
    for (let f = 1; f <= 140; f++) {
      tl.script(f, () => {
        if (tl.currentFrame !== f) return;
        if (f <= 69) video.sync("idle", f - 1);
        else if (f >= 75 && f <= 111) video.sync("left", Math.min(35, f - 75));
        else if (f >= 115) video.sync("right", f - 115);
      });
    }

    await video.ready();
    tl.begin(true);

    const cursor = stage.addChild(await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 }));
    engine.placeCursors(60, 300);

    // Main timeline frame 3: buzz volume follows cursor movement, pan follows cursor x (25 Hz).
    let vol = 100;
    let oldX: number | undefined;
    let oldY: number | undefined;
    let acc = 0;
    const offFrame = engine.onFrame((dt) => {
      acc += dt;
      while (acc >= 1000 / FPS) {
        acc -= 1000 / FPS;
        const rel = cursor.x / 500; // (cursor._x - mc_video._x) / mc_video._width
        const pan = Math.max(-100, Math.min(100, Math.round((rel - 0.5) * 2 * 100)));
        if (cursor.x !== oldX || cursor.y !== oldY) {
          oldX = cursor.x;
          oldY = cursor.y;
          vol = Math.trunc(Math.max(2, Math.min(100, vol * 2)));
        } else {
          vol = Math.trunc(vol / 1.2);
        }
        const now = ctx.currentTime;
        master.gain.setTargetAtTime(vol / 100, now, 0.01);
        left.gain.setTargetAtTime(pan > 0 ? 1 - pan / 100 : 1, now, 0.01);
        right.gain.setTargetAtTime(pan < 0 ? 1 + pan / 100 : 1, now, 0.01);
      }
    });

    return () => {
      disposed = true;
      offFrame();
      try {
        buzz?.stop();
      } catch {
        /* not started */
      }
      master.disconnect();
      merger.disconnect();
      video.dispose();
    };
  },
};

export default demo;
