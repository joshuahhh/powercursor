import { ArrowCursor, DraggerMaker, EventDispatcher, Gutter, Hill, Hole, Node, Timeline, Wall, art, rect } from "../pc";
import type { Demo } from "./types";

/*
 * Spec: reference/specs/pocket.md
 *
 * The pocket and tunnel clips are 19-frame timelines with three states (init / bobble /
 * tunnel), switched by invisible trigger zones. Force objects are factories, so each state
 * entry creates them fresh, as in Flash. In the tunnel state a root-level copy of the
 * object's front image is drawn above the cursor, so the cursor seems to go inside.
 */

const LABELS = { init: 1, bobble: 7, tunnel: 13 };

/** An invisible (alpha 0) trigger clip: its art is the hit area; pc_rollin switches state. */
async function trigger(path: string, at: { x: number; y: number }, artAt: { x: number; y: number }, onRollin: () => void) {
  const t = new Node().set({ ...at, alpha: 0 });
  t.addChild(await art(path, { hit: true })).set(artAt);
  t.addBehaviour(new EventDispatcher({ pc_rollin: onRollin }));
  return t;
}

/** Sprite 27: 11 bitmaps over a 117-frame loop at 25 fps. */
const BUNNY_FRAMES = [20, 6, 9, 20, 5, 10, 5, 10, 5, 20, 7];

async function bunnyAnim(): Promise<Node> {
  const anim = new Timeline({ frames: 117, play: true });
  const bitmaps = await Promise.all(BUNNY_FRAMES.map((_, i) => art(`demos/pocket/bunny-${String(i + 1).padStart(2, "0")}.png`)));
  let from = 1;
  bitmaps.forEach((b, i) => {
    b.img.style.imageRendering = "pixelated";
    anim.place(b, from, from + BUNNY_FRAMES[i] - 1, 1);
    from += BUNNY_FRAMES[i];
  });
  return anim;
}

const demo: Demo = {
  id: "pocket",
  title: "Pocket + Tunnel",
  description: "Try and move your cursor through the tunnel, or in the pocket. Using dynamic forcefields to create different levels.",
  icon: "pocket_icon.jpg",
  width: 500,
  height: 300,
  background: "#333333",
  fps: 25,
  original: "pocket.swf",
  engine: { bouncingBalls: true, baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: false, hideAllObjects: false },
  async build({ stage, engine }) {
    const D = "demos/pocket/";
    const [pocketBack, pocketFrontLocal, pocketTop, tunnelBack, tunnelFrontLocal, tunnelTop] = await Promise.all(
      ["pocket-back", "pocket-front", "pocket-front", "tunnel-back", "tunnel-front", "tunnel-front"].map((n) => art(`${D}${n}.svg`)),
    );

    // ---- Pocket clip (sprite 42), main depth 6 ----
    const pocket = stage.addChild(new Timeline({ frames: 19, labels: LABELS })).set({ x: 291.6, y: 76.4 });
    const pocketWall = (x: number, y: number, scaleX: number, scaleY: number) => () => new Wall({ tint: 0xdd2424 }).set({ x, y, scaleX, scaleY });
    pocket.place(
      () =>
        new Hill({
          strength: 5,
          shape: "Sine-shaped",
          plateauDiameter: 0,
          style: "None",
          tint: 0xdd2424,
          rolloverCursorSound: "",
          rolloverCursorStyle: "Default",
        }).set({ x: 8.3, y: 14.4, scale: 0.82432556 }),
      "bobble",
      12,
      1,
    );
    pocket.place(
      () =>
        new Hole({
          strength: 3,
          shape: "U-shaped",
          plateauDiameter: 0,
          style: "None",
          tint: 0xdd2424,
          rolloverCursorSound: "scratch",
          rolloverCursorStyle: "Default",
        }).set({ x: 9.3, y: 13.3, scale: 0.82432556 }),
      "tunnel",
      19,
      1,
    );
    pocket.place(pocketWall(95, 96.85, -0.28987122, -0.78852844), "tunnel", 19, 7);
    pocket.place(pocketWall(32.85, 96.85, -0.28987122, -0.78852844), "tunnel", 19, 9);
    pocket.place(pocketWall(85.75, 104.35, -0.7696533, -0.42793274), "tunnel", 19, 11);
    // Depth 13 is a PC_Objects.PC_Slope (angle 0, strength 3), a class missing from the shipped
    // toolkit, so it was an empty clip in the deployed demo. Left out (spec "Unusual" 1).
    pocket.placeAlways(pocketBack, 15);
    // Bunny clip (sprite 29): its 32x32 bitmap square is the DraggerMaker's hit area.
    const bunny = pocket.placeAlways(new Node(), 16).set({ x: 26.65, y: 32.75 });
    bunny.addChild(await bunnyAnim()).set({ x: 0.35, y: 0.35 });
    bunny.hitShape = rect(0.35, 0.35, 32, 32);
    bunny.hitChildren = false;
    bunny.addBehaviour(new DraggerMaker()).rolloverCursorSound = "";
    // (sic) The pocket's local front copy is misnamed in the FLA, so it stays visible in every state.
    pocket.placeAlways(pocketFrontLocal, 20);
    pocket.placeAlways(await trigger(`${D}hit-pocket-mouth.svg`, { x: -4.15, y: 12.85 }, { x: 0, y: 0 }, () => pocket.gotoAndPlay("tunnel")), 22);
    pocket.placeAlways(await trigger(`${D}hit-pocket-rim.svg`, { x: 7.8, y: 13.5 }, { x: 0, y: 0 }, () => pocket.gotoAndPlay("bobble")), 25);
    pocket.script("init", (tl) => {
      pocketTop.visible = false;
      tl.stop();
    });
    pocket.script("bobble", (tl) => {
      pocketTop.visible = false;
      tl.stop();
    });
    pocket.script(12, (tl) => tl.stop());
    pocket.script("tunnel", () => (pocketTop.visible = true));
    pocket.script(19, (tl) => tl.stop());

    // ---- Tunnel clip (sprite 53), main depth 32 ----
    const tunnel = stage.addChild(new Timeline({ frames: 19, labels: LABELS })).set({ x: 95.5, y: 84.5 });
    const gutter = (strength: number, shape: "Sine-shaped" | "V-shaped") =>
      new Gutter({ strength, shape, plateauDiameter: 2, graphicsStyle: "None", tint: 0xdd2424, rolloverCursorSound: "", rolloverCursorStyle: "Null" });
    const mouthHole = (x: number, y: number, scale: number) => () =>
      new Hole({
        strength: 3,
        shape: "U-shaped",
        plateauDiameter: 0,
        style: "None",
        tint: 0xdd2424,
        rolloverCursorSound: "scratch",
        rolloverCursorStyle: "Default",
      }).set({ x, y, scale });
    tunnel.placeAlways(tunnelBack, 1);
    tunnel.place(() => gutter(-3, "Sine-shaped").set({ x: 16.25, y: 10.4, scaleX: 0.500885, scaleY: 1.4400177 }), "bobble", 12, 2);
    tunnel.place(() => gutter(4, "V-shaped").set({ x: 21.4, y: 16.9, scaleX: 0.44908142, scaleY: 1 }), "tunnel", 19, 2);
    // The mouth holes live on frames 4+: created on leaving init, then kept.
    tunnel.place(mouthHole(-7.15, 9.05, 0.3809967), 4, 19, 6);
    tunnel.place(mouthHole(101.7, 9.6, 0.40367126), 4, 19, 12);
    tunnel.placeAlways(tunnelFrontLocal, 18);
    tunnel.placeAlways(await trigger(`${D}hit-tunnel-mouths.svg`, { x: -4.15, y: 12.85 }, { x: 0, y: 0 }, () => tunnel.gotoAndPlay("tunnel")), 20);
    tunnel.placeAlways(await trigger(`${D}hit-tunnel-bands.svg`, { x: 7.8, y: 13.5 }, { x: -27.85, y: -40 }, () => tunnel.gotoAndPlay("bobble")), 23);
    tunnel.script("init", (tl) => {
      tunnelTop.visible = false;
      tl.stop();
    });
    tunnel.script("bobble", (tl) => {
      tunnelFrontLocal.visible = true;
      tunnelTop.visible = false;
      tl.stop();
    });
    tunnel.script("tunnel", () => {
      tunnelFrontLocal.visible = false;
      tunnelTop.visible = true;
    });
    tunnel.script(19, (tl) => tl.stop());

    // ---- Cursor (depth 56), then the root front copies above it (58, 60) ----
    stage.addChild(await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 }));
    engine.placeCursors(392.5, 84);
    for (const top of [tunnelTop, pocketTop]) {
      stage.addChild(top).set({ visible: false });
      top.el.style.zIndex = "11"; // .pc-cursor has z-index 10
    }
    tunnelTop.set({ x: 95.5, y: 84.5 });
    pocketTop.set({ x: 291.6, y: 76.4 });
  },
};

export default demo;
