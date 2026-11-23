# delete_button — "Confirm Button"

Source: `delete_button.swf` (SWF v8, AS2, 9863 bytes; identical to the copy inside `dl/ex/delete_button.zip`). Decompiled from `$SCRATCH/out/delete_button`.

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 400 | 400 | `#333333` | 25 |

Standalone: `Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

examplelist description: *"After clicking the Delete button – which initiates an unrecommended action – the system asks for a confirmation, whereby the cursor is pushed towards the 'no' button which cancels the action. An example of mixed initiative."*

**What you experience:**
1. A big glossy **red** disc (226 px) in a grey bezel, labelled **DELETE / HARDISK** (sic), with "Click button to delete your harddisk." underneath. An invisible Target gently draws the cursor to the disc centre.
2. Pressing the disc makes its gloss highlight swell.
3. Releasing it:
   - The disc turns **green** and becomes a confirmation dialog: a green **YES** button (left), a red **NO** button (right), "SURE?" and a two-line warning.
   - For about 1 s a strong Target pushes the cursor onto **NO**, while mouse motion is halved.
   - A soft white halo fades in around the disc. It is a **wall ring**: the cursor can no longer leave the disc.
   - After ~1 s the push stops, and YES and NO each get only a mild, equal pull.
4. **NO** returns immediately to the start.
5. **YES** shows "OK / YOUR HARDDISK / HAS BEEN / DELETED" plus "NOT REALLY: this is just a demo…". The halo fades out and the wall disappears. Clicking the green OK disc returns to the start.

## Imports (toolkit classes)

| char id | class |
|---|---|
| 3 | `PC_Objects.PC_Target` |
| 6 | `PC_Behaviours.PC_ButtonMaker` |
| 12 | `PC_Objects.PC_Dimmer` |
| 20 | `PC_Behaviours.PC_WallMaker` |
| 28 | `PC_System.PC_Engine` |
| 29 | `PC_Cursors.PC_ArrowCursor` |

## Demo-local symbols

| id | what |
|---|---|
| shape 4 / sprite 5 | solid red `#ff0000` disc, 226 px diameter, top-left registration (centre 113,113). Base art for every disc, recoloured by filters |
| sprite 7 | **DELETE button** (31 frames): disc (d1) + gloss highlight (d3, disc ×0.619 with knockout bevel) + ButtonMaker `button1` |
| sprite 18 | **green dialog disc** (14 frames): disc (d1, hue-shifted green) + ButtonMaker |
| sprite 23 | **OK / replay button** (23 frames): green disc + green gloss (alpha 0.5 → 1 on hover) + ButtonMaker `button1` |
| sprite 13 | **small YES/NO button** (10 frames): disc ×0.38052 (86 px), tinted, + ButtonMaker |
| shape 19 / sprite 22 | **wall ring** (annulus with radial gradient) + WallMaker. Frame 2 (grey ring, shape 21, no wall) is never shown |
| sprite 27 | **the whole demo** (64 frames, the state machine) |
| sprite 2 `bol (MC)` | exported gradient ball, unused leftover |

## Display list (stage space, px)

Main timeline: frame 1 places sprite 27. Frame 2 places Engine and Cursor and runs `stop()`. Frame 3 (unreached) moves the Engine.

| depth | node | x | y | scale | notes |
|---|---|---|---|---|---|
| 1 (f2) | **PC_Engine** | 529 | 434 | 1 x 1.0008 | offstage |
| 6 (f1) | **demo** (sprite 27) | **91.05** | **65.3** | 1 | all coordinates below: stage = local + (91.05, 65.3) |
| 48 (f2) | **PC_ArrowCursor** `PC_Cursor` | 370.5 | 59 | 1 | |

### Sprite 27: every node, with the frames it exists in

| depth | node | frames | local x,y | scale | stage rect / centre | alpha | asset | notes |
|---|---|---|---|---|---|---|---|---|
| 1 | **PC_Target A** ("lure") | 1–10 | −9, −8 | 2.4203 → 242.03 | (82.05, 57.3), centre **(203.07, 178.32)** | 1 | toolkit, invisible | params A |
| 1 | **wall ring** (sprite 22) | 28–56 | −118, −107 | 1 | sprite origin (−26.95, −41.7) | tween (below) | `wall-ring.svg` | **BlurFilter** (quality 3) tween. Child **WallMaker** at sprite-22 local (385, 138) |
| 4 | **PC_Target B** ("push to NO") | 14–43 | 2.05, −53.95 | 3.1689 → 316.89 | (93.1, 11.35), centre **(251.54, 169.79)** | 1 | invisible | params B |
| 4 | **PC_Target C** (on NO) | 44–46 | 117.05, 58.05 | 0.82941 → 82.94 | (208.1, 123.35), centre (249.57, 164.82) | 1 | toolkit: red shaded disc + bullseye (mostly hidden under NO) | params C |
| 4 | **PC_Target A'** (on OK disc) | 47–64 | −9, −8 | 2.4203 | same as Target A | 1 | invisible | params A |
| 12 | **PC_Dimmer** | 14–43 | −47.9, −60.9 | 3.5984 → 359.84 | (43.15, 4.4)–(402.99, 364.24) | **0** (alphaMult 0) | invisible | params D |
| 12 | **PC_Target C'** (on YES) | 44–46 | 21.55, 60.55 | 0.82941 | (112.6, 125.85), centre (154.07, 167.32) | 1 | toolkit, mostly hidden under YES | params C |
| 20 | bezel outer (sprite 5) | 1–64 | −9.95, −9.95 | 1.0792 → 243.9 | (81.1, 55.35) | 1 | `bezel.svg` | filters: ColorMatrix greyscale (0.3086, 0.6094, 0.082) +52 on RGB (red → `#838383`), then inner Bevel blur 5, dist 6, 45°, strength 0.406, highlight white / shadow black |
| 22 | bezel inner (sprite 5) | 1–64 | −4.05, −4.05 | 1.027 → 232.1 | (87.0, 61.25) | 1 | `bezel.svg` | same greyscale CM, then inner Bevel blur 2, dist 2, **225°**, strength 2.09 |
| 24 | **DELETE button** (sprite 7) | 1–26 | 0, 0 | 1 → 226 | (91.05, 65.3)–(317.05, 291.3), centre (204.05, 178.3) | 1 | `big-button/frame-NN.svg` | |
| 24 | **green dialog disc** (sprite 18) | 27–46 | 0, 0 | 1 | same | 1 | `dialog-disc-green.svg` | |
| 24 | **OK button** (sprite 23) | 47–64 | 0, 0 | 1 | same | 1 | `ok-button/frame-NN.svg` | |
| 30 | text 9 "DELETE / HARDISK" | 1–16 | 37, 77.5 | 1 | | 1 | `text-start.svg` | |
| 31 | text 11 "Click button to delete your harddisk." | 1–16 | 38, 248.55 | 1 | | 1 | `text-start.svg` | |
| 30 | **NO button** `OVER` (sprite 13) | 17–46 | 119.5, 60 | 0.94186 → 80.95 | (210.55, 125.3), centre **(251.03, 165.78)** | 1 | `btn-no.svg` / `btn-no-down.svg` | filters: inner Bevel blur 3, dist 3, 225°, strength 1; then **ColorMatrix** that maps its green `#00cc00` to ≈ `#ff0e00` (red). Matrix rows: R [−0.5196, 4.7819, −3.2624, 0, 0], G [−0.2674, 0.0709, 1.1965, 0, 0], B [3.1569, −0.4834, −1.6735, 0, 0] |
| 34 | text 14 "NO" | 17–46 | 87.5, 91.1 | 1 | | 1 | `text-sure.svg` | |
| 35 | **YES button** `YES` (sprite 13) | 17–46 | 23, 62 | 0.94186 | (114.05, 127.3), centre **(154.53, 167.78)** | 1 | `btn-yes.svg` / `btn-yes-down.svg` | inner Bevel blur 3, dist 3, 225°, strength 1. Colour `#00cc00` |
| 39 | text 15 "YES" | 17–46 | −9.5, 93.1 | 1 | | 1 | `text-sure.svg` | |
| 40 | text 16 "SURE?" | 17–46 | 39.5, 158.6 | 1 | | 1 | `text-sure.svg` | |
| 41 | text 17 warning (2 lines) | 17–46 | 38, 250.55 | 1 | | 1 | `text-sure.svg` | |
| 30 | text 24 "OK" | 47–64 | 37, 57.5 | 1 | | 1 | `text-ok.svg` | |
| 31 | text 25 "YOUR HARDDISK / HAS BEEN / DELETED" | 47–64 | 37, 107.15 | 1 | | 1 | `text-ok.svg` | |
| 32 | text 26 "NOT REALLY…" (3 lines) | 47–64 | 37.55, 248.55 | 1 | | 1 | `text-ok.svg` | |

Draw order is by depth, so text sits above the buttons/discs.

The wall-ring tween (depth 1). Alpha = alphaMult/256; blur is the same for X and Y:

| frame | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42–46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alphaMult | 0 | 5 | 10 | 15 | 21 | 26 | 31 | 36 | 41 | 46 | 51 | 57 | 62 | 67 | 72 | 49 | 44 | 38 | 33 | 27 | 22 | 16 | 11 | 5 | 0 |
| blur | 55 | 53.93 | 52.86 | 51.79 | 50.71 | 49.64 | 48.57 | 47.5 | 46.43 | 45.36 | 44.29 | 43.21 | 42.14 | 41.07 | 40 | 55 | 55 | 55 | 55 | 55 | 55 | 55 | 55 | 55 | 55 |

Frames 28–42 interpolate linearly: blur = 55 − (f−28)·15/14.

### Wall geometry (exact; this is the hit shape)

Shape 19 is a single even-odd path in sprite-22 local coords:
- Outer circle ≈ centre (232.95, 226), r ≈ 222.97.
- Inner hole ≈ centre (230.55, 218.7), r ≈ 110.27.

In stage coords:
- Hole centre **(203.6, 177.0)**, r **110.27**.
- Outer ring centre (206.0, 184.3), r 222.97.

The hole sits fully inside the 113 px-radius disc centred (204.05, 178.3), so the cursor is trapped inside the disc. YES and NO are both inside the hole.

Fill: radial gradient centred (233, 226), radius 224.9, stops 0.478 `#ffffff`, 0.580 `#ebebeb`, 1.0 `#333333`. Blurred heavily and at most 28% alpha, it reads as a soft white halo just outside the disc rim.

### Toolkit parameters (`on(construct)`)

**PC_Engine:** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=false, hideAllObjects=false`

**PC_ArrowCursor `PC_Cursor`:** `cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true, minHeight=0, minWidth=0`

**Params A** (Target A, frames 1–10, and A', frames 47+): `strength=10, plateauDiameter=20, shape="Sine-shaped", style="None", showBullseye=false, tint=14492708 (#DD2424), rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`. Plateau ≈ 48.4 px on stage.

**Params B** (push to NO, frames 14–43): `strength=30, plateauDiameter=10, shape="Sine-shaped", style="None", showBullseye=false, tint=10066329 (#999999), rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`.
- Footprint 316.9 px, so it covers the whole disc. Plateau ≈ 31.7 px.
- Centre (251.54, 169.79) is ~4 px below the NO button centre (251.03, 165.78).

**Params C** (YES and NO, frames 44–46): `strength=6, plateauDiameter=2, shape="Sine-shaped", style="Disc with shading", showBullseye=true, tint=14492708 (#DD2424), rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`.
- Footprint 82.94 px vs. 80.95 px buttons. Their red shaded discs are drawn **under** the buttons (depth 4/12 < 30/35). At most a ~1–2.5 px red rim can peek out, mostly on the left/top.

**Params D** (Dimmer, frames 14–43): `scope="Mouse", dimmingFactor=50, directionDependency="None", dirDepAngle=0, tint=16777215 (#FFFFFF), rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`. Mouse movement is halved anywhere over the 360 px square. Invisible (instance alpha 0).

**PC_WallMaker** (sprite 22): `rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`. The wall shape is the ring above.

**PC_ButtonMaker** instances (all `rolloverCursorSound=""`, `rolloverCursorStyle="Finger"`, `visible=true, minHeight=0, minWidth=0`):

| in | outframe | overframe | downframe | upframe | local pos (irrelevant) |
|---|---|---|---|---|---|
| sprite 7 (DELETE), `button1` | "out" | "over" | "down" | "up" | 157, −6 |
| sprite 18 (green disc) | "out" | "over" | **"over"** | **"over"** | 125, 10 |
| sprite 23 (OK), `button1` | "out" | "over" | "down" | "up" | 157, −6 |
| sprite 13 (YES/NO) | **1** | **1** | **3** | "up" | 78, 17 |

Each hit area = the parent's disc.

## Timelines / state

### Sprite 27 (state machine). Labels:

| frame | labels | script |
|---|---|---|
| 1 | `Nuke 'em`, `NO` | `stop()` |
| 6 | `OVER` | `stop()` |
| 13 | `down` | `stop()` |
| 17 | `Sure?` | — |
| 20 | `up` | — |
| 44 | — | `stop()` |
| 47 | `Yes!`, `YES` | — |
| 57 | `OK` | `stop()` |
| 61 | `replay` | `gotoAndStop("over");` (lower-case; matches `OVER` case-insensitively → frame 6) |

Frames 1 and 6 look identical (the start screen). Display changes per frame are in the table above. Also:
- Frame 11 removes Target A.
- Frame 14 adds Target B and the Dimmer.
- Frame 17 swaps the start texts for the YES/NO dialog.
- Frame 27 swaps the DELETE button for the green disc.
- Frame 28 adds the wall ring.
- Frame 44 replaces Target B and the Dimmer with Targets C/C'.
- Frame 47 removes the dialog and shows the OK screen + Target A'.
- Frame 57 removes the wall ring.

### Sprite 7 (DELETE button). ButtonMaker calls `gotoAndStop(label)`.

| frame | label | visual | script |
|---|---|---|---|
| 1 | `out` | red disc, gloss d3 at (42,46) ×0.61948, bevel strength 0.898 | `_parent.gotoAndPlay("out"); stop();` (sprite 27 has no `out` label: no-op) |
| 8 | `over` | gloss bevel strength 0.977 (barely different) | — |
| 14, 19 | — | unreachable (only via play) | 19: `_parent.gotoAndPlay("over"); stop();` |
| 20 | `down` | gloss starts to grow | `_parent.gotoAndPlay("down"); play();` → sprite 27 to frame 13 |
| 21–24 | — | gloss grows to (37,41) ×0.66379, bevel strength up to 1.457 | 24: `stop()` |
| 25 | `up` | **disc hue-shifted to green** (ColorMatrix on d1); gloss shrinks back and fades (alpha 241→154 /256 over 25–31) | `_parent.gotoAndPlay("up"); play();` → sprite 27 plays from frame 20 |
| 31 | — | | `stop()` |

`big-button/frame-NN.svg` are JPEXS exports of each of the 31 frames, filters included: frame 1 = out, 8 = over, 20–24 = press, 25–31 = release (green).

### Sprite 18 (green dialog disc)

```
frame 1:            init = false;
frame 5  "over":    init = true; trace("initiated"); stop();
frame 9  "out":     trace("initi:" + init);
                    if (init) _parent.gotoAndPlay(1);          // reset whole demo to start
                    else { gotoAndStop("over"); play(); }      // → frame 5: init = true; stop
frame 12:           stop();
```

Intent: once armed, rolling the cursor **out** of the green disc cancels back to the start. In practice the wall ring (from frame 28, one frame later) keeps the cursor inside the disc, so this rarely fires. The exact `init` value right after placement depends on AVM1 action ordering (ButtonMaker's constructor calls `gotoAndStop("out")` during placement), so it is uncertain. Recommended port: "cursor leaves disc → reset" only matters if the wall is breached, so it may be omitted.

### Sprite 13 (YES / NO)

| frame | label | visual | script |
|---|---|---|---|
| 1 | — | disc colour `mult 0` + green `add 204` → `#00cc00` (NO then turned red by its instance filter) | `stop()` |
| 3 | — | colour `mult 0`, no add → **black** (pressed) | — |
| 8 | `up` | (still black) | `_parent.gotoAndPlay(this._name);` → `"YES"` → frame 47, `"OVER"` → frame 6 (start) |

There is no hover visual (overframe = outframe = 1). The NO instance also has `onClipEvent(load)` adding a `pc_mousedown` listener that toggles a `playing` variable. It is a no-op.

### Sprite 23 (OK / replay)

| frame | label | visual | script |
|---|---|---|---|
| 1 | `out` | green disc (hue CM), green gloss (CM) at alpha 128/256, bevel 0.957 | `stop()` |
| 5 | `over` | — | |
| 6–11 | — | gloss alpha 149, 171, 192, 213, 235, 256. Bevel strength 1.008 → 1.277 | 11: `stop()` |
| 15 | `down` | as frame 11 | `stop()` |
| 20 | `up` | | `_parent.gotoAndPlay("replay");` → sprite 27 frame 61 → `gotoAndStop("over")` → start screen |

### Flow summary (times at 25 fps)

1. **Start** (frame 1/6): red DELETE disc. Target A (strength 10) gently centres the cursor on the disc.
2. **Press** on the disc: sprite 27 frame 13. Target A is gone and the gloss swells.
3. **Release** over the disc: sprite 27 plays 20 → 44 (24 frames = 0.96 s).
   - The dialog appears instantly: green YES, red NO, "SURE?", warning.
   - The disc turns green.
   - Target B (strength 30) pulls to NO, and the Dimmer halves mouse motion.
   - At +0.32 s (frame 28) the wall ring is active and its halo fades in over 0.56 s.
4. **+0.96 s** (frame 44, stop): Target B and the Dimmer are removed. YES and NO each have a strength-6 Target. The wall stays.
5. **NO** clicked (mouse up on it): back to the start (frame 6). The wall and every dialog element go away immediately.
6. **YES** clicked: the OK screen. Target A' centres on the disc, and the halo fades out over 10 frames. The wall is removed at frame 57 (+0.4 s).
7. **OK disc** clicked: back to the start.

## Text

All of it is **static DefineText with embedded glyphs**, white `#ffffff`, and rendered in the SVG assets. Baseline-left positions are in stage px.

| text | line(s) | font | size | baseline-left (stage) |
|---|---|---|---|---|
| 9 | "DELETE" / "HARDISK" (**sic**: the SWF really says HARDISK; the 2008 thumbnail `delete_button.jpg` says HARDDISK) | Helvetica 95 Black | 40 | (116.4, 171.8) / (104.4, 211.8) |
| 11 | "Click button to delete your harddisk." | Helvetica 75 Bold (Neue Helvetica Bold) | 14 | (79.45, 323.85) |
| 15 | "YES" | Helvetica 75 Bold | 31 | (123.0, 180.4) |
| 14 | "NO" | Helvetica 75 Bold | 31 | (226.95, 178.4) |
| 16 | "SURE?" | Helvetica 75 Bold | 31 | (151.05, 245.9) |
| 17 | "WARNING: All files on the harddrive will be lost" / "(NO is advised by the system)." | Helvetica 75 Bold | 14 | (44.7, 325.85) / (100.7, 341.85) |
| 24 | "OK" | Helvetica 95 Black | 45 | (164.55, 154.8) |
| 25 | "YOUR HARDDISK" / "HAS BEEN" / "DELETED" | Helvetica 75 Bold | 22 | (106.65, 188.45) / (143.65, 212.45) / (148.65, 236.45) |
| 26 | "NOT REALLY: this is just a demo" / " of a button that lets you comfirm" (**sic**, leading space) / "before you do something stupid." | Helvetica 75 Bold | 14 | (91.35, 323.85) / (89.35, 339.85) / (92.35, 355.85) |

All lines are visually centred on x ≈ 200 (the disc centre is 204). The bottom texts extend below the disc (y 314–360).

## Assets — `/public/demos/delete_button/`

**Stage-aligned layers** are 400 x 400 SVGs with registration offset **(91.05, 65.3)**, i.e. sprite 27's origin. Draw them at stage (0,0). They were cut from JPEXS sprite-27 frame exports by keeping only the listed objects, and include the original filters.

| file | content | frames shown |
|---|---|---|
| `bezel.svg` | grey bezel rings (depths 20+22) | always |
| `text-start.svg` | texts 9 + 11 | 1–16 |
| `text-sure.svg` | texts 14, 15, 16, 17 (YES, NO, SURE?, warning) | 17–46 |
| `btn-yes.svg` / `btn-yes-down.svg` | YES button rest (green) / pressed (black) | 17–46 |
| `btn-no.svg` / `btn-no-down.svg` | NO button rest (red) / pressed (black) | 17–46 |
| `text-ok.svg` | texts 24, 25, 26 | 47–64 |

**Symbol-registered assets**:

| file | source | size | registration offset (tx,ty) | draw at stage |
|---|---|---|---|---|
| `big-button/frame-01.svg` … `frame-31.svg` | sprite 7, each frame | 226 x 226 | (0, 0) | (91.05, 65.3) |
| `dialog-disc-green.svg` | sprite 18 frame 1 | 226 x 226 | (0, 0) | (91.05, 65.3) |
| `ok-button/frame-01.svg` … `frame-23.svg` | sprite 23, each frame | 226 x 226 | (0, 0) | (91.05, 65.3) |
| `wall-ring.svg` | shape 19 (raw, no blur) | 445.95 x 445.95 | (−10, −3) | sprite-22 origin (−26.95, −41.7), so the SVG's top-left is at (−16.95, −38.7). Apply the blur/alpha tween yourself |

Caveat: the 226 px disc SVGs clip filter output at the canvas edge. The outer blur 5 on the disc loses a few px of soft edge. This is acceptable, or pad the viewBox.

## Unusual / notes

- **Colours are made by filters.** The single red disc becomes:
  - grey via a greyscale ColorMatrix (bezel);
  - green via hue-rotation ColorMatrices (sprite 7 `up`, sprite 18, sprite 23);
  - green via colour transform (YES);
  - red via colour transform then a ColorMatrix (NO);
  - black via colour transform (pressed YES/NO).

  The SVG assets already bake all of this in.
- Label lookups rely on **case-insensitive frame labels** (`"over"` → `OVER`). The NO button's instance name is literally `OVER`, so clicking NO does `gotoAndPlay("OVER")`, which is the start screen.
- `trace("initiated")`, `trace("initi:"+init)` are debug output only.
- No demo sounds (`sounds/-1.wav` is an empty header). No toolkit sounds configured. No video, no links.
- Exported `bol (MC)` is a template leftover and unused.
- The JPEXS sprite-27 frame renders show YES/NO black on frames 20+. That is a static-render artefact (nested sprite shown at frame 4). At runtime they rest on frame 1 (green / red).

## Verification

1. A 400x400 `#333` stage with a 226 px glossy red disc centred at (204, 178) in a grey bezel, reading DELETE / HARDISK, and a small white caption below.
2. Near the disc the cursor drifts toward its centre.
3. Pressing swells the gloss. Releasing turns everything green and shows YES (green, left) and NO (red, right).
4. During the next second the cursor is dragged firmly onto NO while your hand motion feels heavy (halved). Afterwards both buttons pull only slightly.
5. A faint white halo surrounds the disc, and the cursor cannot leave the disc.
6. Releasing on NO returns to the red start screen instantly. Releasing on YES shows the OK / YOUR HARDDISK HAS BEEN DELETED screen, the halo fades, and the cursor is free again. Clicking the green disc returns to the start.
