import {
  Art,
  ArrowCursor,
  Clip,
  Dimmer,
  DraggerMaker,
  EventDispatcher,
  Gutter,
  Hill,
  Hole,
  Node,
  Pushgutter,
  Timeline,
  Twister,
  Wall,
  WallMaker,
  Watcher,
  loadArt,
  type ArtInfo,
  type Engine,
  type FrameProps,
  type Keyframe,
  type PCEvent,
  type PCObject,
  type TimelineOptions,
} from "../pc";
import { buildHeaderbar } from "./parts/headerbar";
import type { Demo } from "./types";

/** A Flash MovieClip timeline: plays from frame 1, at the movie's 30 fps. */
const movieClip = (opts: TimelineOptions) => new Timeline({ fps: 30, play: true, ...opts });

type PCHandlers = Partial<Record<"pc_rollin" | "pc_rollover" | "pc_rollout" | "pc_mousedown" | "pc_mouseup", (e: PCEvent) => void>>;

const ART = [
  "background.jpg",
  "glow-overlay.svg",
  "bump-shading.svg",
  "hole-shading.svg",
  "area-circle-dashed.svg",
  "label-bump.svg",
  "label-hole.svg",
  "dimple-a.svg",
  "dimple-b.svg",
  "fan-1.svg",
  "fan-2.svg",
  "fan-3.svg",
  "fan-4.svg",
  "tunnel-body.svg",
  "tunnel-top.svg",
  "tunnel-zone-ends.svg",
  "tunnel-zone-sides.svg",
  "pocket-body.svg",
  "pocket-top.svg",
  "pocket-zone-opening.svg",
  "pocket-zone-sides.svg",
  ...Array.from({ length: 11 }, (_, i) => `bunny-${String(i + 1).padStart(2, "0")}.svg`),
  "switch-slot.svg",
  "switch-knob.svg",
  "switch-wall.svg",
  "maze.svg",
  "maze-arrow.svg",
  "maze-junction-dot.svg",
  "red-pin.svg",
];

/** Switch knob ColorMatrix filters by frame (from home.xml; 5th column in 0..255). f1/f68 grey "off", f30 red "on". */
const KNOB_FILTERS: Record<number, number[]> = {
  1: [0.3518, 0.69472, 0.09348, 0, -43.09, 0.3518, 0.69472, 0.09348, 0, -43.09, 0.3518, 0.69472, 0.09348, 0, -43.09, 0, 0, 0, 1, 0],
  25: [0.36705, 0.78867, -0.01572, 0, -43.09, 0.32363, 0.6913, 0.12507, 0, -43.09, 0.43175, 0.62242, 0.08583, 0, -43.09, 0, 0, 0, 1, 0],
  26: [0.38229, 0.88262, -0.12492, 0, -43.09, 0.29546, 0.68788, 0.15667, 0, -43.09, 0.5117, 0.55012, 0.07818, 0, -43.09, 0, 0, 0, 1, 0],
  27: [0.39754, 0.97659, -0.23412, 0, -43.09, 0.26728, 0.68446, 0.18826, 0, -43.09, 0.59166, 0.47782, 0.07053, 0, -43.09, 0, 0, 0, 1, 0],
  28: [0.41278, 1.07054, -0.34332, 0, -43.09, 0.23911, 0.68104, 0.21985, 0, -43.09, 0.6716, 0.40552, 0.06288, 0, -43.09, 0, 0, 0, 1, 0],
  29: [0.42803, 1.16449, -0.45252, 0, -43.09, 0.21093, 0.67762, 0.25145, 0, -43.09, 0.75155, 0.33322, 0.05523, 0, -43.09, 0, 0, 0, 1, 0],
  30: [0.7658, 3.24626, -2.87206, 0, -43.09, -0.41332, 0.60186, 0.95146, 0, -43.09, 2.52299, -1.26871, -0.11428, 0, -43.09, 0, 0, 0, 1, 0],
  62: [0.66396, 2.61859, -2.14255, 0, -43.09, -0.2251, 0.6247, 0.7404, 0, -43.09, 1.98889, -0.78571, -0.06317, 0, -43.09, 0, 0, 0, 1, 0],
  63: [0.56211, 1.99085, -1.41296, 0, -43.09, -0.03686, 0.64755, 0.52932, 0, -43.09, 1.45473, -0.30267, -0.01206, 0, -43.09, 0, 0, 0, 1, 0],
  64: [0.4876, 1.53163, -0.87922, 0, -43.09, 0.10084, 0.66426, 0.3749, 0, -43.09, 1.06396, 0.05071, 0.02533, 0, -43.09, 0, 0, 0, 1, 0],
  65: [0.45365, 1.32241, -0.63606, 0, -43.09, 0.16358, 0.67187, 0.30455, 0, -43.09, 0.88593, 0.21171, 0.04237, 0, -43.09, 0, 0, 0, 1, 0],
  66: [0.4197, 1.11318, -0.39289, 0, -43.09, 0.22632, 0.67949, 0.23419, 0, -43.09, 0.70789, 0.3727, 0.05941, 0, -43.09, 0, 0, 0, 1, 0],
  67: [0.38575, 0.90394, -0.14969, 0, -43.09, 0.28907, 0.6871, 0.16383, 0, -43.09, 0.52984, 0.53372, 0.07644, 0, -43.09, 0, 0, 0, 1, 0],
  68: [0.3518, 0.69472, 0.09348, 0, -43.09, 0.3518, 0.69472, 0.09348, 0, -43.09, 0.3518, 0.69472, 0.09348, 0, -43.09, 0, 0, 0, 1, 0],
};
const KNOB_Y: Record<number, number> = {
  1: -7.4,
  25: -8.8,
  26: -10.25,
  27: -11.65,
  28: -13.1,
  29: -14.5,
  30: -14.5,
  62: -13.5,
  63: -12.45,
  64: -11.45,
  65: -10.45,
  66: -9.45,
  67: -8.4,
  68: -7.4,
};

/**
 * The PC_Watcher's art already has the labels (Position/Speed/Object/Force), so
 * show only the values, in the art's value column (x 62, rows 14 px apart).
 */
class HomeWatcher extends Watcher {
  constructor(engine: Engine) {
    super(engine);
    this.el.classList.add("home-watcher");
    const st = document.createElement("style");
    // (the art loads asynchronously and is appended after the text, so lift the text above it)
    st.textContent =
      ".home-watcher .pc-watcher-text{left:62px;top:27px;width:113px;line-height:14px;z-index:1}.home-watcher .pc-watcher-text span{display:none}.home-watcher .pc-watcher-arrow{z-index:1}";
    this.el.appendChild(st);
  }
}

/** Spec: reference/specs/home.md (and headerbar.md for the menu bar). */
const demo: Demo = {
  id: "home",
  title: "Home",
  icon: "home.png",
  description:
    "The powercursor.com homepage: a playground of things to touch. Bumps and holes (click the big ones to flip them), dimples that spit you out, a fan, a tunnel and a pocket you can slip into (with a bunny to drag), a light switch that throws your cursor, and a circuit that carries it along. The menu bar's buttons pull you in.",
  width: 800,
  height: 700,
  background: "#3c3c3c",
  fps: 30,
  original: "home.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: true, bouncingBalls: true, hideAllObjects: false },
  async build({ stage, engine }) {
    const infos = Object.fromEntries(await Promise.all(ART.map(async (f) => [f.replace(/\.\w+$/, ""), await loadArt(`demos/home/${f}`)] as const))) as Record<
      string,
      ArtInfo
    >;
    const art = (name: string, at: FrameProps = {}, hit = false) => new Art(infos[name], { hit }).set(at);
    const [headerbar, cursor] = await Promise.all([buildHeaderbar(), ArrowCursor.create({ grip: 50, inertia: 10 })]);

    // `_root.cursor.gotoAndStop(...)`: "finger", "ball", 1/"arrow" (the picture only, not the style name)
    const look = (style: "Finger" | "Ball" | "Arrow") => cursor.showStyle(style);

    /** A toolkit object instance with its clip-event handlers. */
    function obj<T extends PCObject>(o: T, at: FrameProps, handlers: PCHandlers = {}): T {
      o.set(at);
      for (const [type, fn] of Object.entries(handlers)) o.on(type, fn);
      return o;
    }

    /** An HTML text field (Flash EditText: 2 px gutter inside its box). */
    const text = (html: string, at: FrameProps, css: string) => {
      const n = new Node().set(at);
      n.el.style.cssText += `padding:2px;white-space:pre;pointer-events:none;user-select:none;${css}`;
      n.el.innerHTML = html;
      return n;
    };

    // ---------------------------------------------------------------- §A big BUMP/HOLE disc (sprite 71)
    const disc = (name: "holebump" | "bumphole", x: number, y: number) => {
      const d = movieClip({ frames: 22, labels: { bump: 2, makehole: 3, hole: 12, makebump: 14 } }).set({ x, y });
      d.name = name;
      const bumptext = movieClip({ frames: 2 }).set({ x: -42.4, y: -43.55 });
      bumptext.el.style.filter = "drop-shadow(0.7px 0.7px 0.5px rgba(0,0,0,0.3))";
      bumptext.place(art("label-bump", { x: 1.4, y: 2 }), 1, 1, 1);
      bumptext.place(art("label-hole", { x: 1.4, y: 2 }), 2, 2, 1);
      bumptext.script(1, (mc) => mc.stop()).script(2, (mc) => mc.stop());

      const hillHandlers: PCHandlers = { pc_rollover: () => look("Finger"), pc_rollout: () => look("Arrow"), pc_mousedown: () => d.gotoAndPlay("makehole") };
      const hill = () =>
        obj(
          new Hill({ strength: 5, shape: "U-shaped", plateauDiameter: 1, style: "None", rolloverCursorStyle: "Finger", rolloverCursorSound: "scrape" }),
          { x: -61, y: -61, scale: 1.22 },
          hillHandlers,
        );
      const hole =
        (sound: string, handlers: PCHandlers = {}) =>
        () =>
          obj(
            new Hole({ strength: 5, shape: "Sine-shaped", plateauDiameter: 0, style: "None", rolloverCursorStyle: "Finger", rolloverCursorSound: sound }),
            { x: -62, y: -60.5, scale: 1.2 },
            handlers,
          );
      const holeHandlers = (resetText: boolean): PCHandlers => ({
        pc_rollover: () => look("Finger"),
        pc_rollout: () => look("Arrow"),
        pc_mousedown: () => {
          if (resetText) bumptext.gotoAndStop(1);
          d.gotoAndPlay("makebump");
        },
      });
      const a =
        (...v: number[]) =>
        (from: number) =>
          Object.fromEntries(v.map((alpha, i) => [from + i, { alpha }]));

      d.place(hill, 2, 11, 1, a(1, 0.891, 0.777, 0.668, 0.555, 0.445, 0.332, 0.223, 0.109, 0)(2));
      d.place(hill, 13, 22, 1, a(0, 0.109, 0.223, 0.332, 0.445, 0.555, 0.668, 0.777, 0.891, 1)(13));
      d.place(hole(""), 2, 11, 7, a(0, 0.102, 0.199, 0.301, 0.398, 0.5, 0.602, 0.699, 0.801, 0.898)(2));
      d.place(hole("scrape", holeHandlers(false)), 12, 21, 7, a(1, 0.898, 0.801, 0.699, 0.602, 0.5, 0.398, 0.301, 0.199, 0.102)(12));
      d.place(hole("", holeHandlers(true)), 22, 22, 7, { 22: { alpha: 0 } });
      d.place(() => art("bump-shading", { x: 0.05 }), 1, 11, 13, { 1: { alpha: 1 }, 9: { alpha: 0.668 }, 10: { alpha: 0.332 }, 11: { alpha: 0 } });
      d.place(() => art("bump-shading", { x: 0.05 }), 14, 22, 13);
      d.place(art("hole-shading", { x: 0.05 }), 3, 22, 15, {
        ...a(0, 0.145, 0.285, 0.43, 0.57, 0.715, 0.855, 1)(3),
        ...a(0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0)(15),
      });
      d.place(bumptext, 1, 22, 17);
      d.place(art("area-circle-dashed", { x: -60, y: -60.55 }), 1, 22, 19);

      d.script(1, (mc) => {
        // holebump: the "hole" frame's stop() runs after this play(), so it rests as a HOLE (as in Ruffle).
        if (mc.name === "holebump") {
          mc.gotoAndStop("hole");
          mc.play();
        } else mc.gotoAndStop("bump");
      });
      d.script(2, (mc) => mc.stop());
      d.script(3, () => bumptext.gotoAndStop(2));
      d.script(12, (mc) => {
        bumptext.gotoAndStop(2);
        mc.stop();
      });
      d.script(14, () => bumptext.gotoAndStop(1));
      d.script(22, (mc) => mc.gotoAndStop("bump"));
      return d;
    };

    // ---------------------------------------------------------------- §B small hole/bump unit (sprite 77)
    const unit = (x: number, y: number) => {
      const u = movieClip({ frames: 36, labels: { bump: 2, makehole: 3, hole: 17, makebump: 20 } }).set({ x, y });
      const hill = (style: string, sound: string, handlers: PCHandlers) => () =>
        obj(
          new Hill({ strength: 5, shape: "Sine-shaped", plateauDiameter: 10, style: "None", rolloverCursorStyle: style, rolloverCursorSound: sound }),
          { x: -23, y: -23, scale: 0.46 },
          handlers,
        );
      const hole =
        (style: string, sound: string, handlers: PCHandlers = {}) =>
        () =>
          obj(
            new Hole({
              strength: 5,
              shape: "Sine-shaped",
              plateauDiameter: 0,
              style: "Disc with shading",
              rolloverCursorStyle: style,
              rolloverCursorSound: sound,
            }),
            {},
            handlers,
          );
      const makehole = () => u.gotoAndPlay("makehole");
      const makebump = () => u.gotoAndPlay("makebump");
      // centred scale/alpha keyframes for the big hole
      const big = (from: number, v: [number, number][]) =>
        Object.fromEntries(v.map(([s, alpha], i) => [from + i, { x: -50 * s, y: -50 * s, scale: s, alpha }]));
      const seq = (from: number, v: number[]) => Object.fromEntries(v.map((alpha, i) => [from + i, { alpha }]));

      u.place(
        hill("Ball", "scratch", { pc_rollover: () => look("Ball"), pc_rollout: () => (look("Arrow"), makehole()), pc_mousedown: makehole }),
        2,
        15,
        1,
        seq(2, [1, 0.93, 0.855, 0.785, 0.715, 0.645, 0.57, 0.5, 0.43, 0.355, 0.285, 0.215, 0.145, 0.07]),
      );
      u.place(hill("Finger", "", { pc_rollover: () => look("Finger"), pc_rollout: () => look("Arrow"), pc_mousedown: makehole }), 16, 16, 1, {
        16: { alpha: 0 },
      });
      u.place(
        hill("Finger", "", { pc_rollout: makehole }),
        19,
        35,
        1,
        seq(19, [0, 0.059, 0.117, 0.176, 0.234, 0.293, 0.352, 0.41, 0.469, 0.531, 0.59, 0.648, 0.707, 0.766, 0.824, 0.883, 0.941]),
      );
      u.place(hill("Finger", "", { pc_rollover: () => look("Finger"), pc_rollout: () => look("Arrow"), pc_mousedown: makehole }), 36, 36, 1, {
        36: { alpha: 1 },
      });

      u.place(
        hole("Finger", ""),
        2,
        16,
        7,
        big(2, [
          [0.16, 0.738],
          [0.1806, 0.754],
          [0.2013, 0.773],
          [0.222, 0.789],
          [0.2427, 0.809],
          [0.2633, 0.824],
          [0.284, 0.844],
          [0.3047, 0.859],
          [0.3253, 0.879],
          [0.346, 0.895],
          [0.3667, 0.914],
          [0.3873, 0.93],
          [0.408, 0.949],
          [0.4286, 0.965],
          [0.4493, 0.984],
        ]),
      );
      u.place(
        hole("Ball", "scratch", { pc_rollover: () => look("Ball"), pc_rollout: () => look("Arrow"), pc_mousedown: makebump }),
        17,
        35,
        7,
        big(17, [
          [0.47, 1],
          [0.4537, 0.988],
          [0.4373, 0.973],
          [0.421, 0.961],
          [0.4047, 0.949],
          [0.3884, 0.934],
          [0.3721, 0.922],
          [0.3558, 0.906],
          [0.3395, 0.895],
          [0.3232, 0.883],
          [0.3068, 0.867],
          [0.2905, 0.855],
          [0.2742, 0.844],
          [0.2579, 0.828],
          [0.2416, 0.816],
          [0.2253, 0.801],
          [0.2089, 0.789],
          [0.1926, 0.777],
          [0.1763, 0.762],
        ]),
      );
      u.place(
        hole("Finger", "", { pc_rollover: () => look("Finger"), pc_rollout: () => look("Arrow"), pc_mousedown: makebump }),
        36,
        36,
        7,
        big(36, [[0.16, 0.75]]),
      );

      // the 16 px trigger at the centre: reaching it (pc_rollover) in the "hole" state pops the bump
      const trig = (alpha: number) => ({ x: -8, y: -8, scale: 0.16, alpha });
      u.place(hole("Ball", "frantic"), 2, 16, 13, { 2: trig(0.129) });
      u.place(hole("Ball", "", { pc_rollover: makebump }), 17, 19, 13, { 17: trig(0.711) });
      u.place(hole("Finger", ""), 20, 36, 13, { 20: trig(0.699) });

      u.place(art("dimple-a", { x: -42.65, y: -42.15 }), 1, 36, 19);
      u.place(art("dimple-b", { x: -42, y: -41 }), 3, 36, 21, {
        ...seq(3, [0, 0.082, 0.168, 0.25, 0.332, 0.418, 0.5, 0.582, 0.668, 0.75, 0.832, 0.918, 1]),
        ...seq(
          21,
          Array.from({ length: 16 }, (_, i) => 1 - (i + 1) * 0.0625),
        ),
      });

      // No instance is named exactly "smallholebump", so all start in "hole" (whose stop() ends the gotoAndPlay).
      u.script(1, (mc) => mc.gotoAndPlay("hole"));
      u.script(2, (mc) => mc.stop());
      u.script(17, (mc) => mc.stop());
      u.script(36, (mc) => mc.gotoAndStop("bump"));
      return u;
    };

    // ---------------------------------------------------------------- §C fan (sprite 88)
    const fan = movieClip({ frames: 9 }).set({ x: 54.85, y: 143 });
    let fanPlaying = true;
    fan.place(
      () =>
        obj(new Hole({ strength: 3, shape: "U-shaped", plateauDiameter: 0, style: "None", rolloverCursorStyle: "Finger", rolloverCursorSound: "pop" }), {
          x: 1,
          scale: 0.647,
        }),
      1,
      9,
      3,
    );
    fan.place(
      () =>
        obj(
          new Twister({
            strength: 18,
            shape: "U-shaped",
            plateauDiameter: 10,
            spin: "Right Out",
            style: "None",
            vortexStyle: "None",
            rolloverCursorStyle: "Null",
            rolloverCursorSound: "",
          }),
          { scale: 0.6673 },
        ),
      1,
      7,
      9,
    );
    fan.place(art("fan-4", {}, true), 8, 9, 9);
    fan.place(art("fan-1", {}, true), 1, 3, 20);
    fan.place(art("fan-2", {}, true), 4, 5, 20);
    fan.place(art("fan-3", {}, true), 6, 7, 20);
    fan.script(1, () => (fanPlaying = true));
    fan.script(9, (mc) => (fanPlaying ? mc.gotoAndPlay(3) : mc.gotoAndPlay(mc.currentFrame - 1)));
    // main-level onClipEvent(load): pc_mousedown toggles the fan
    fan.addBehaviour(new EventDispatcher({ pc_mousedown: () => (fanPlaying = !fanPlaying) }));

    // ---------------------------------------------------------------- §D tunnel (sprite 99) and §E pocket (sprite 160)
    // The main-level tops are drawn over the cursor; the scripts move them onto the clip and toggle them.
    const tunnelTop = art("tunnel-top", { x: -140.15, y: 42.35 });
    const pocketTop = art("pocket-top", { x: -118.95, y: 121 });

    /** An invisible (alpha 0) hit zone whose pc_rollin sends its clip to a label. */
    const zone = (name: string, at: FrameProps, artAt: FrameProps, onRollin: () => void) => {
      const z = new Node().set({ ...at, alpha: 0 });
      z.addChild(art(name, artAt, true));
      z.addBehaviour(new EventDispatcher({ pc_rollin: onRollin }));
      return z;
    };

    const tunnel = movieClip({ frames: 19, labels: { init: 1, bobble: 7, tunnel: 13 } }).set({ x: 204.4, y: 451.8 });
    {
      const t = tunnel;
      const local = art("tunnel-top");
      const endHole = (x: number, y: number, scale: number) => () =>
        obj(new Hole({ strength: 3, shape: "U-shaped", plateauDiameter: 0, style: "None", rolloverCursorStyle: "Default", rolloverCursorSound: "scratch" }), {
          x,
          y,
          scale,
        });
      t.place(art("tunnel-body"), 1, 19, 1);
      // "bobble": a ridge (negative gutter) you ride over; "tunnel": a V groove along the axis
      t.place(
        () =>
          obj(new Gutter({ strength: -3, shape: "Sine-shaped", plateauDiameter: 2, graphicsStyle: "None", rolloverCursorStyle: "Null" }), {
            x: 16.25,
            y: 10.4,
            scaleX: 0.5009,
            scaleY: 1.44,
          }),
        7,
        12,
        2,
      );
      t.place(
        () =>
          obj(new Gutter({ strength: 4, shape: "V-shaped", plateauDiameter: 2, graphicsStyle: "None", rolloverCursorStyle: "Null" }), {
            x: 21.4,
            y: 16.9,
            scaleX: 0.4491,
            scaleY: 1,
          }),
        13,
        19,
        2,
      );
      t.place(endHole(-7.15, 9.05, 0.381), 4, 19, 6);
      t.place(endHole(101.7, 9.6, 0.4037), 4, 19, 12);
      t.place(local, 1, 19, 18);
      t.place(
        zone("tunnel-zone-ends", { x: -4.15, y: 12.85 }, {}, () => t.gotoAndPlay("tunnel")),
        1,
        19,
        20,
      );
      t.place(
        zone("tunnel-zone-sides", { x: 7.8, y: 13.5 }, { x: -27.85, y: -40 }, () => t.gotoAndPlay("bobble")),
        1,
        19,
        23,
      );
      t.script(1, (mc) => {
        tunnelTop.set({ x: mc.x, y: mc.y, visible: false });
        mc.stop();
      });
      t.script(7, (mc) => {
        local.visible = true;
        tunnelTop.visible = false;
        mc.stop();
      });
      t.script(12, (mc) => mc.stop());
      t.script(13, () => {
        local.visible = false;
        tunnelTop.visible = true;
      });
      t.script(19, (mc) => mc.stop());
    }

    const pocket = movieClip({ frames: 19, labels: { init: 1, bobble: 7, tunnel: 13 } }).set({ x: 355.1, y: 484.15 });
    {
      const p = pocket;
      p.place(
        () =>
          obj(new Hill({ strength: 5, shape: "Sine-shaped", plateauDiameter: 0, style: "None", rolloverCursorStyle: "Default", rolloverCursorSound: "" }), {
            x: 8.3,
            y: 14.4,
            scale: 0.8243,
          }),
        7,
        12,
        1,
      );
      p.place(
        () =>
          obj(new Hole({ strength: 3, shape: "U-shaped", plateauDiameter: 0, style: "None", rolloverCursorStyle: "Default", rolloverCursorSound: "scratch" }), {
            x: 9.3,
            y: 13.3,
            scale: 0.8243,
          }),
        13,
        19,
        1,
      );
      const wall = (x: number, y: number, scaleX: number, scaleY: number) => () => obj(new Wall({ tint: 0xdd2424 }), { x, y, scaleX, scaleY });
      p.place(wall(95, 96.85, -0.2899, -0.7885), 13, 19, 7); // right
      p.place(wall(32.85, 96.85, -0.2899, -0.7885), 13, 19, 9); // left
      p.place(wall(85.75, 104.35, -0.7697, -0.4279), 13, 19, 11); // floor
      // d13 PC_Slope (angle 0, strength 3) is omitted: PC_Slope isn't exported by the shipped
      // powercursor.swf runtime, so on the live site it did nothing.
      p.place(art("pocket-body"), 1, 19, 15);

      // d16 the bunny (sprite 150): a 117-frame loop of 11 drawings, draggable with the PowerCursor.
      const bunny = new Node().set({ x: 26.65, y: 32.75 });
      const anim = bunny
        .addChild(
          new Clip(
            Array.from({ length: 11 }, (_, i) => infos[`bunny-${String(i + 1).padStart(2, "0")}`]),
            { hit: true },
          ),
        )
        .set({ x: 0.35, y: 0.35 });
      const lastFrameOf = [20, 26, 35, 55, 60, 70, 75, 85, 90, 110, 117];
      let bf = 1;
      let acc = 0;
      anim.onEnterFrame = (dt) => {
        acc += dt;
        for (; acc >= 1000 / 30; acc -= 1000 / 30) {
          bf = (bf % 117) + 1;
          anim.gotoAndStop(lastFrameOf.findIndex((l) => bf <= l) + 1);
        }
      };
      bunny.addBehaviour(new DraggerMaker());
      p.place(bunny, 1, 19, 16);
      // Named tunnel_top_local (copy-paste), so the scripts' pocket_top_local never hides it; the main-level top covers it.
      p.place(art("pocket-top"), 1, 19, 20);
      p.place(
        zone("pocket-zone-opening", { x: -4.15, y: 12.85 }, {}, () => p.gotoAndPlay("tunnel")),
        1,
        19,
        22,
      );
      p.place(
        zone("pocket-zone-sides", { x: 7.8, y: 13.5 }, {}, () => p.gotoAndPlay("bobble")),
        1,
        19,
        25,
      );
      p.script(1, (mc) => {
        pocketTop.set({ x: mc.x, y: mc.y, visible: false });
        mc.stop();
      });
      p.script(7, (mc) => {
        pocketTop.visible = false;
        mc.stop();
      });
      p.script(12, (mc) => mc.stop());
      p.script(13, () => (pocketTop.visible = true));
      p.script(19, (mc) => mc.stop());
    }

    // ---------------------------------------------------------------- §F light switch (sprite 113)
    const sw = movieClip({
      frames: 71,
      labels: {
        off_rollout: 2,
        off_rollover: 4,
        off_inside: 12,
        off_inside_forawhile: 19,
        turn_on: 24,
        on_rollout: 35,
        on_rollover: 42,
        on_go_inside: 47,
        on_inside: 51,
        on_inside_forawhile: 56,
        turn_off: 61,
      },
    }).set({ x: 257.1, y: 562.95 });
    sw.name = "switch_on";
    {
      let dragswitch = false;
      const label = (s: string) => () => text(s, { x: -6.75, y: -30 }, "font:13px Arial,Helvetica,sans-serif;color:#999999");
      sw.place(label("off"), 1, 28, 1);
      sw.place(label("on"), 29, 71, 1);

      const hole =
        (
          p: { strength: number; plateauDiameter: number; shape: "U-shaped" | "Sine-shaped"; style?: "None" | "Circle" | "Circle with shading" },
          at: FrameProps,
          handlers: PCHandlers,
        ) =>
        () =>
          obj(new Hole({ style: "None", tint: 0x00ffff, ...p, rolloverCursorStyle: "Null", rolloverCursorSound: "" }), at, handlers);
      const areaOff = (strength: number) =>
        hole(
          { strength, plateauDiameter: 20, shape: "U-shaped" },
          { x: -13.25, y: -14.5, scaleX: 0.2662, scaleY: 0.3549 },
          {
            pc_rollover: () => sw.play(),
            pc_rollin: () => sw.gotoAndPlay("off_rollover"),
            pc_rollout: () => (look("Arrow"), sw.gotoAndStop("off_rollout")),
          },
        );
      const knobOff = (strength: number, plateauDiameter: number) =>
        hole(
          { strength, plateauDiameter, shape: "Sine-shaped" },
          { x: -6.15, y: -4.15, scale: 0.13 },
          {
            pc_rollover: () => look("Finger"),
            pc_rollin: () => look("Finger"),
            pc_rollout: () => sw.gotoAndPlay("off_rollout"),
            pc_mousedown: () => sw.gotoAndPlay("turn_on"),
          },
        );
      const areaOn = (strength: number) =>
        hole(
          { strength, plateauDiameter: 20, shape: "U-shaped" },
          { x: -13.25, y: -21, scaleX: 0.2662, scaleY: 0.3549 },
          {
            pc_rollover: () => sw.play(),
            pc_rollout: () => (look("Arrow"), sw.gotoAndPlay("on_rollout")),
            pc_rollin: () => sw.gotoAndPlay("on_rollover"),
          },
        );
      const knobOn = (strength: number, plateauDiameter: number, style: "None" | "Circle") =>
        hole(
          { strength, plateauDiameter, shape: "Sine-shaped", style },
          { x: -6.15, y: -10.15, scale: 0.13 },
          {
            pc_rollover: () => look("Finger"),
            pc_rollout: () => (look("Arrow"), sw.gotoAndPlay("on_rollout")),
            pc_mousedown: () => sw.gotoAndPlay("turn_off"),
          },
        );
      // the small hole just past the knob: nudging into it throws the switch
      const nudge = (at: FrameProps, to: string) =>
        hole({ strength: 3, plateauDiameter: 4, shape: "Sine-shaped", style: "Circle with shading" }, at, {
          pc_rollin: () => {
            look("Finger");
            if (dragswitch) sw.gotoAndPlay(to);
          },
          pc_rollout: () => look("Finger"),
        });
      // During the throw: a pushgutter carries the cursor with the knob, a wall keeps it in the slot, a dimmer ignores the mouse.
      const push = (at: FrameProps, plateauDiameter: number) => () =>
        obj(
          new Pushgutter({
            strength: 3,
            pushStrength: 3,
            shape: "U-shaped",
            plateauDiameter,
            arrowStyle: "Still",
            graphicsStyle: "None",
            rolloverCursorStyle: "Null",
            rolloverCursorSound: "",
          }),
          at,
          {
            pc_rollover: () => look("Finger"),
          },
        );
      const wall = () => {
        const w = new Node().set({ x: -16.65, y: -22.75, alpha: 0 });
        w.addChild(art("switch-wall", {}, true));
        w.addBehaviour(new WallMaker());
        return w;
      };
      const dimmer = () =>
        obj(
          new Dimmer({ scope: "Mouse", dimmingFactor: 0, directionDependency: "None", dirDepAngle: 0, tint: 0xeeabab }),
          { x: -10.6, y: -14.25, scaleX: 0.2206, scaleY: 0.2842 },
          { pc_rollover: () => look("Finger") },
        );

      sw.place(areaOff(0), 1, 4, 2);
      sw.place(areaOff(2), 5, 11, 2);
      sw.place(push({ x: -4.5, y: 12.1, rotation: -90, scaleX: 0.0825, scaleY: 0.4 }, 5), 24, 31, 2);
      sw.place(areaOn(0), 39, 42, 2);
      sw.place(areaOn(2), 43, 48, 2);
      sw.place(push({ x: 5.5, y: -12, rotation: 90, scaleX: 0.0685, scaleY: 0.4 }, 4), 61, 71, 2);
      sw.place(knobOff(3, 2), 6, 16, 8);
      sw.place(knobOff(0, 5), 17, 23, 8);
      sw.place(wall, 24, 31, 8);
      sw.place(knobOn(3, 2, "None"), 42, 52, 8);
      sw.place(knobOn(1, 3, "Circle"), 53, 60, 8);
      sw.place(wall, 61, 70, 8);
      sw.place(dimmer, 24, 31, 12);
      sw.place(dimmer, 61, 71, 12);
      sw.place(nudge({ x: -4.05, y: -11.4, scaleX: 0.088, scaleY: 0.0836 }, "turn_on"), 19, 23, 14);
      sw.place(nudge({ x: -3.75, y: -0.1, scale: 0.0821 }, "turn_off"), 56, 60, 14);
      sw.place(art("switch-slot"), 1, 71, 20);

      // The knob light: a green bitmap recoloured by a ColorMatrix filter (grey = off, red = on).
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      defs.setAttribute("width", "0");
      defs.setAttribute("height", "0");
      defs.style.position = "absolute";
      defs.innerHTML = Object.entries(KNOB_FILTERS)
        .map(([f, m]) => {
          const v = m.map((x, i) => (i % 5 === 4 ? x / 255 : x)).join(" ");
          return `<filter id="home-knob-${f}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${v}"/></filter>`;
        })
        .join("");
      sw.el.appendChild(defs);
      const knob = art("switch-knob", { x: -11.5 });
      const knobKeys: Record<number, Keyframe> = {};
      for (const f of Object.keys(KNOB_Y).map(Number)) {
        knobKeys[f] = (n) => {
          n.y = KNOB_Y[f];
          n.el.style.filter = `url(#home-knob-${f})`;
        };
      }
      sw.place(knob, 1, 71, 21, knobKeys);

      sw.script(1, () => (dragswitch = true)); // (`status` is only read here, before it is ever set)
      sw.script(2, (mc) => mc.stop());
      sw.script(19, (mc) => mc.stop());
      sw.script(24, () => look("Finger"));
      sw.script(31, (mc) => {
        mc.gotoAndStop("on_go_inside");
        mc.play();
      });
      sw.script(35, (mc) => mc.play());
      sw.script(41, (mc) => mc.stop());
      sw.script(56, (mc) => mc.stop());
      sw.script(61, () => look("Finger"));
      sw.script(71, (mc) => {
        mc.gotoAndStop("off_inside");
        mc.play();
      });
    }

    // ---------------------------------------------------------------- §G circuit / maze (sprite 120)
    const maze = movieClip({ frames: 2 }).set({ x: 427.45, y: 313.3 });
    {
      const m = maze;
      m.place(unit(42.65, 65.1), 1, 2, 1);
      m.place(unit(332.05, 42.15), 1, 2, 23);
      m.place(unit(280.05, 239.15), 1, 2, 45);
      m.place(art("maze", {}, true), 1, 2, 67);
      const arrows: [number, number, number][] = [
        [149.15, 129, 0],
        [200.4, 128.9, 0],
        [230.9, 164.9, 0],
        [217.2, 201, 0],
        [126.45, 201, 0],
        [80.8, 167.85, 90],
        [80.8, 100.85, 90],
        [104.7, 70, 180],
        [179.45, 69.9, 180],
        [280.45, 47.65, 180],
        [133.7, 87.35, 90],
        [276, 90.1, -90],
        [275.95, 140.35, -90],
        [211.95, 92.85, -90],
      ];
      arrows.forEach(([x, y, rotation], i) => m.place(art("maze-arrow", { x, y, rotation }), 1, 2, 68 + i));
      // junctions (sprite 118): an 11 px hole that holds the cursor, and a black dot
      const junctions: [number, number][] = [
        [123.95, 59.65],
        [210.45, 59.65],
        [246.95, 59.15],
        [274.45, 163.65],
        [274.45, 199],
        [179.45, 127.65],
      ];
      junctions.forEach(([x, y], i) => {
        const j = new Node().set({ x, y });
        j.addChild(
          obj(
            new Hole({
              strength: 3,
              shape: "U-shaped",
              plateauDiameter: 2,
              style: "None",
              tint: 0xcccccc,
              rolloverCursorStyle: "Finger",
              rolloverCursorSound: "",
            }),
            { scale: 0.11 },
            {
              pc_rollover: () => look("Ball"),
              pc_rollout: () => look("Arrow"),
            },
          ),
        );
        j.addChild(art("maze-junction-dot"));
        m.place(j, 1, 2, 162 + i * 8);
      });
      m.addBehaviour(new EventDispatcher({ pc_rollin: () => m.gotoAndPlay(2), pc_rollout: () => m.gotoAndPlay(1) }));

      // Frame 2: the push network (sprite 119) at stage (477.75, 369.15), only while the cursor is in the maze.
      const network = () => {
        const n = new Node().set({ x: 50.3, y: 55.85 });
        const ox = 477.75;
        const oy = 369.15;
        const gutters: [number, number, number, number, number][] = [
          [477.75, 369.15, 1.1254, 0.7184, 0],
          [716.8, 369.15, 0.8451, 0.7987, 90],
          [702.35, 523.65, 0.9808, 0.7184, 180],
          [494.5, 523.05, 0.7004, 0.7987, -90],
          [703.85, 491.2, 0.4707, 0.7184, 180],
          [652.7, 455.7, 0.4984, 0.7184, 180],
          [652.7, 378.1, 0.3459, 0.7184, 90],
          [547.75, 455.7, 0.3816, 0.7184, -90],
          [604.75, 491.0, 0.1946, 0.7184, -90],
          [670.25, 377.6, 0.1046, 0.7184, -90],
          [669.75, 347.7, 0.4335, 0.7184, 0],
        ];
        for (const [x, y, scaleX, scaleY, rotation] of gutters) {
          n.addChild(
            obj(
              new Pushgutter({
                strength: 3,
                pushStrength: 5,
                shape: "Sine-shaped",
                plateauDiameter: 0,
                arrowStyle: "None",
                graphicsStyle: "None",
                rolloverCursorStyle: "Null",
                rolloverCursorSound: "tickle",
              }),
              { x: x - ox, y: y - oy, scaleX, scaleY, rotation },
            ),
          );
        }
        // Local-force dimmers on the junctions cancel the push there.
        const dimmers: [number, number][] = [
          [557.1, 378.25],
          [643.1, 378.1],
          [680.1, 378.1],
          [706.6, 482.1],
          [706.6, 517.1],
          [612.1, 446.1],
        ];
        for (const [cx, cy] of dimmers) {
          n.addChild(
            obj(new Dimmer({ scope: "Local forces", dimmingFactor: 0, directionDependency: "None", dirDepAngle: 0, tint: 0x333333 }), {
              x: cx - 6.35 - ox,
              y: cy - 6.35 - oy,
              scale: 0.127,
            }),
          );
        }
        n.addBehaviour(new EventDispatcher({ pc_rollout: () => look("Arrow") }));
        return n;
      };
      m.place(network, 2, 2, 82);
      m.script(1, (mc) => mc.stop());
      m.script(2, (mc) => mc.stop());
    }

    // ---------------------------------------------------------------- main timeline
    const main = stage.addChild(movieClip({ frames: 22, labels: { fadein: 6 } }));
    // Toolkit graphics are not drawn (spec "Toolkit visuals"): most objects are style "None", the
    // rest relied on library art home.swf doesn't export (or sit under the pocket body). Ruffle shows none.
    main.el.classList.add("pc-hide-objects");
    const loading = text(
      "L  O  A  D  I  N  G",
      { x: 328.4, y: 275 },
      "box-sizing:border-box;width:143.2px;text-align:center;font:10px Arial,Helvetica,sans-serif;color:#cccccc",
    );
    main.place(loading, 1, 4, 498);
    main.script(4, () => (loading.el.textContent = "L  O  A  D  I  N  G  100 %"));
    main.place(art("background", { x: -0.15, y: -2 }), 2, 22, 1);
    main.place(art("background", { x: -0.15, y: 598 }), 2, 22, 2);
    // PC_Watcher, off-stage at x 857 (invisible on the 800 px stage, as in the original)
    main.place(new HomeWatcher(engine).set({ x: 857.3, y: 357.8 }), 2, 22, 8);
    main.place(disc("holebump", 705.45, 77.35), 5, 22, 27);
    main.place(disc("bumphole", 102.15, 525.65), 5, 22, 47);
    const units: [number, number][] = [
      [208.5, 51.85],
      [288.95, 98.1],
      [255.95, 149.85],
      [326.2, 149.85],
      [217.5, 105.1],
    ];
    units.forEach(([x, y], i) => main.place(unit(x, y), 5, 22, 67 + i * 22));
    main.place(fan, 5, 22, 177);
    main.place(tunnel, 5, 22, 198);
    main.place(sw, 5, 22, 222);
    main.place(maze, 5, 22, 244);
    main.place(art("dimple-b", { x: 136.2, y: 111 }), 5, 22, 455);
    const pin = new Node().set({ x: 175, y: 149.35 });
    pin.addChild(art("red-pin", {}, true));
    pin.addBehaviour(new WallMaker()); // the 7.5 px red square is a wall
    main.place(pin, 5, 22, 457);
    // headerbar.swf, loadMovie'd into headerbar_holder: its buttons use this engine and cursor.
    main.place(headerbar.set({ x: 26, y: 208 }), 2, 22, 462);
    main.place(pocket, 5, 22, 464);
    main.place(
      text(
        "Powercursor is a Flash toolkit to create interfaces you can touch.\n\nTouch sensations like stickiness, volume, roughness, pressure\nor mass can be experienced in a graphical user interface.\nPowercursor uses a technique called 'optically simulated haptic\nfeedback' to evoke the tactile experience.",
        { x: 38, y: 305.65 },
        // Arial 13 px with 2 px leading (Flash line height = ascent + descent + leading)
        "box-sizing:border-box;width:426.3px;height:113.6px;overflow:hidden;font:13px/16.5px Arial,Helvetica,sans-serif;color:#cccccc",
      ),
      5,
      22,
      490,
    );
    main.place(cursor.set({ x: 636.3, y: 219.5 }), 5, 22, 491);
    // These are drawn over the cursor (depths 493-498); .pc-cursor has z-index 10, so lift them above it.
    for (const n of [tunnelTop, pocketTop]) n.el.style.zIndex = "11";
    main.place(tunnelTop, 5, 22, 493);
    main.place(pocketTop, 5, 22, 495);
    // intro: a plain metal cover fades out while the spotlight glow (above everything, it's just light) fades in
    const step = (from: number, v: number[]) => Object.fromEntries(v.map((alpha, i) => [from + i, { alpha }]));
    const cover = art("background", { x: 0.3, y: -3 });
    cover.el.style.zIndex = "11";
    main.place(cover, 2, 16, 497, { 2: { alpha: 1 }, ...step(7, [0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0]) });
    const glow = art("glow-overlay", { x: -248, y: -146 });
    glow.el.style.zIndex = "11";
    main.place(glow, 5, 22, 498, step(5, [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]));
    main.script(22, (mc) => mc.stop());
    main.begin();

    engine.placeCursors(636.3, 219.5);
  },
};

export default demo;
