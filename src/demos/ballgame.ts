import { BallCursor, ButtonMaker, Hill, Hole, Node, SlickMaker, Timeline, art } from "../pc";
import type { Demo } from "./types";

/*
 * Spec: reference/specs/ballgame.md
 *
 * Two BallCursors (mouse movement as force) on a slick dish with two holes.
 * The engine resolves ball-ball hits as elastic collisions; the AS2 engine
 * computed NaN masses, so it only separated the balls without exchanging
 * velocities.
 */

/** Flash BevelFilter as an SVG filter (blur box size ≈ 2σ at quality 3; angle clockwise from +x). */
function bevelFilter(
  defs: SVGElement,
  id: string,
  p: { type: "inner" | "outer" | "full"; angle: number; distance: number; blur: number; strength: number; region: [number, number, number, number] },
) {
  const a = (p.angle * Math.PI) / 180;
  const ox = p.distance * Math.cos(a);
  const oy = p.distance * Math.sin(a);
  const [x, y, w, h] = p.region;
  const s = p.strength;
  const mask = p.type === "full" ? "" : `<feComposite in="bev" in2="SourceAlpha" operator="${p.type === "inner" ? "in" : "out"}" result="bev"/>`;
  defs.insertAdjacentHTML(
    "beforeend",
    `<filter id="${id}" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${p.blur / 2}" result="b"/>
      <feOffset in="b" dx="${-ox}" dy="${-oy}" result="fwd"/>
      <feOffset in="b" dx="${ox}" dy="${oy}" result="back"/>
      <feComposite in="fwd" in2="back" operator="arithmetic" k2="${s}" k3="${-s}" result="hiA"/>
      <feComposite in="back" in2="fwd" operator="arithmetic" k2="${s}" k3="${-s}" result="shA"/>
      <feFlood flood-color="#ffffff"/><feComposite in2="hiA" operator="in" result="hi"/>
      <feFlood flood-color="#000000"/><feComposite in2="shA" operator="in" result="sh"/>
      <feMerge result="bev"><feMergeNode in="hi"/><feMergeNode in="sh"/></feMerge>
      ${mask}
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="bev"/></feMerge>
    </filter>`,
  );
}

/** Sprite 15's fill per frame: blue (1-5), fade to white (13), fade to yellow (20, held). */
// prettier-ignore
const FIELD_FILL = [
  "#0099cc", "#0099cc", "#0099cc", "#0099cc", "#0099cc", "#20a6d2", "#40b3d9", "#60bfdf", "#80cce6", "#9fd9ec",
  "#bfe6f2", "#dff2f9", "#ffffff", "#fff8db", "#fff0b6", "#ffe992", "#ffe26d", "#ffdb49", "#ffd324", "#ffcc00",
];

/** The 118 px playing-field disc (sprite 15) at a given scale, with its colour timeline. */
function fieldDisc(scale: number): Timeline {
  // Frames 21-36 (yellow back to blue) are never reached: frame 20 stops.
  const tl = new Timeline({ frames: 20 });
  // Drawn unscaled so the filter isn't scaled with it (Flash filters work in stage space).
  const d = 118 * scale;
  const disc = new Node();
  disc.el.style.cssText += `width:${d}px;height:${d}px;border-radius:50%`;
  tl.place(disc, 1, 20, 1, Object.fromEntries(FIELD_FILL.map((c, i) => [i + 1, () => (disc.el.style.background = c)])));
  tl.script(1, (t) => t.stop());
  tl.script(20, (t) => t.stop());
  return tl;
}

const demo: Demo = {
  id: "ballgame",
  title: "Ball Game",
  description: "Virtual version of the well known ball game requiring patience and coordination. Can you get the two balls in the two holes?",
  icon: "ballgame.gif",
  width: 450,
  height: 450,
  background: "#333333",
  fps: 25,
  original: "ballgame.swf",
  engine: {
    bouncingBalls: true,
    showRealCursor: true,
    baseForce: 100,
    combineForces: "Add",
    speedLimit: "high speed",
    scaleToAlpha: false,
    hideAllObjects: false,
  },
  async build({ stage, engine }) {
    const D = "demos/ballgame/";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    stage.el.appendChild(svg);
    const defs = svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "defs"));
    bevelFilter(defs, "bg-border", { type: "full", angle: 45, distance: 5, blur: 39, strength: 2.6367188, region: [-200, -200, 400, 400] });
    bevelFilter(defs, "bg-field", { type: "inner", angle: 225, distance: 3, blur: 5, strength: 1, region: [-20, -20, 230, 230] });
    bevelFilter(defs, "bg-fieldtop", { type: "inner", angle: 45, distance: 14, blur: 40, strength: 0.796875, region: [-20, -20, 220, 220] });
    bevelFilter(defs, "bg-hole1", { type: "outer", angle: 45, distance: 2, blur: 12, strength: 1.0078125, region: [-30, -30, 80, 80] });
    bevelFilter(defs, "bg-hole2", { type: "outer", angle: 45, distance: 2, blur: 12, strength: 1.1875, region: [-30, -30, 80, 80] });

    const [board, border, dot1, dot2] = await Promise.all([
      art(`${D}board-square.svg`),
      art(`${D}border-disc.svg`),
      art(`${D}hole-dot.svg`, { hit: true }),
      art(`${D}hole-dot.svg`, { hit: true }),
    ]);

    // Rim field (depth 6) and outer push (depth 12): both 332 px around (229, 184).
    stage
      .addChild(new Hole({ strength: 20, shape: "U-shaped", plateauDiameter: 52, style: "None", rolloverCursorSound: "", rolloverCursorStyle: "Null" }))
      .set({ x: 63, y: 18, scale: 3.3200073 });
    stage
      .addChild(new Hill({ strength: 10, shape: "U-shaped", plateauDiameter: 80, style: "None", rolloverCursorSound: "", rolloverCursorStyle: "Null" }))
      .set({ x: 63, y: 18, scale: 3.3200073 });

    // Slick dome clip (sprite 7, depth 18): its hill's disc is also the SlickMaker's hit area.
    const dome = stage.addChild(new Node()).set({ x: 143, y: 100 });
    dome
      .addChild(
        new Hill({
          strength: 2,
          shape: "U-shaped",
          plateauDiameter: 15,
          style: "Disc with shading",
          tint: 0xdd2424,
          rolloverCursorSound: "puff",
          rolloverCursorStyle: "Null",
        }),
      )
      .set({ x: 0, y: 2, scale: 1.699997 });
    dome.addBehaviour(new SlickMaker(2, "None", 0));

    stage.addChild(board).set({ x: 230, y: 239.8, scale: 0.6875 });
    stage.addChild(border).set({ x: 229, y: 189 });
    border.el.style.filter = "url(#bg-border)";

    const field = stage.addChild(fieldDisc(1.5762787)).set({ x: 135, y: 94 });
    field.el.style.filter = "url(#bg-field)";
    const fieldTop = stage.addChild(fieldDisc(1.4911346)).set({ x: 140, y: 99 });
    fieldTop.el.style.filter = "url(#bg-fieldtop)";

    // Main frame 1 script.
    let ballinholes = 0;
    const ballInside = (i: number) => {
      ballinholes = Math.max(0, ballinholes + i);
      if (ballinholes === 2) {
        field.gotoAndPlay(2);
        fieldTop.gotoAndPlay(2);
      }
      if (ballinholes < 2) {
        field.gotoAndStop(1);
        fieldTop.gotoAndStop(1);
      }
    };

    // Hole assembly (sprite 18), twice.
    const holeAssembly = (x: number, y: number, filter: string, dot: Node) => {
      const a = stage.addChild(new Node()).set({ x, y });
      a.el.style.filter = `url(#${filter})`;
      a.addChild(
        new Hole({ strength: 9, shape: "U-shaped", plateauDiameter: 3, style: "Disc", tint: 0x000000, rolloverCursorSound: "", rolloverCursorStyle: "Null" }),
      ).set({ x: 0, y: 1, scale: 0.1802826 });
      a.addChild(new Hill({ strength: 3, shape: "U-shaped", plateauDiameter: 20, style: "None", rolloverCursorSound: "", rolloverCursorStyle: "Null" })).set({
        x: -10,
        y: -10,
        scale: 0.3799591,
      });
      // Hole sensor (sprite 17): 10 frames, "out" = 2, "over" = 4; counts a ball 4 frames after "over".
      const sensor = a.addChild(new Timeline({ frames: 10, labels: { out: 2, over: 4 }, fps: 25 })).set({ x: 2, y: 2 });
      sensor.placeAlways(dot);
      let inside = false;
      sensor.script(1, (tl) => {
        inside = false;
        tl.stop();
      });
      sensor.script(2, (tl) => {
        if (inside) {
          ballInside(-1);
          inside = false;
        }
        tl.stop();
      });
      sensor.script(4, (tl) => tl.play());
      sensor.script(8, (tl) => {
        if (!inside) {
          ballInside(+1);
          inside = true;
        }
        tl.stop();
      });
      const bm = sensor.addBehaviour(new ButtonMaker({ out: "out", over: "over", down: "over", up: "over", rolloverCursorStyle: "Default" }));
      bm.rolloverCursorSound = "pop";
    };
    holeAssembly(174.55, 202.5, "bg-hole1", dot1);
    holeAssembly(211.55, 223.5, "bg-hole2", dot2);

    // The balls (main frame 4).
    const balls = await Promise.all([BallCursor.create({ grip: 50, inertia: 10, tint: 0x999999 }), BallCursor.create({ grip: 50, inertia: 10, tint: 0x999999 })]);
    stage.addChild(balls[0]).set({ x: 213.25, y: 211.75 });
    stage.addChild(balls[1]).set({ x: 236.3, y: 236.75 });

    // KeepBallsInGame(): frames 5-6 loop, so the clamp runs every 2nd frame, after the engine step.
    const xmin = 135;
    const xmax = 135 + 118 * 1.5762787;
    const ymin = 94;
    const ymax = 94 + 118 * 1.5762787;
    let acc = 0;
    return engine.onFrame((dt) => {
      acc += dt;
      if (acc < 80) return;
      acc %= 80;
      for (const b of balls) b.set({ x: Math.min(xmax, Math.max(xmin, b.x)), y: Math.min(ymax, Math.max(ymin, b.y)) });
    });
  },
};

export default demo;
