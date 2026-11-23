# headerbar — site navigation strip

Source: `headerbar.swf` (SWF v8, AS2, 3 frames). Decompiled from `$SCRATCH/out/headerbar`.

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 750 | 120 | `#333333` | 30 |

Standalone (when `this == _root`): `Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

**What it is:** the powercursor.com menu bar. A dark rounded bar (740x35) with a drop shadow, menu words ABOUT / DOWNLOAD / EXAMPLES / DOCUMENTATION / FORUM / FAQ on the left, the red "PowerCursor" logo bitmap on the right, and small grey "home | colofon" links above the right end. Every word is a PowerCursor button (PC_ButtonMaker). When the cursor rolls onto a word, a soft highlight fades in behind it. For about 0.4 s an invisible Hole (strength 6) also pulls the cursor into the word, so you feel it "click into" the button. On mouse-down the button shows a darker pressed image. On mouse-up the browser navigates to the page. The cursor turns into a Finger over a button, and the toolkit "scratch" sound plays.

**Embedding:** `home.swf` and `examplelist.swf` both `loadMovie("headerbar.swf", headerbar_holder)`. When it is loaded like that (`_root != this`), frame 1 calls `stop()`. The headerbar's own Engine and Cursor (frame 2) are then never created, and its buttons register with the **host's** `_root.PC_Engine` and cursor. In `home.swf` the holder sits at stage (26, 208) (see `home.md`). In the port, make the headerbar a component that can run standalone (with its own engine and cursor) or be mounted into a host engine at an offset.

## Imports (toolkit classes)

| char id | class |
|---|---|
| 6 | `PC_Behaviours.PC_ButtonMaker` |
| 7 | `PC_Objects.PC_Hole` |
| 14 | `PC_Logo` (a 195x28 bitmap from the library, used as a bitmap fill) |
| 18 | `PC_System.PC_Engine` |
| 19 | `PC_Cursors.PC_ArrowCursor` |

## Assets (`public/demos/headerbar/`)

Registration offset = position of the symbol's local (0,0) in SVG pixel space (JPEXS root `<g transform>`).

| file | source | size (px) | reg. offset | notes |
|---|---|---|---|---|
| `bar-outer.svg` | shape 1 | 740 x 34.6 | (359.95, 17.3) | red `#ff0000` rounded rect (r≈5.8). Mostly covered by bar-inner. Only a thin red rim shows (bottom/left edge) |
| `bar-inner.svg` | shape 2 | 725.75 x 34 | (362.85, 17.0) | vertical linear gradient `#333333` → `#444444` (81.6 %) → `#404040`, rounded rect |
| `bar-mask.svg` | shape 3 | 725.75 x 34 | (360.6, 16.7) | mask only (fill `#cc33cc` never shows). Clips the 9 button sprites (depths 4–85) |
| `button-highlight.svg` | shape 5 | 76.45 x 34.75 | (38.6, 17.35) | soft light-grey glossy bitmap (bitmap 4). Button "over" art |
| `button-pressed.svg` | shape 9 | 76.2 x 34.75 | (38.5, 17.35) | red gradient under a dark bitmap (bitmap 8). Reads as a dark pressed slab. Button "down" art |
| `menu-text.svg` | static text 12 | 384 x 10 | (0, -2) | "ABOUT      DOWNLOAD      EXAMPLES      DOCUMENTATION      FORUM      FAQ", font `Arial_10pt_st` (bold flag), 10 px, `#cccccc`, as glyph outlines |
| `top-links-text.svg` | static text 13 | 71 x 11 | (0, -2) | "home \| colofon", same font, 10 px, `#999999` |
| `powercursor-logo.png` | library bitmap `PC_Logo` | 195 x 28 | (0, 0) | copied from powercursor.swf's library (`out/pc_examples/images/32_PC_Logo.png`). Red italic "PowerCursor" wordmark on transparent |
| `reference-render.png` | JPEXS frame 2 | 750 x 120 | — | for visual checking. The logo shows as a red placeholder there because imports aren't rendered |

Word x positions inside `menu-text.svg` (text-local, baseline y = 9): ABOUT 0, DOWNLOAD 53, EXAMPLES 130, DOCUMENTATION 204, FORUM 310, FAQ 364. In top-links: "home" 0, "|" 30, "colofon" 36.

## Display list (stage space, standalone)

Main timeline: frame 1 places the bar. Frame 2 adds Engine and Cursor, moves the bar to x=365.15 and calls `stop()`. Frame 3 (Engine nudge) is never reached. Embedded mode stops on frame 1, so the bar is at x=365.0 (0.15 px difference, ignorable).

| depth | node | x | y | scaleX | scaleY | rot | alpha | renders with | notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 (f2) | **PC_Engine** | 649 | 54 | 0.5909 | 0.5 | 0 | 1 | toolkit (icon hidden at runtime) | params below. Standalone only |
| 6 | **headerbar** (sprite 17), instance `headerbar` | 365.15 | 67 | 0.9998 | 1.001 | 0 | 1 | container | filters: DropShadow + Bevel (below) |
| 95 (f2) | **PC_ArrowCursor** | 368.45 | 50 | 1 | 1 | 0 | 1 | toolkit | params below. Standalone only |

Filters on `headerbar` (apply to the whole bar group):
- DropShadow: colour black, strength 0.398, angle 60° (1.0472 rad), distance 3, blurX/Y 3, 1 pass, inner false, knockout false. CSS approx: `drop-shadow(1.5px 2.6px 1.5px rgba(0,0,0,.4))`.
- Bevel: shadow black, highlight white, strength 0.5, angle 45°, distance 1, blur 1, 3 passes, `innerShadow=false onTop=false` (JPEXS flags). It is a 1 px light/dark edge. Optional in the port.

### Children of `headerbar` (sprite 17), composed to stage

Stage = (365.15 + 0.9998·lx, 67 + 1.001·ly). Assets positioned by registration point.

| depth | node | local (x, y) | local scale | stage reg. point | alpha | asset |
|---|---|---|---|---|---|---|
| 1 | outer bar | (0, 0) | 1, 1 | (365.15, 67.0) | 1 | `bar-outer.svg` → covers stage x 5.2–745.1, y 49.7–84.3 |
| 2 | inner bar | (10, 0) | 1.0196, 1.0176 | (375.15, 67.0) | 1 | `bar-inner.svg` |
| 3 | mask (clipDepth 85) | (0, 0) | 1, 1 | (365.15, 67.0) | — | `bar-mask.svg`. Clips depths 4–85 (all 9 buttons) to stage x ≈ 4.6–730.2, y ≈ 50.3–84.3 |
| 4–76 | 9 buttons (sprite 10) | see table below | | | | |
| 86 | menu text | (-348, -7) | 1 | (17.2, 60.0) | 1 | `menu-text.svg` (baseline at stage y ≈ 69) |
| 87 | top links text | (294, -37) | 1 | (659.1, 30.0) | 1 | `top-links-text.svg` (baseline ≈ 39). Not masked |
| 88 | logo (sprite 16 → shape 15 at (-99.5, -11.55)) | (278.5, -0.15) | 1 | top-left (544.1, 55.3) | 1 | `powercursor-logo.png`, 195x28 |

### The 9 buttons (sprite 10 instances)

Button-local art spans x -38.6…37.85, y -17.35…17.4 (both images). Stage bounds below apply the instance scale. "hole" = the over-state Hole (see below), with its stage centre and size. Click URLs are relative to the page (`getURL(url, "_parent")`) and fire on `pc_mouseup`.

| depth | label | URL | stage reg. (x, y) | stage scaleX | stage scaleY | alpha | stage bounds | over-hole centre, size |
|---|---|---|---|---|---|---|---|---|
| 13 | ABOUT | `../about/` | (33.82, 66.50) | 0.7615 | 1.0017 | 1 | x 4.4–62.6, y 49.1–83.9 | (33.2, 67.7) 76.2x66.1 |
| 31 | DOWNLOAD | `../download/` | (100.95, 66.50) | 1.0546 | 1.0017 | 1 | x 60.2–140.9, y 49.1–83.9 | (100.1, 67.7) 105.5x66.1 |
| 22 | EXAMPLES | `../examples/` | (175.29, 66.40) | 0.9592 | 1.0017 | 1 | x 138.3–211.6, y 49.0–83.8 | (174.5, 67.6) 95.9x66.1 |
| 49 | DOCUMENTATION | `../documentation/` | (265.72, 66.25) | 1.3794 | 1.0017 | 1 | x 212.5–317.9, y 48.9–83.7 | (264.5, 67.5) 137.9x66.1 |
| 40 | FORUM | `../forum/` | (345.40, 66.50) | 0.7614 | 1.0017 | 1 | x 316.0–374.2, y 49.1–83.9 | (344.8, 67.7) 76.1x66.1 |
| 76 | FAQ | `../faq/` | (392.14, 66.50) | 0.5542 | 1.0017 | 1 | x 370.8–413.1, y 49.1–83.9 | (391.7, 67.7) 55.4x66.1 |
| 67 | logo area | `../` | (633.80, 67.40) | 2.7549 | 1.0017 | **0** | x 527.5–738.1, y 50.0–84.8 | (631.5, 68.6) 275.5x66.1 |
| 4 | "home" | `../` | (668.79, 39.47) | 0.5854 | 1.0010 | **0** | x 646.2–690.9, y 22.1–56.9 | (668.3, 40.7) 58.5x66.1 |
| 58 | "colofon" | `../colofon/` | (714.43, 39.47) | 0.6386 | 1.0010 | **0** | x 689.8–738.6, y 22.1–56.9 | (713.9, 40.7) 63.9x66.1 |

The three alpha-0 instances are invisible hot zones over the logo and the "home | colofon" words. Their art never shows. The "home"/"colofon" zones also lie mostly outside the mask, but a mask doesn't affect PowerCursor hit tests. **Uncertain:** with `scaleToAlpha=true`, whether their over-hole force is scaled to 0 by the parent's alpha 0. AS2 `_alpha` is per-clip and the Hole's own alpha is 100, so the force probably stays at full strength. Keep it at full strength unless the engine composes alpha.

Hit area of each button = the button sprite's drawn content: the 76x35 image (alpha 0 in the "out" state still counts) plus the Hole's box while it exists.

### Inside each button (sprite 10, 50 frames)

| child | local x, y | scale | asset / class | params |
|---|---|---|---|---|
| d7 highlight | (0, 0) | 1 | `button-highlight.svg` | alpha animated (timeline below) |
| d8 **PC_ButtonMaker** (behaviour, parent = button) | (13.15, -0.45) | 1 | toolkit, no art | `outframe="out", overframe="over", downframe="down", upframe="up", rolloverCursorStyle="Finger", rolloverCursorSound="scratch", visible=true, minHeight=0, minWidth=0` |
| d1 **PC_Hole** (frames 15–26 only) | (-50.85, -31.8) | 1, 0.66 | toolkit, style None (invisible) | `strength=6, shape="Sine-shaped", plateauDiameter=5, style="None", tint=14492708 (#DD2424), rolloverCursorStyle="Null", rolloverCursorSound="", visible=true, minHeight=0, minWidth=0`. Box 100x66 (button-local x -50.85…49.15, y -31.8…34.2), centre (-0.85, 1.2) |
| d2 pressed (frames 36–41) | (0, 0) | 1 | `button-pressed.svg` | |
| d1 highlight copy (frames 42+) | (0, 0) | 1 | `button-highlight.svg` | alpha 0 (invisible) |

## Timelines / state

### Main timeline

| frame | script |
|---|---|
| 1 | `if (this == _root) { Stage.scaleMode="noScale"; Stage.align="TL"; }  if (_root != this) stop();` |
| 2 | places Engine and Cursor. `stop()` |

### Button sprite 10

PC_ButtonMaker behaviour (from `PC_ButtonMaker.as`):
- constructor: `_parent.gotoAndStop("out")`
- `pc_rollin` → engine cursor style "Finger", `gotoAndStop("over")`
- `pc_rollover` (each frame while on) → cursor style "Finger"
- `pc_rollout` → cursor style "Default", `gotoAndStop("out")`
- `pc_mousedown` → `gotoAndStop("down")`
- `pc_mouseup` → `gotoAndStop("up")`
- plus each instance's own `pc_mouseup` listener → `getURL(url, "_parent")`

Frame scripts that call `play()` override the `gotoAndStop`, because AS2 runs the target frame's actions after the goto. So the effective sequences are:

| label (frame) | what happens | duration @30 fps |
|---|---|---|
| `over(still2)` (1) | highlight alpha 1. `play()`. Only seen for 1 frame at construction | — |
| `out` (2→5) | highlight alpha 0.199 (f2), 0.133 (f3), 0.066 (f4), 0 (f5), then `stop()` at 5. No hole | 3 frames |
| (6–14) | unused (f10 has `stop()`) | |
| `over` (15→27) | f15 `play()`, Hole d1 placed, highlight alpha 0 → 0.332 (f16) → 0.668 (f17) → 1.0 at f18 (`over(still)`). Hole **removed at f27** and `stop()`. Highlight stays 1 | Hole lives 12 frames ≈ 0.4 s |
| `down` (36) | highlight removed, pressed image placed. `stop()` | |
| `up` (42→48) | pressed removed, highlight copy at alpha 0. `play()`, `stop()` at 48. Nothing visible. Navigation fires on the same mouse-up | |

Rolling out mid-"over" jumps back to frame 2. That removes the Hole immediately and snaps the highlight alpha to 0.199, then it fades to 0.

### Engine / Cursor parameters (standalone only)

**PC_Engine (d1):** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Topmost", speedLimit="high speed", scaleToAlpha=true, hideAllObjects=false`

**PC_ArrowCursor (d95):** `cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true, minHeight=0, minWidth=0`. Start position (368.45, 50).

## Unusual

- No sounds or video in the SWF. "scratch" is a toolkit library sound.
- Links are relative (`../about/` etc.) with target `_parent`, because the page lived in an iframe/subfolder. In the port, map them to whatever the new site uses, or make them inert.
- The mask (depth 3, clipDepth 85) is the rounded bar shape. It clips the button highlights/pressed images to the bar.
- Bitmap 4 (highlight) is a JPEG with alpha. JPEXS embedded it as PNG in `button-highlight.svg`.

## Verification

- Standalone at 750x120 on `#333333`: the bar spans x≈5–745, y≈50–84, with a soft shadow below-right and a hairline red rim at the bottom. The menu words sit at baseline y≈69, starting x≈17. The logo is right-aligned at x 544–739. "home | colofon" is above at y≈30–41, x 659–730.
- Move onto EXAMPLES: within 0.1 s a light panel fades in behind the word (x 138–212). The cursor becomes a Finger, "scratch" plays, and for ~0.4 s the cursor is drawn toward (174.5, 67.6), then released. Staying on keeps the highlight. Moving off fades it out over 3 frames.
- Press: the panel turns dark (pressed). Release: the panel disappears and the browser goes to `../examples/`.
- Hovering the logo, "home" or "colofon" gives the same pull and Finger cursor, but no visible highlight.
