import { ArrowCursor, Node, Slick, WallMaker, art } from "../pc";
import type { Demo } from "./types";

/** Spec: reference/specs/maze.md */
const demo: Demo = {
  id: "maze",
  title: "Maze",
  description: "This simple maze example shows how to use a wall object.",
  icon: "maze.gif",
  width: 700,
  height: 500,
  background: "#333333",
  fps: 25,
  original: "maze.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "high speed", scaleToAlpha: false, bouncingBalls: true },
  async build({ stage, engine }) {
    // Invisible (alpha 0) slick over the maze's bounding box, under the maze art.
    stage
      .addChild(new Slick({ strength: 0.1, style: "Square", tint: 0xdd2424, rolloverCursorStyle: "Ball", rolloverCursorSound: "frantic" }))
      .set({ x: 122.6, y: 56, scaleX: 3.9036713, scaleY: 2.792511, alpha: 0 });

    // Sprite 7 `maze`: the red walls, made a wall by its WallMaker child.
    const maze = stage.addChild(new Node()).set({ name: "maze", x: -30.2, y: -34.5, scale: 1.0280151 });
    maze.addChild(await art("demos/maze/maze-walls.svg", { hit: true })).set({ x: 147, y: 87.15, scale: 0.6485596 });
    maze.addBehaviour(new WallMaker());
    // The maze placement carries an inner BevelFilter (angle 45°, distance 1, blur 2, white/black, strength 1).
    stage.el.insertAdjacentHTML(
      "beforeend",
      `<svg width="0" height="0" style="position:absolute"><filter id="maze-bevel" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.7" result="b"/>
        <feOffset in="b" dx="0.71" dy="0.71" result="down"/><feOffset in="b" dx="-0.71" dy="-0.71" result="up"/>
        <feComposite in="SourceAlpha" in2="down" operator="out" result="hl"/><feComposite in="SourceAlpha" in2="up" operator="out" result="sh"/>
        <feFlood flood-color="#fff"/><feComposite in2="hl" operator="in" result="hlc"/>
        <feFlood flood-color="#000"/><feComposite in2="sh" operator="in" result="shc"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="hlc"/><feMergeNode in="shc"/></feMerge>
      </filter></svg>`,
    );
    maze.el.style.filter = "url(#maze-bevel)";

    stage.addChild(await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 }));
    engine.placeCursors(392.5, 84);
  },
};

export default demo;
