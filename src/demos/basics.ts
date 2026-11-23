import { ArrowCursor, Dimmer, Gutter, Hill, Hole, Node, Pushgutter, Ramp, Sand, Slick, Target, Twister, Wall, Wedge } from "../pc";
import type { Demo } from "./types";

/**
 * Not one of the site's examples (its "Basic Building Blocks" entry was
 * commented out), but a handy test bench: every ready-made object with its
 * default parameters.
 */
const demo: Demo = {
  id: "basics",
  title: "Basic Building Blocks",
  description:
    "Every ready-made PowerCursor object with its default settings: hill, hole, twister, target, gutter, pushgutter, ramp, wedge, sand, slick, dimmer and wall. Turn on “Show forces” to see the field.",
  width: 800,
  height: 520,
  background: "#333333",
  fps: 30,
  async build({ stage, engine }) {
    const label = (text: string, x: number, y: number) => {
      const n = stage.addChild(new Node()).set({ x, y });
      n.el.className += " pc-label";
      n.el.textContent = text;
    };

    stage.addChild(new Hill()).set({ x: 40, y: 40, scale: 1.4 });
    label("Hill", 40, 190);
    stage.addChild(new Hole()).set({ x: 230, y: 40, scale: 1.4 });
    label("Hole", 230, 190);
    stage.addChild(new Twister({ vortexStyle: "Animated" })).set({ x: 420, y: 40, scale: 1.4 });
    label("Twister", 420, 190);
    stage.addChild(new Target()).set({ x: 610, y: 40, scale: 1.4 });
    label("Target", 610, 190);

    stage.addChild(new Gutter()).set({ x: 40, y: 250 });
    label("Gutter", 40, 280);
    stage.addChild(new Pushgutter({ arrowStyle: "Animated" })).set({ x: 40, y: 320 });
    label("Pushgutter", 40, 350);

    stage.addChild(new Ramp({ angle: 90 })).set({ x: 290, y: 240 });
    label("Ramp (90°)", 290, 345);
    stage.addChild(new Wedge()).set({ x: 420, y: 290 });
    label("Wedge", 420, 345);

    stage.addChild(new Sand()).set({ x: 560, y: 240 });
    label("Sand", 560, 345);
    stage.addChild(new Slick()).set({ x: 680, y: 240 });
    label("Slick", 680, 345);

    // A dimmer switching off the right half of a hill
    stage.addChild(new Hill()).set({ x: 40, y: 380, scale: 1.2 });
    stage.addChild(new Dimmer({ dimmingFactor: 0 })).set({ x: 100, y: 380, scaleX: 0.6, scaleY: 1.2, alpha: 0.5 });
    label("Hill + Dimmer", 40, 505);

    stage.addChild(new Wall()).set({ x: 300, y: 400, scaleX: 2, scaleY: 0.25 });
    stage.addChild(new Wall()).set({ x: 300, y: 400, scaleX: 0.25, scaleY: 1 });
    label("Wall", 300, 505);

    const cursor = stage.addChild(await ArrowCursor.create());
    engine.placeCursors(400, 220);
    void cursor;
  },
};

export default demo;
