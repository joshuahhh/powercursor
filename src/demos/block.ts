import {
  Art,
  ArrowCursor,
  ButtonMaker,
  Clip,
  EventDispatcher,
  Hill,
  Hole,
  Matrix,
  Node,
  Pushgutter,
  SandMaker,
  WallMaker,
  hitFromArt,
  loadArt,
  rect,
  type ArtInfo,
  type HitShape,
  type SlopeShape,
} from "../pc";
import type { Demo } from "./types";

/*
 * Spec: reference/specs/block.md
 *
 * Sprite 225's six lockstep timelines are one frame number f ∈ [2, 31], stepped at 40 Hz by the
 * setBlock / pushBlock / gravityPush state machine. Every force object lies under the opaque
 * background, so none of them is drawn.
 */

const FPS = 40;
const DIR = "demos/block/";

type M6 = [number, number, number, number, number, number];

interface FrameData {
  hoepback: { matrix: M6 };
  hoep2: { matrix: M6 };
  gravity: number;
  hintArrow: boolean;
  pushgutter?: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    alpha: number;
    params: { strength: number; pushStrength: number; plateauDiameter: number; shape: SlopeShape; tint: number };
  };
  sandpatch?: { matrix: M6 };
  hill?: { matrix: M6 };
  hole?: { matrix: M6 };
  wall: string | null;
  sand: string;
  topface: string;
  block: string;
}

const matrix = ([a, b, c, d, tx, ty]: M6) => new Matrix(a, b, c, d, tx, ty);

/** Hint arrow (sprite 164) matrices inside sprite 221: frames 1-2 point at the right edge, 30-31 point back. */
const ARROW_UP = matrix([0.05177307, -0.031158447, 0.032440186, 0.020355225, -222.65, -134.65]);
const ARROW_DOWN = matrix([-0.046081543, 0.03894043, 0.001953125, -0.04145813, -95.3, -82.7]);
/** Sprite 164 alpha (/256) for frames 26-75; frames 1-25 are empty. */
// prettier-ignore
const ARROW_ALPHA = [
  77, 80, 83, 86, 95, 105, 114, 124, 133, 143, 152, 162, 171, 180, 190, 199, 209, 218, 228, 237, 247,
  ...Array<number>(16).fill(256),
  242, 228, 215, 201, 187, 173, 160, 146, 132, 118, 105, 91, 77,
];

/** Flash filters as SVG: the hint arrow's GlowFilter and blokjesshade's Blur + ColorMatrix (box blur b ≈ Gaussian σ = b/√12). */
function filterDefs(): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  const off = (-55.254997 / 255).toFixed(6);
  // prettier-ignore
  const cm = [
    0.8344991, 0.06654648, 0.0089544, 0, off,
    0.033699118, 0.8673464, 0.0089544, 0, off,
    0.033699118, 0.06654648, 0.8097544, 0, off,
    0, 0, 0, 1, 0,
  ].join(" ");
  svg.innerHTML = `
    <filter id="block-arrow-glow" filterUnits="userSpaceOnUse" x="-280" y="-200" width="240" height="200" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4.3" result="b"/>
      <feComponentTransfer in="b" result="b2"><feFuncA type="linear" slope="2"/></feComponentTransfer>
      <feFlood flood-color="#853B1A"/>
      <feComposite in2="b2" operator="in" result="g"/>
      <feComposite in="g" in2="SourceAlpha" operator="out" result="g2"/>
      <feMerge><feMergeNode in="g2"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="block-shade" filterUnits="userSpaceOnUse" x="-80" y="-80" width="410" height="410" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="15 19"/>
      <feColorMatrix type="matrix" values="${cm}"/>
    </filter>`;
  return svg;
}

/** Sprite 221 (blokjes): the cube bitmap plus the hint arrow. Drawn twice (the cube and its glow copy). */
class Cube extends Node {
  readonly bitmap: Clip;
  readonly arrow = new Node();
  constructor(blocks: ArtInfo[], hint: ArtInfo) {
    super();
    this.bitmap = this.addChild(new Clip(blocks));
    // Flash filters work in screen space, so the glow sits on an unskewed wrapper.
    const glow = this.addChild(new Node());
    glow.el.style.filter = "url(#block-arrow-glow)";
    glow.addChild(this.arrow).addChild(new Art(hint));
    this.arrow.visible = false;
  }
}

const demo: Demo = {
  id: "block",
  title: "Block",
  description:
    "The wooden cube can be flipped by pushing the cursor on the right side. This is a more complex example of how visual force feedback can be used to simulate properties of physical objects.",
  icon: "block_icon.jpg",
  width: 250,
  height: 250,
  background: "#FFFFFF",
  fps: FPS,
  original: "block.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: false, bouncingBalls: true, hideAllObjects: false },
  async build({ stage, engine }) {
    const json = (await (await fetch(`${import.meta.env.BASE_URL}${DIR}block-frames.json`)).json()) as { frames: Record<string, FrameData> };
    const frames = json.frames;
    const all = Object.values(frames);
    const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];
    const blockFiles = uniq(all.map((d) => d.block));
    const load = (files: string[], reg?: { x: number; y: number }) => Promise.all(files.map((n) => loadArt(DIR + n, reg)));
    const [blockInfos, wallInfos, sandInfos, topInfos, [bgInfo, shadowInfo, hintInfo, patchInfo]] = await Promise.all([
      load(blockFiles, { x: 275, y: 200 }), // 200x200 bitmaps, top-left at sprite-221 local (-275, -200)
      load(uniq(all.map((d) => d.wall))),
      load(uniq(all.map((d) => d.sand))),
      load(uniq(all.map((d) => d.topface))),
      Promise.all([loadArt(DIR + "background.jpg"), loadArt(DIR + "shadow.svg"), loadArt(DIR + "hint-arrow.svg"), loadArt(DIR + "sandpatch.svg")]),
    ]);
    // Shape-flag hit areas (fills and strokes). Walls are 2 px strokes, so they need the finer mask.
    const masks = new Map<string, HitShape>();
    const addMasks = (infos: ArtInfo[], res: number) => infos.forEach((i) => masks.set(i.url.slice(i.url.lastIndexOf("/") + 1), hitFromArt(i, res)));
    addMasks(wallInfos, 2);
    addMasks(sandInfos, 1);
    addMasks(topInfos, 1);

    stage.el.appendChild(filterDefs());

    // --- force / event geometry (sprite 225 depths 1-35), never drawn --------------------------
    const forces = stage.addChild(new Node());
    const over = { back: false, fwd: false };
    let pushing = false;

    // hoepback (d1) / hoep2 (d6): ButtonMaker zones; their "over" frame holds a pushBlock(∓1) driver.
    const hoep = (key: keyof typeof over) => {
      const n = forces.addChild(new Node());
      n.hitShape = rect(-34, -34, 68, 68);
      n.addBehaviour(new ButtonMaker({ out: 1, over: "over", down: 1, up: 1, rolloverCursorStyle: "Finger", goto: (fr) => (over[key] = fr === "over") }));
      return n;
    };
    const hoepback = hoep("back");
    const hoep2 = hoep("fwd");
    const gutterSlot = forces.addChild(new Node()); // d12, a fresh PC_Pushgutter every frame 3-27 (unmasked, see spec)
    const walls = forces.addChild(new Node()).set({ x: 297.25, y: 212.15 }); // d21 blockframe
    walls.addBehaviour(new WallMaker());
    const rough = forces.addChild(new Node()).set({ x: 298.0, y: 211.9 }); // d26 rougharea
    rough.addBehaviour(new SandMaker(0, 2, "None", 0));
    const top = forces.addChild(new Node()).set({ x: 298.55, y: 212.05 }); // d29 blokbovenvlak
    const patchSlot = forces.addChild(new Node()); // d32
    const roundSlot = forces.addChild(new Node()); // d35

    const patch = new Node();
    patch.hitShape = hitFromArt(patchInfo, 2);
    patch.addBehaviour(new SandMaker(0, 3, "None", 0));
    const hill = new Hill({ strength: -1, shape: "Sine-shaped", plateauDiameter: 0, style: "None", tint: 0xff6600 });
    const hole = new Hole({ strength: 3, shape: "U-shaped", plateauDiameter: 2, style: "None", tint: 0xff6600 });

    // --- visible layers (d41-47) -------------------------------------------------------------
    stage.addChild(new Art(bgInfo)).set({ x: 0.1, y: 0.65 });
    const shadow = stage.addChild(new Art(shadowInfo)).set({ x: 122.45, y: 155.3, alpha: 38 / 256 });
    shadow.el.style.mixBlendMode = "darken";
    // blokjesshade: a squashed copy, blurred and darkened in screen space (filter on an unscaled wrapper).
    const shadeWrap = stage.addChild(new Node()).set({ alpha: 95 / 256 });
    shadeWrap.el.style.filter = "url(#block-shade)";
    const shade = shadeWrap.addChild(new Node()).set({ x: 298.8, y: 230.95, scaleY: 0.5744171 }).addChild(new Cube(blockInfos, hintInfo));
    const cube = stage.addChild(new Cube(blockInfos, hintInfo)).set({ x: 298.3, y: 212.4 });
    const cubes = [cube, shade];

    const cursor = await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 });
    // blokbovenvlak's listeners: `_root.cursor.gotoAndStop("finger" | "arrow")` (the picture only, not the style name).
    const finger = () => cursor.showStyle("Finger");
    top.addBehaviour(
      new EventDispatcher({
        pc_rollin: () => (finger(), (pushing = true)),
        pc_rollover: () => (finger(), (pushing = true)),
        pc_rollout: () => (cursor.showStyle("Arrow"), (pushing = false)),
        pc_mousedown: finger,
        pc_mouseup: finger,
      }),
    );

    // --- the frame -----------------------------------------------------------------------------
    let f = 0;
    let arrowKey: Matrix | null = null;
    let arrowFrame = 0;
    let patchKey = "";
    const show = (n: number) => {
      f = n;
      const d = frames[n];
      hoepback.setMatrix(matrix(d.hoepback.matrix));
      hoep2.setMatrix(matrix(d.hoep2.matrix));
      gutterSlot.children.forEach((c) => c.remove());
      if (d.pushgutter) {
        const g = d.pushgutter;
        gutterSlot.addChild(new Pushgutter({ ...g.params, arrowStyle: "None", graphicsStyle: "None", rolloverCursorStyle: "Null" })).set({
          x: g.x,
          y: g.y,
          scaleX: g.scaleX,
          scaleY: g.scaleY,
          rotation: g.rotation,
          alpha: g.alpha,
        });
      }
      walls.hitShape = d.wall ? masks.get(d.wall)! : null;
      rough.hitShape = masks.get(d.sand)!;
      top.hitShape = masks.get(d.topface)!;

      const pk = d.sandpatch ? d.sandpatch.matrix.join() : "";
      if (pk !== patchKey) {
        patchKey = pk;
        patch.remove();
        if (d.sandpatch) {
          const [a, , , , tx, ty] = d.sandpatch.matrix;
          patchSlot.addChild(patch).set({ x: tx, y: ty, scale: a });
        }
      }
      const round = d.hill ? hill : d.hole ? hole : null;
      if (round?.parent !== roundSlot) {
        roundSlot.children.forEach((c) => c.remove());
        const m = (d.hill ?? d.hole)?.matrix;
        if (round && m) roundSlot.addChild(round).set({ x: m[4], y: m[5], scale: m[0] });
      }

      const bmp = blockFiles.indexOf(d.block) + 1;
      const ak = d.hintArrow ? (n <= 2 ? ARROW_UP : ARROW_DOWN) : null;
      if (ak !== arrowKey) {
        // A new sprite-164 instance: restarts its 25-frame delay.
        arrowKey = ak;
        arrowFrame = 1;
        if (ak) for (const c of cubes) c.arrow.setMatrix(ak);
      }
      for (const c of cubes) c.bitmap.gotoAndStop(bmp);
      showArrow();
    };
    const showArrow = () => {
      for (const c of cubes) {
        c.arrow.visible = !!arrowKey && arrowFrame >= 26;
        if (arrowFrame >= 26) c.arrow.alpha = ARROW_ALPHA[arrowFrame - 26] / 256;
      }
    };
    const setBlock = (dir: number) => {
      const n = Math.min(31, Math.max(2, f + dir));
      if (n !== f) show(n);
    };

    // One 40 Hz tick: the 2-frame driver clips call pushBlock / gravityPush every frame.
    const tick = () => {
      if (arrowKey) {
        arrowFrame = arrowFrame + 1 === 75 ? 26 : arrowFrame + 1; // frame 75: gotoAndStop("start"); play()
        showArrow();
      }
      if (pushing) {
        if (over.back) setBlock(-1);
        if (over.fwd) setBlock(+1);
      } else {
        setBlock(frames[f].gravity);
      }
    };
    let acc = 0;
    forces.onEnterFrame = (dt) => {
      acc += dt;
      while (acc >= 1000 / FPS) {
        acc -= 1000 / FPS;
        tick();
      }
    };
    show(2); // frame 1: setBlock(1)

    stage.addChild(cursor).set({ name: "cursor" });
    engine.placeCursors(200, 225);
  },
};

export default demo;
