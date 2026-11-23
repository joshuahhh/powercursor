import { Art, ButtonMaker, Hole, Node, Timeline, loadArt, rect, type ArtInfo, type PCEvent } from "../../pc";

/**
 * headerbar.swf (spec: reference/specs/headerbar.md): the powercursor.com menu bar.
 *
 * Returns the headerbar movie's content in its own stage space (750x120). Mount it
 * in a host at an offset (home.swf: (26, 208)); its buttons then use the host's
 * engine and cursor, as when it was loadMovie'd. Standalone use: add it to a
 * 750x120 stage with an engine (Topmost, scaleToAlpha) and an ArrowCursor
 * (grip 50, inertia 10) at (368.45, 50).
 */
export interface HeaderbarOptions {
  /** Called on release with the original (relative) URL, e.g. "../examples/". Default: inert. */
  onNavigate?: (url: string) => void;
}

const BUTTONS: { depth: number; url: string; x: number; y: number; sx: number; sy: number; alpha: number }[] = [
  // headerbar-local placement (sprite 17), from headerbar.xml
  { depth: 4, url: "../", x: 303.7, y: -27.5, sx: 0.5855, sy: 1, alpha: 0 }, // "home"
  { depth: 13, url: "../about/", x: -331.4, y: -0.5, sx: 0.7617, sy: 1.0007, alpha: 1 },
  { depth: 22, url: "../examples/", x: -189.9, y: -0.6, sx: 0.9594, sy: 1.0007, alpha: 1 },
  { depth: 31, url: "../download/", x: -264.25, y: -0.5, sx: 1.0548, sy: 1.0007, alpha: 1 },
  { depth: 40, url: "../forum/", x: -19.75, y: -0.5, sx: 0.7616, sy: 1.0007, alpha: 1 },
  { depth: 49, url: "../documentation/", x: -99.45, y: -0.75, sx: 1.3797, sy: 1.0007, alpha: 1 },
  { depth: 58, url: "../colofon/", x: 349.35, y: -27.5, sx: 0.6387, sy: 1, alpha: 0 }, // "colofon"
  { depth: 67, url: "../", x: 268.7, y: 0.4, sx: 2.7555, sy: 1.0007, alpha: 0 }, // logo area
  { depth: 76, url: "../faq/", x: 27, y: -0.5, sx: 0.5543, sy: 1.0007, alpha: 1 },
];

// The rounded bar shape of bar-mask.svg (local coordinates), used as the mask of depths 4-85.
const MASK =
  "M363.5 -15.05 Q365.15 -13.35 365.15 -11.05 L365.15 11.65 Q365.15 14 363.5 15.65 361.85 17.3 359.5 17.3 L-354.95 17.3 Q-357.25 17.3 -358.95 15.65 -360.6 14 -360.6 11.65 L-360.6 -11.05 Q-360.6 -13.35 -358.95 -15.05 -357.25 -16.7 -354.95 -16.7 L359.5 -16.7 Q361.85 -16.7 363.5 -15.05Z";

/** Sprite 10: one menu button (50 frames, driven by PC_ButtonMaker). */
function button(highlight: ArtInfo, pressed: ArtInfo, url: string, onNavigate?: (url: string) => void): Timeline {
  const b = new Timeline({ frames: 50, fps: 30, play: true, labels: { "over(still2)": 1, out: 2, over: 15, "over(still)": 18, down: 36, up: 42 } });
  const hi = new Art(highlight);
  // d7 highlight: frames 1-35, alpha tween on out (2-5) and over (15-18)
  b.place(hi, 1, 35, 7, {
    1: { alpha: 1 },
    2: { alpha: 0.199 },
    3: { alpha: 0.133 },
    4: { alpha: 0.066 },
    5: { alpha: 0 },
    15: { alpha: 0 },
    16: { alpha: 0.332 },
    17: { alpha: 0.668 },
    18: { alpha: 1 },
  });
  // d1 over-Hole (frames 15-26 only): pulls the cursor into the word for ~0.4 s. Invisible (style None).
  b.place(
    () =>
      new Hole({ strength: 6, shape: "Sine-shaped", plateauDiameter: 5, style: "None", rolloverCursorStyle: "Null" }).set({
        x: -50.85,
        y: -31.8,
        scaleX: 1,
        scaleY: 0.66,
      }),
    15,
    26,
    1,
  );
  b.place(new Art(pressed), 36, 41, 2);
  b.place(new Art(highlight), 42, 50, 1, { 42: { alpha: 0 } });
  for (const f of [1, 2, 15, 42]) b.script(f, (mc) => mc.play());
  for (const f of [5, 10, 27, 36, 48]) b.script(f, (mc) => mc.stop());
  // The button's drawn content (the 76x35 image, even at alpha 0) is its hit area, plus the Hole while it exists.
  b.hitShape = rect(-38.6, -17.35, 76.45, 34.75);
  b.begin();
  // PC_ButtonMaker: its constructor does gotoAndStop("out"), whose frame script then play()s the fade-out.
  const bm = b.addBehaviour(new ButtonMaker({ out: "out", over: "over", down: "down", up: "up", rolloverCursorStyle: "Finger" }));
  bm.rolloverCursorSound = "scratch";
  b.on("pc_mouseup", (_e: PCEvent) => {
    console.log("[headerbar] getURL", url);
    onNavigate?.(url);
  });
  return b;
}

export async function buildHeaderbar(opts: HeaderbarOptions = {}): Promise<Node> {
  const dir = "demos/headerbar/";
  const [outer, inner, highlight, pressed, menuText, topLinks, logo] = await Promise.all(
    ["bar-outer.svg", "bar-inner.svg", "button-highlight.svg", "button-pressed.svg", "menu-text.svg", "top-links-text.svg"]
      .map((f) => loadArt(dir + f))
      .concat(loadArt(dir + "powercursor-logo.png", { x: 0, y: 0 })),
  );

  // headerbar.swf's root. Embedded, frame 1 stop()s, so the bar stays at x=365 (frame 2 would move it to 365.15).
  const root = new Node();
  const bar = root.addChild(new Node()).set({ x: 365, y: 67, scaleX: 0.9998, scaleY: 1.001 });
  bar.name = "headerbar";
  // DropShadow (black, 0.4, 60°, distance 3, blur 3) and a 1 px bevel.
  bar.el.style.filter = "drop-shadow(1.5px 2.6px 1.5px rgba(0,0,0,0.4))";

  bar.addChild(new Art(outer));
  bar.addChild(new Art(inner)).set({ x: 10, scaleX: 1.0196, scaleY: 1.0176 });
  // d3 mask (clipDepth 85) clips the nine buttons to the rounded bar. A mask doesn't affect hit tests.
  const masked = bar.addChild(new Node());
  masked.el.style.clipPath = `path("${MASK}")`;
  for (const b of BUTTONS) {
    masked.addChild(button(highlight, pressed, b.url, opts.onNavigate)).set({ x: b.x, y: b.y, scaleX: b.sx, scaleY: b.sy, alpha: b.alpha });
  }
  bar.addChild(new Art(menuText)).set({ x: -348, y: -7 });
  bar.addChild(new Art(topLinks)).set({ x: 294, y: -37 });
  bar.addChild(new Node()).set({ x: 278.5, y: -0.15 }).addChild(new Art(logo)).set({ x: -99.5, y: -11.55 });
  return root;
}
