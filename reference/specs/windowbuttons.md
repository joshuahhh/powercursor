# windowbuttons — "Windowbuttons"

Source: `windowbuttons.swf` (SWF v8, AS2). Decompiled from `$SCRATCH/out/windowbuttons`. Source FLA exists in `dl/ex/windowbuttons.zip` (not opened).

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 400 | 200 | `#333333` | 25 |

Standalone: `Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

examplelist description: *"Those small buttons in the corner of windows can be difficult to click. Window A has buttons augmented with a force target, which drags the cursor to the center and makes them easier to click than the regular ones in window B. Scientific research points out that the usability of the augmented buttons is significantly higher. Do you notice the difference?"*

**What you experience:** two identical 122.5 px square crops of the top-right corner of an Aqua-style window, side by side. Each has three small round buttons (− + ×) in its title bar and a big grey letter in its white content area: **A** on the left, **B** on the right. Window A's buttons pull the cursor into their centres (a small Target under each). Window B's buttons look and act the same, but an invisible **Dimmer** over window B zeroes all forces, so they have no pull.

Clicking a button:
- **−** slides the window content down-left inside its frame. Black shows behind it.
- **+** restores it.
- **×** makes the content vanish (black square) for 0.92 s. Then it fades back in, sliding from bottom-left to its normal place over 0.72 s.

## Imports (toolkit classes)

| char id | class |
|---|---|
| 8 | `PC_Objects.PC_Target` |
| 9 | `PC_Behaviours.PC_ButtonMaker` |
| 27 | `PC_Objects.PC_Dimmer` |
| 28 | `PC_System.PC_Engine` |
| 29 | `PC_Cursors.PC_ArrowCursor` |

## Demo-local symbols

| id | what | asset |
|---|---|---|
| shape 3 | `#eeeeee` square (18,0.55)–(140.5,123.05). Used **only as a mask** | `window-mask.svg` |
| shape 4 | black rectangle (−0.6,−1.55)–(145.4,126.45): backdrop behind the content | `window-backdrop-black.svg` |
| shape 25 | 2 px black stroke rectangle (18.85,1)–(139.5,122), round joins: frame outline drawn above the content | `window-outline.svg` |
| shape 6 (bitmap 5) | 141x123 window-chrome bitmap: title bar with rounded top-right corner, right scrollbar edge, inner bevel | `window-chrome.svg` / `window-chrome.png` |
| shape 7 | white rectangle 59x75, bounds (−29.5,−38)–(29.5,37) | `window-paper-white.svg` |
| shape 10 | round grey glass button (pixel-traced vector), 36.85x37.2, centred on its origin | `button-up.svg` |
| shape 18 | pressed-button variant (darker), same geometry | `button-pressed-overlay.svg` |
| shapes 12/14/16 (bitmaps 11/13/15) | 9x9 black pixel icons: × / + / − | `icon-close.*`, `icon-plus.*`, `icon-min.*` |
| text 21 / 22 | "A" / "B" (embedded glyphs) | `letter-A.svg`, `letter-B.svg` |
| sprite 17 | icon switcher (labels `crossup` 1, `crossdown` 7, `plusup` 13, `plusdown` 19, `minup` 25, `mindown` 31) | composed |
| sprite 19 | **window button** (20 frames) | composed |
| sprite 23 | letter A/B (2 frames) | letter SVGs |
| sprite 24 | **window content** (chrome + paper + 3 buttons + letter) | composed |
| sprite 26 | **window** (mask + backdrop + content + outline, 67 frames) | composed |
| sprite 2 `bol (MC)` | exported gradient ball, unused leftover | none |

## Display list (stage space, px)

Main timeline:
- Frame 1 places window A, the Dimmer and window B.
- Frame 3 places Engine and Cursor and runs `stop()`.
- Frame 2 is empty. Frame 4 (unreached) only moves the Engine.

| depth | node | x | y | scaleX | scaleY | alpha | renders with | notes |
|---|---|---|---|---|---|---|---|---|
| 1 (f3) | **PC_Engine** | 393 | 296 | 1 | 1.0008 | 1 | toolkit (offstage) | |
| 6 (f1) | **window `A`** (sprite 26) | 44.5 | 45.5 | 1 | 1 | 1 | composed | visible rect (mask) stage **(62.5, 46.05)–(185, 168.55)** |
| 57 (f1) | **PC_Dimmer** | 223 | 48.1 | 1.099 | 1.1805 | 1 | toolkit | 100x100 symbol → **109.9 x 118.05**, covering (223, 48.1)–(332.9, 166.15). Its `#EEABAB` square is drawn but fully hidden behind window B (depth 59 > 57) |
| 59 (f1) | **window B** (sprite 26, unnamed instance) | 198.5 | 45.5 | 1 | 1 | 1 | composed | visible rect stage **(216.5, 46.05)–(339, 168.55)** |
| 110 (f3) | **PC_ArrowCursor** `PC_Cursor` | 392.5 | 84 | 1 | 1 | 1 | toolkit | |

### Inside a window (sprite 26, local; stage = local + window origin)

| depth | node | local x,y | notes |
|---|---|---|---|
| 1 | mask (shape 3) | 0, 0 | **clipDepth 50**: clips depths 2–49 to the rect (18, 0.55)–(140.5, 123.05). Not drawn itself |
| 2 | black backdrop (shape 4) | 0, 0 | `window-backdrop-black.svg`, clipped |
| 3 | **content** (sprite 24) | state-dependent offset, see Timeline (rest: 0, 0) | clipped |
| 49 | outline (shape 25) | 0, 0 | `window-outline.svg`, clipped (so only the inner half of the 2 px stroke along the mask edges shows) |

### Content (sprite 24, local; at rest equals window-local)

| depth | node | local x,y | scale | alpha | stage (window A) | notes |
|---|---|---|---|---|---|---|
| 1 | chrome (shape 6) | 74.4, 61.45 | 1 | 1 | bitmap top-left (48.4, 45.5), 141x123 | |
| 2 | paper (shape 7) | 59, 82.45 | 1.8988 x 1.2707 | 1 | rect (47.49, 79.66)–(159.51, 174.97), clipped at 168.55 | white |
| 3 | button `plus` (sprite 19) | 67.8, −4 | 1 | 1 | circle centre (130.7, 60.1) | |
| 17 | button `cross` (sprite 19) | 87.8, −4.1 | 1 | 1 | centre (150.7, 60.0) | |
| 31 | button `min` (sprite 19) | 47.1, −4.05 | 1 | 1 | centre (110.0, 60.05) | |
| 45 | letter (sprite 23) | 22, 27.75 | 1 | **0.301** (alphaMult 77) | | "A" in window `A`, "B" in any other (see script). Black glyphs at 30% read as ≈`#b3b3b3` grey on white |

Left to right in the title bar: **− (min), + (plus), × (cross)**, 20.7 px apart. Window B button centres = window A + (154, 0): min (264.0, 60.05), plus (284.7, 60.1), cross (304.7, 60.0).

### Window button (sprite 19, local)

| depth | node | local x,y | scale | frames | notes |
|---|---|---|---|---|---|
| 1 | **PC_Target** (child) | 6.75, 6.65 | 0.23808 → 23.81 px square | always | centre (18.654, 18.554), about 0.25 px off the art centre |
| 9 | **PC_ButtonMaker** (child) | 18.5, 52.85 | 1 | always | icon unloaded. Hit area = whole button clip (art circle ≈ 18.4 px ∪ the Target's hit shape: its `graphics` is only alpha-0'd, so it still hit-tests) |
| 11 | button art (shape 10) | 18.4, 18.6 | 0.49933 x 0.5 → 18.40 x 18.60 | always | `button-up.svg` (registration at its centre) |
| 12 | pressed overlay (shape 18) | 18.4, 18.6 | 0.49931 x 0.49731 | frames 10–14 (`down`) | `button-pressed-overlay.svg` |
| 13 | icon `icon` (sprite 17) | 18.3, 18.5 | 1 | always | 9x9 bitmap. "Up" offset: × (−1,−1), + (−0.5,−1.5), − (−1,−1). "Down" offset (0,0), so pressing nudges the icon ~1 px right/down. The bitmap's own top-left is at offset −3.5 from that (`icon-*.svg` registration (3.5,3.5)) |

Icon bitmap top-left in sprite-19 coords: up ×/− (13.8, 14.0), up + (14.3, 13.5), down (14.8, 15.0).

### Toolkit parameters (`on(construct)`)

**PC_Engine:** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=false, hideAllObjects=false`

**PC_ArrowCursor `PC_Cursor`:** `cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true, minHeight=0, minWidth=0`

**PC_Target (in every button, 6 total):** `strength=4, plateauDiameter=10, shape="U-shaped", style="None", showBullseye=false, tint=14492708 (#DD2424), rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`
- Footprint 23.81 px. Plateau 10 local units ≈ 2.4 px.
- On reaching the plateau, strength drops to 0 until the next rollout/rollin.
- Its 10%-white plateau disc (≈2.4 px) sits under the button art.

**PC_ButtonMaker (in every button):** `outframe="out", overframe="over", downframe="down", upframe="up", rolloverCursorSound="", rolloverCursorStyle="Default", visible=true, minHeight=0, minWidth=0`

**PC_Dimmer (main, depth 57):** `scope="Global forces", dimmingFactor=0, directionDependency="None", dirDepAngle=0, tint=15641515 (#EEABAB), rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`
- While the cursor is inside it, all forces are dimmed to 0%. This is what makes window B "regular".
- It covers B's buttons in every state: rest, and the "min" offset (B's buttons then sit at y ≈ 108, x 233–274).
- It does not cover the leftmost 6.5 px or rightmost 6.1 px of window B. No forces live there anyway.

## Timelines / state

### Main
```
frame 1: if (this == _root) { Stage.scaleMode = "noScale"; Stage.align = "TL"; }
         if (_root != this) stop();
frame 3: stop();
```

### Letter (sprite 23)
```
frame 1: trace("hhm");
         if (_parent._parent._name == "A") stop();   // window instance named "A" → shows "A"
         else gotoAndStop(2);                         // other window (unnamed) → shows "B"
frame 2: stop();
```

### Window button (sprite 19). ButtonMaker uses `gotoAndStop`.

| frame | label | display | script |
|---|---|---|---|
| 1 | `out` | art + icon(up) | `jumpup = this._name + "up"; jumpdown = this._name + "down"; jumpcall = this._name; icon.gotoAndStop(jumpup); stop();` |
| 5 | `over` | same (no hover visual) | `icon.gotoAndStop(jumpup); stop();` |
| 10 | `down` | + pressed overlay, icon(down) | `icon.gotoAndStop(jumpdown); stop();` |
| 15 | `up` | overlay removed, icon(up) | `icon.gotoAndStop(jumpup); _parent._parent.jump(jumpcall);` (the window jumps to label `plus` / `min` / `cross`) |

`pc_mouseup` fires whenever the mouse is released over the button, even without a preceding press on it.

### Window (sprite 26)

Frame 1 scripts:
```
currentstate = "plus";                       // unused
jump = function (goto) { gotoAndPlay(goto); };
stop();
```

Content (depth 3) position and alpha per frame (local offset added to the content's rest position):

| frame | label | content x, y | content alpha | script |
|---|---|---|---|---|
| 1 | `plus` | 0, 0 | 1 | `stop()` (rest state) |
| 10 | — | 0, 0 | 1 | `stop()` (unreached) |
| 11 | `min` | **−31, 48** | 1 | `stop()` ("minimised": content shifted down-left. Black backdrop shows top/right. The buttons move with it and stay clickable) |
| 26 | — | −31, 48 | 1 | `stop()` (unreached) |
| 27–49 | `cross` (27) | **−129, 124** | 1 | none. Content is entirely outside the mask, so the window is a black square for 23 frames |
| 50 | — | −129, 124 | 0 | |
| 51–66 | — | linear tween: x = −129 + 7.59·(f−50), y = 124 − 7.29·(f−50) (exact keys below) | alphaMult 15·(f−50) (15, 30, … 241) | |
| 67 | — | 0, 0 | 1 | end of timeline → loops to frame 1 `plus` → `stop()` |

Exact frame 51–66 keys (x, y, alphaMult/256): 51 (−121.4, 116.7, 15) · 52 (−113.8, 109.4, 30) · 53 (−106.25, 102.1, 45) · 54 (−98.65, 94.8, 60) · 55 (−91.05, 87.55, 75) · 56 (−83.45, 80.25, 90) · 57 (−75.9, 72.95, 105) · 58 (−68.3, 65.65, 120) · 59 (−60.7, 58.35, 136) · 60 (−53.1, 51.05, 151) · 61 (−45.55, 43.75, 166) · 62 (−37.95, 36.45, 181) · 63 (−30.35, 29.2, 196) · 64 (−22.75, 21.9, 211) · 65 (−15.2, 14.6, 226) · 66 (−7.6, 7.3, 241).

Transitions:
- `plus` button up → window `gotoAndPlay("plus")`: content back to (0,0), stop.
- `min` → `gotoAndPlay("min")`: content at (−31,48), stop.
- `cross` → `gotoAndPlay("cross")`: hidden 23 frames, fade/slide in over frames 50–67, then rest.
- Clicking × again while it's hidden is impossible (buttons are off-screen). Clicking − or + during the fade-in jumps immediately.

In the "min" state the visible button centres (window A, stage) are min (79.0, 108.05), plus (99.7, 108.1), cross (119.7, 108.0).

## Text

| text | font | size | colour | where |
|---|---|---|---|---|
| "A" (text 21) | Helvetica 95 Black (embedded glyphs) | 80 px | `#000000` at 30.1% alpha | letter sprite, glyph origin x=16, baseline y=76 within text placed at (2,2) |
| "B" (text 22) | Helvetica 95 Black | 80 px | same | glyph origin x=15, baseline y=76 |

Use the SVGs, which carry the glyph outlines. There is no other text, and no links or video.

## Assets — `/public/demos/windowbuttons/`

Registration offset = where the symbol's local (0,0) sits in the SVG's pixel space.

| file | source | size | registration offset (tx,ty) | use |
|---|---|---|---|---|
| `window-mask.svg` | shape 3 | 122.5 x 122.5 | (−18, −0.55) | clip rect only (local (18,0.55)–(140.5,123.05)) |
| `window-backdrop-black.svg` | shape 4 | 146 x 128 | (0.6, 1.55) | window depth 2 at (0,0) |
| `window-outline.svg` | shape 25 | 122.65 x 123 | (−17.85, 0) | window depth 49 at (0,0) |
| `window-content-base.svg` | sprite 24 with only chrome + paper | 141.95 x 129.45 | (−2.95, 0) | content background. Draw at content origin. Buttons and letter are separate |
| `window-chrome.svg` | shape 6 (embeds bitmap) | 141 x 122.9 | (70.5, 61.45) | alternative to the above, placed at content (74.4, 61.45) |
| `window-chrome.png` | bitmap 5 | 141 x 123 | top-left = content (3.9, 0) | same, raw bitmap |
| `window-paper-white.svg` | shape 7 | 59 x 75 | (29.5, 38) | content (59, 82.45), scale 1.8988 x 1.2707 |
| `button-up.svg` | shape 10 | 36.85 x 37.2 | (18.4, 18.6) | sprite-19 (18.4,18.6), scale 0.49933 x 0.5 |
| `button-pressed-overlay.svg` | shape 18 | 36.85 x 37.2 | (18.4, 18.6) | same spot, scale 0.49931 x 0.49731, only in `down` |
| `icon-close.svg` / `.png` | shape 12 / bitmap 11 | 9 x 9 | (3.5, 3.5) | × icon |
| `icon-plus.svg` / `.png` | shape 14 / bitmap 13 | 9 x 9 | (3.5, 3.5) | + icon |
| `icon-min.svg` / `.png` | shape 16 / bitmap 15 | 9 x 9 | (3.5, 3.5) | − icon |
| `letter-A.svg` | sprite 23 frame 1 | 93.5 x 59.1 | (−17.5, −20.15) | content (22, 27.75), alpha 0.301 |
| `letter-B.svg` | sprite 23 frame 2 | 93.5 x 59.1 | (−17.5, −20.15) | same |

Bitmaps should render pixelated (`image-rendering: pixelated`), as the JPEXS SVGs specify.

## Unusual / notes

- Both windows are the **same symbol**. The only differences are the instance name `A` (which picks the letter) and the Dimmer laid over B. The examplelist's "regular" buttons are produced by the Dimmer, not by omitting Targets.
- Masked-out content still hit-tests. In the `cross` state, the button centres sit at stage y ≈ 184, below the windows: window A's at x ≈ −19, 1.7, 21.7 and window B's at x ≈ 135, 155.7, 175.7. They are invisible but their Targets are live. B's are outside the Dimmer then, so they pull too. This is an edge case of the original and probably not worth reproducing. Flagging it so a port that culls hidden objects isn't considered "wrong".
- No demo sounds (`sounds/-1.wav` is an empty header). No toolkit rollover sounds are configured.
- `trace("hhm")` is debug output only.
- Exported `bol (MC)` is a template leftover and unused.
- The JPEXS frame renders show all three icons as × and both letters as "A", because scripts don't run there. The runtime shows −, +, × and "A"/"B".

## Verification

1. A 400x200 `#333` stage with two 122.5 px window crops at x 62.5 and 216.5 (y 46–168.5). Each has a title bar with − + × buttons at y ≈ 60 and a light-grey "A" (left) / "B" (right).
2. Approaching any button in window A, the cursor is drawn to its centre (small, U-shaped, strength 4). In window B nothing pulls.
3. Pressing a button darkens it and nudges its icon 1 px down-right. Releasing triggers the action.
4. − shifts window content by (−31, +48) with black behind. + restores it. × blacks the window for ~0.9 s, then the content slides in diagonally from the lower-left while fading in (~0.7 s).
5. The real OS cursor is hidden.
