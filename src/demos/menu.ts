import { ArrowCursor, ButtonMaker, Dimmer, Gutter, Node, Slick, Target, Timeline, rect } from "../pc";
import type { Demo } from "./types";

/** PC_ButtonMaker on a button clip (spec: outframe="out", ..., rolloverCursorStyle="Default"). */
function buttonMaker(b: Timeline, sound = "") {
  const bm = b.addBehaviour(new ButtonMaker({ out: "out", over: "over", down: "down", up: "up", rolloverCursorStyle: "Default" }));
  if (sound) bm.rolloverCursorSound = sound;
}

const SERIF = 'Garamond, "Adobe Garamond Pro", "EB Garamond", "Times New Roman", Times, serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * The 90x90 gradient box (shape 3: #fff at the top to #999 at the bottom) at its final
 * size, with a Flash colour transform c' = c * mult / 256 + add applied to both stops.
 */
function box(w: number, h: number, mult = 256, add = 0): Node {
  const n = new Node();
  n.el.style.width = `${w}px`;
  n.el.style.height = `${h}px`;
  tintBox(n, mult, add);
  return n;
}
function tintBox(n: Node, mult: number, add: number) {
  const c = (v: number) => Math.round(Math.min(255, (v * mult) / 256 + add));
  n.el.style.background = `linear-gradient(rgb(${c(255)},${c(255)},${c(255)}), rgb(${c(153)},${c(153)},${c(153)}))`;
}

/** A device-font text field: its text box (inside Flash's 2 px gutter) at x, y. */
function text(x: number, y: number, w: number, css: string, content = ""): Node {
  const n = new Node().set({ x, y });
  n.el.style.cssText += `width:${w}px;${css}`;
  n.el.textContent = content;
  return n;
}

/** Spec: reference/specs/menu.md */
const demo: Demo = {
  id: "menu",
  title: "Menu with slick-disabled buttons",
  description: "The disabled items in the drop-down menus are made slick, so that the cursor slides over them quickly. An example of assisted navigation.",
  icon: "menu.jpg",
  width: 600,
  height: 400,
  background: "#333333",
  fps: 25,
  original: "menu.swf",
  engine: { baseForce: 100, combineForces: "Add", speedLimit: "average speed", scaleToAlpha: false, bouncingBalls: true, hideAllObjects: false },
  async build({ stage, engine }) {
    // Sprite 33: the menu widget. Slot depth 10 holds one drop-down or the dialog per label.
    const widget = stage.addChild(new Timeline({ frames: 55, fps: 25, play: true, labels: { ok: 10, Dessert: 18, vegetable: 27, Meat: 35, Potatoe: 45 } }));
    widget.set({ x: 110, y: 36 });
    widget.el.style.filter = "drop-shadow(0 0 20px #000)"; // GlowFilter black, blur 20 (Flash blur ≈ CSS blur radius)

    let buttondown = false;
    let selected = "niks";

    // --- buttons: sprites 19 (header), 21 (item / Ok / Cancel), 26 (disabled item), 28 (bottom bar) ---

    /** Sprites 19 / 21: white box, dark bevelled highlight while hovered, an inverted label, a brief Gutter. */
    const button = (name: string, sx: number, sy: number, scripts: { over?: () => void; down: () => void }) => {
      const w = 160 * sx;
      const b = new Timeline({ frames: 27, fps: 25, labels: { out: 2, over: 6, overready: 14, down: 18, up: 23 } });
      b.set({ name, scaleY: sy });
      // Horizontal gutter, frames 6-13 only (a fresh one each time): a short snap to the row's centre line after each rollin.
      const gutter = () =>
        new Gutter({
          strength: 4,
          plateauDiameter: 5,
          shape: "U-shaped",
          graphicsStyle: "None",
          tint: 0xdd2424,
          rolloverCursorSound: "nerve", // "nerve.wav" in the SWF
          rolloverCursorStyle: "Null",
        }).set({ scaleX: 0.80006 * sx, scaleY: 0.88 });
      b.place(gutter, 6, 13, 1);
      b.placeAlways(box(w, 21.99, 0, 255), 5);
      const hi = b.place(box(w, 22), 6, 22, 7);
      hi.el.style.boxShadow = "inset 0.7px 0.7px 2px #fff, inset -0.7px -0.7px 2px #000"; // BevelFilter, inner
      // Label (sprite 17, blend INVERT): white + "difference" inverts whatever box is beneath it.
      // Device text doesn't stretch with the instance's x-scale; only its position does.
      b.placeAlways(text(10 * sx, 4.55, w - 10 * sx, `font:500 15px/18px ${SANS};color:#fff;mix-blend-mode:difference;white-space:nowrap`, name), 11);
      // Highlight colour tween (frames 6-9), then dark: [mult, add].
      const tween: [number, number][] = [
        [0, 255],
        [21, 170],
        [43, 85],
        [64, 0],
      ];
      tween.forEach(([m, a], i) => b.script(6 + i, () => tintBox(hi, m, a)));
      b.script(6, (tl) => (scripts.over?.(), tl.play()));
      b.script(14, (tl) => tl.stop());
      b.script(18, scripts.down);
      b.hitShape = rect(0, 0, w, 22);
      buttonMaker(b, "crackle");
      return b;
    };

    /** Sprite 26: no visual states; a vertical-only Slick until pressed. */
    const disabledItem = (name: string, sx: number, sy: number) => {
      const w = 160 * sx;
      const b = new Timeline({ frames: 30, fps: 25, labels: { out: 2, over: 6, overready: 17, down: 21, up: 26 } });
      b.set({ name, scaleY: sy });
      // style "Block with shading" isn't a Slick style: only the Icy overlay is drawn, hidden under the white box.
      const slick = () =>
        new Slick({
          strength: 6,
          directionDependency: "Two-way",
          dirDepAngle: 180,
          style: "None",
          tint: 0xdd2424,
          rolloverCursorSound: "tickle",
          rolloverCursorStyle: "Null",
        }).set({ scaleX: 1.5998 * sx, scaleY: 0.2198 });
      b.place(slick, 1, 20, 1);
      b.placeAlways(box(w, 21.99, 0, 255), 5);
      // Text 25: wordWrap field 162 x ~20 px, so a long label wraps and its second line is clipped.
      const label = text(10 * sx, 4, 162 * sx - 4, `height:20px;overflow:hidden;font:500 15px/18px ${SANS};color:#bbbbbb`, name.concat(" (sold out)", "  "));
      b.placeAlways(label, 9);
      b.script(6, (tl) => tl.play());
      b.script(17, (tl) => tl.stop());
      b.hitShape = rect(0, 0, w, 22);
      buttonMaker(b);
      return b;
    };

    /** Sprite 28 "Terminator": a grey bar whose one-way Dimmer stops downward mouse motion. */
    const terminator = (sx: number) => {
      const w = 160 * sx;
      const b = new Timeline({ frames: 27, fps: 25, labels: { out: 2, over: 6, overready: 14, down: 18, up: 23 } });
      b.name = "Terminator";
      const dimmer = new Dimmer({
        scope: "Mouse",
        dimmingFactor: 0,
        directionDependency: "One-way",
        dirDepAngle: 180,
        tint: 0xdd2424,
        rolloverCursorStyle: "Ball",
      });
      b.placeAlways(dimmer.set({ scaleX: 1.6 * sx, scaleY: 0.10001 }), 1);
      b.placeAlways(box(w, 9.99), 3);
      b.script(6, (tl) => tl.play());
      b.script(14, (tl) => tl.stop());
      b.hitShape = rect(0, 0, w, 10);
      buttonMaker(b);
      return b;
    };

    // --- panel (depths 1-9) ---

    widget.placeAlways(box(360.03, 269.87).set({ x: -0.05, alpha: 164 / 256 }), 1);
    const panelText = (stageX: number, stageY: number, size: number, content: string, bold = false) =>
      text(stageX + 2 - 110, stageY + 2 - 36, 419.95 - 4, `font:${bold ? "bold " : ""}${size}px/1.15 ${SERIF};color:#000;text-align:center`, content);
    widget.placeAlways(panelText(82, 86.75, 30, "Select your Menu", true), 3);
    const menuText: Record<string, Node> = {
      myMeat: panelText(80.05, 123.9, 30, "Meat"),
      myPotatoe: panelText(80.05, 152.9, 30, "Potatoes"),
      myVegetable: panelText(80.05, 185.9, 30, "Vegetables"),
      myDessert: panelText(80.05, 220.9, 30, "Dessert"),
    };
    Object.values(menuText).forEach((n, i) => widget.placeAlways(n, 4 + i));
    widget.placeAlways(panelText(82.05, 62.05, 18, "Use the dropdown menu's above to"), 8);
    widget.placeAlways(panelText(82.05, 262.5, 18, "This demo shows slick-disabled menu items."), 9);

    // --- SetMenu (sprite 33, frame 2) ---

    function setMenu(type: string, what: string) {
      console.log("menu:" + type + " " + what); // the original's trace()
      selected = "you selected: " + what + "";
      if (type === "myPotatoe") menuText.myPotatoe.el.textContent = "with " + what + " Potatoes";
      if (type === "myMeat") menuText.myMeat.el.textContent = " " + what + " ";
      if (type === "myVegetable") menuText.myVegetable.el.textContent = "and " + what + " ";
      if (type === "myDessert") menuText.myDessert.el.textContent = "" + what + " for dessert ";
      if (what === "Ok" || what === "Cancel") widget.gotoAndPlay(1);
      // `gotoAndStop("ok"); play();`: AVM1 runs frame 10's stop() after the play(), so it ends stopped.
      else widget.gotoAndStop("ok");
    }
    // Panel lines keep leading/trailing spaces like the Flash text field.
    for (const n of Object.values(menuText)) n.el.style.whiteSpace = "pre";

    // --- drop-downs (sprites 29-32): rows in stage coordinates. Factories: each opening is a fresh instance, as in Flash. ---

    type Row = [name: string, kind: "on" | "off", stageY: number, sx: number, sy?: number];
    const dropdown = (name: string, ox: number, oy: number, stageX: number, rows: Row[], barY: number) => () => {
      const d = new Node().set({ name, x: ox - 110, y: oy - 36 });
      d.el.style.filter = "drop-shadow(3.54px 3.54px 10px rgba(0,0,0,0.398))"; // DropShadowFilter blur 10, distance 5
      for (const [item, kind, y, sx, sy = 1] of rows) {
        const node = kind === "on" ? button(item, sx, sy, { down: () => setMenu(name, item) }) : disabledItem(item, sx, sy);
        d.addChild(node).set({ x: stageX - ox, y: y - oy });
      }
      d.addChild(terminator(1.235)).set({ x: stageX - ox, y: barY - oy });
      return d;
    };
    const S = 1.2346;
    const s = 1.2343;
    const myDessert = dropdown(
      "myDessert",
      395,
      77,
      375,
      [
        ["Applepie", "on", 59.25, S],
        ["Kiwiflip", "off", 81, S],
        ["OrangeCake", "on", 103, S],
        ["Caramelpudding", "on", 125, s],
        ["DameBlanche", "off", 147, 1.2342, 0.99591],
        ["GreenTeaCake", "off", 169, 1.2342, 0.99591],
        ["ChocolateCake", "on", 191, s],
        ["BananaFlip", "on", 213, s],
        ["StrawberryPie", "on", 235, s],
      ],
      257,
    );
    const myVegetable = dropdown(
      "myVegetable",
      307,
      77,
      287,
      [
        ["Spinach", "on", 59.25, S],
        ["BlackPeas", "on", 81, s],
        ["CucumberSalad", "off", 103, S],
        ["TomatoSalad", "on", 125, s],
        ["Asparagus", "on", 147, s],
        ["Sprouts", "off", 169, 1.2342, 0.99591],
        ["Broccoli", "off", 191, 1.2342, 0.99591],
        ["Mushrooms", "on", 213, s],
        ["Eggplant", "on", 235, s],
      ],
      257,
    );
    const myMeat = dropdown(
      "myMeat",
      130,
      77,
      110,
      [
        ["Chicken", "on", 59.25, S],
        ["Pork", "on", 81, s],
        ["Beef", "off", 103, S],
        ["Tofu", "on", 125, s],
        ["Shrimp", "on", 147, s],
      ],
      169,
    );
    const myPotatoe = dropdown(
      "myPotatoe",
      220,
      77,
      200,
      [
        ["Mashed", "off", 59, S],
        ["Cooked", "on", 81, s],
        ["Fried", "on", 103, s],
        ["Baked", "on", 125, s],
      ],
      146,
    );

    // --- dialog (sprite 23) at widget (82, 71); children in stage coordinates minus (192, 107) ---

    const dialog = () => {
      const dialog = new Node().set({ x: 82, y: 71 });
      // Invisible Target pulling towards Ok (centre (253.06, 171) on stage).
      dialog
        .addChild(new Target({ strength: 35, plateauDiameter: 5, shape: "Sine-shaped", style: "None", showBullseye: false, tint: 0xdd2424 }))
        .set({ x: -159.85, y: -156.9, scale: 4.4183, alpha: 0.461 });
      // Box: DropShadow then ColorMatrix +100 on RGB (box ≈ white, shadow lifted to grey 100).
      const dlgBox = dialog.addChild(box(226.05, 90, 256, 100)).set({ x: -7, y: 0 });
      dlgBox.el.style.boxShadow = "3.54px 3.54px 10px rgb(100,100,100)";
      const dialogButton = (name: string, x: number) => {
        const b = dialog.addChild(button(name, 0.54897, 1, { down: () => setMenu("instance", name) })).set({ x, y: 56.5 });
        b.el.style.filter = "drop-shadow(3.54px 3.54px 5px rgba(0,0,0,0.207)) drop-shadow(0 0 2px #000)"; // DropShadow, then a thin Glow
      };
      dialogButton("Ok", 205.05 - 192);
      const okText = dialog.addChild(
        text(187.94 + 2 - 192, 119 + 2 - 107, (201.95 - 4) * 1.0797, `font:500 15px/18px ${SANS};color:#000;text-align:center;white-space:pre`),
      );
      dialogButton("Cancel", 304.05 - 192);
      okText.el.textContent = selected; // frame 1: okmenutext = _parent.selected
      return dialog;
    };

    // --- headers (depths 108-144, above the slot) and the timeline ---

    const header = (name: string) =>
      button(name, 0.56161, 1, {
        over: () => buttondown && widget.gotoAndPlay(name),
        down: () => {
          buttondown = true;
          widget.gotoAndPlay(name); // "Vegetable" finds the label "vegetable": labels match case-insensitively
        },
      });
    widget.place(dialog, 10, 17, 10);
    widget.place(myDessert, 18, 26, 10);
    widget.place(myVegetable, 27, 34, 10);
    widget.place(myMeat, 35, 44, 10);
    widget.place(myPotatoe, 45, 55, 10);
    widget.placeAlways(header("Potatoe").set({ x: 90 }), 108);
    widget.placeAlways(header("Vegetable").set({ x: 180 }), 120);
    widget.placeAlways(header("Meat").set({ x: 0 }), 132);
    widget.placeAlways(header("Dessert").set({ x: 270 }), 144);

    widget.script(2, (tl) => {
      buttondown = false;
      selected = "niks";
      tl.stop();
    });
    for (const f of [10, 18, 27, 35, 45]) widget.script(f, (tl) => tl.stop());

    stage.addChild(await ArrowCursor.create({ cursorStyle: "Arrow", grip: 50, inertia: 10 }));
    engine.placeCursors(370.5, 59);
  },
};

export default demo;
