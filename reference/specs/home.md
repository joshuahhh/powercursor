# home — powercursor.com homepage playground

Source: `home.swf` (SWF v8, AS2, 42 frames, title "powercursor_home"). Decompiled from `$SCRATCH/out/home`. Embedded full-width in an iframe on the site's home page.

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 800 | 700 | `#3c3c3c` (60,60,60) | 30 |

`Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

**What you experience:** a brief "LOADING" label, then the page fades in from plain brushed metal (~0.3 s). A soft radial spotlight glow fades in over everything except the menu bar. The menu bar (`headerbar.swf`, see `headerbar.md`) is loaded into the middle of the page at y≈258–292. Below it is a three-line intro text. Scattered around are touchable toys, all driven by one PowerCursor engine and one mock arrow cursor (the real cursor is hidden):

1. **Two big "BUMP / less accessible area" discs** (top-right and bottom-left) with a red dashed circle. The cursor slides off them. Click one and it morphs (10 frames) into a **"HOLE / easily accessible area"** that sucks the cursor in. Click again to morph back.
2. **Eight small hole/bump dimples** (5 top-left, 3 on the maze). They start as holes. Reach the very centre of one and it pops into a bump, throwing you out. Once you leave, it sinks back into a hole.
3. **A spinning red desk fan** (top-left). Its head flings the cursor away in a spiral (Twister). Click it to stop or start it.
4. **A red pin** sitting in a dimple (top-left): a tiny 7.5 px wall.
5. **A tunnel** (bottom, centre-left). Approach from above or below and it is a bump you ride over. Enter at either end and the cursor goes *under* the tunnel's top (drawn over the cursor) and is guided along a groove.
6. **A pocket** (bottom centre) holding an animated **bunny** you can drag. From the side the pocket is a bump. Enter the opening and the cursor drops *inside*: walls keep you in, and the pocket's front is drawn over the cursor.
7. **A light switch** labelled "off"/"on" (bottom). Hovering gently pulls you onto the knob. Click (or after a while just push up/down past the knob) and the switch *carries* your cursor to the other position. The mouse is disabled during the throw and the knob light turns red (on) or grey (off).
8. **A circuit/maze** (right): a line network with arrows. Inside it, push-gutters carry the cursor along the lines in the arrow direction. Small holes at the junctions stop you so you can pick a branch.
9. Off-stage (x≈857): the Engine and a **PC_Watcher** debug panel. Both sit outside the 800 px stage, so they're invisible to users.

There is **no sound or video** in the SWF itself. All sounds are toolkit rollover sounds named in parameters ("scrape", "scratch", "frantic", "pop", "tickle").

## Imports (toolkit classes)

| char id | class | | char id | class |
|---|---|---|---|---|
| 1 | `PC_Twister_Quart` (art for the local twister anim copies, ignore) | | 98 | `PC_Objects.PC_Gutter` |
| 52 | `PC_System.PC_Engine` | | 107 | `PC_Objects.PC_Pushgutter` |
| 53 | `PC_Debug.PC_Watcher` | | 109 | `PC_Behaviours.PC_WallMaker` |
| 65 | `PC_Objects.PC_Hill` | | 111 | `PC_Objects.PC_Dimmer` |
| 66 | `PC_Objects.PC_Hole` | | 149 | `PC_Behaviours.PC_DraggerMaker` |
| 78 | `PC_Behaviours.PC_EventDispatcher` | | 158 | `PC_Objects.PC_Wall` |
| 79 | `PC_Objects.PC_Twister` | | 159 | `PC_Objects.PC_Slope` (**not in the AS2 reference source**. Params `angle, strength, graphicsStyle` match `PC_Ramp`, so treat it as PC_Ramp) |
| | | | 162 | `PC_Cursors.PC_ArrowCursor` |

home.swf also *exports* local copies of toolkit art: `PC_Twister_AniVortexR/L`, `PC_Twister_VortexL`, `PC_Gutter_AniArrows`, `PC_Circle`. It also exports mx `Label`/`UIObject` component classes, which are unused leftovers. Ignore them all. Note: `PC_Disc`, `PC_Square` and `PC_Round_Light/Shade` are **not** exported locally (see "Toolkit visuals" below).

## Engine-wide parameters

**PC_Engine (main d3, at (857.3, 500), off-stage):** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=true, hideAllObjects=false`

`scaleToAlpha=true` matters here. Bump↔hole morphs work by **cross-fading the alpha of a Hill and a Hole that sit on top of each other**. The force of each object must scale with its alpha (alpha 0 = no force).

**PC_ArrowCursor `cursor` (main d491, start (636.3, 219.5)):** `grip=50, inertia=10, graphicStyle="Arrow", __mouseasforce=false, visible=true, minHeight=0, minWidth=0`. Scripts also call `_root.cursor.gotoAndStop(x)` to change its art directly. The ArrowCursor symbol's frames are `Arrow`(1), `MacArrow`(2), `Finger`(3), `Ball`(4), `Hand`(5), `GrabHand`(6). AS2 label lookup is case-insensitive, so `"finger"` → Finger, `"ball"` → Ball, `"arrow"` or `1` → Arrow.

**PC_Watcher (main d8, at (857.3, 357.8), off-stage):** `averaging=7, target=1, updateTime=1`. Debug panel outside the visible stage. It can be omitted (or shown behind a debug flag).

## Assets (`public/demos/home/`)

Placement rule: an SVG's top-left goes at `stageRegPoint − offset` (offset = JPEXS root `<g>` translate = where local (0,0) sits in the SVG).

| file | source | size | reg. offset | used by |
|---|---|---|---|---|
| `background.jpg` | bitmap 50 (fill of shape 51) | 800x600 | (0, 0) | brushed-metal background, intro cover |
| `glow-overlay.svg` | sprite 166 (bitmap 164 radial glow, clipped by mask shape 163) | 960x854.9 | (-160, -20.05) | spotlight overlay. The mask has a horizontal slit at the menu bar, so the glow skips the bar |
| `bump-shading.svg` | shape 56 (bitmap 55) | 181x181 | (90.35, 90.35) | big BUMP shading |
| `hole-shading.svg` | shape 67 (same bitmap rotated 180°) | 181x181 | (91.15, 90.15) | big HOLE shading |
| `area-circle-dashed.svg` | shape 64 | 121.95x122 | (0.5, 0.5) | red dashed circle (2 px, `#ff0000`-ish) |
| `label-bump.svg` | static text 61 | 89x74.5 | (-1.2, -4.7) | "BUMP" (Arial Black bold 15 px, `#ff0000`) / "less" / "accessible" / "area" (Arial Black 14 px, `#cccccc`) |
| `label-hole.svg` | static text 62 | 89x74.7 | (-1.2, -4.5) | "HOLE" / "easily" / "accessible" / "area", same styling |
| `dimple-a.svg` | shape 73 (bitmap 72 rotated 180°) | 85x85 | (0, 0) | small unit base (lit like a bump) |
| `dimple-b.svg` | shape 75 (bitmap 72) | 85x85 | (0, 0) | small unit "hole" overlay, and the red pin's dimple |
| `fan-1.svg` … `fan-4.svg` | shapes 81/83/85/87 | 67x90 | (0, 0) | fan blade frames (4 = stopped) |
| `tunnel-body.svg` | shape 90 | 133x59 | (0, 0) | tunnel, drawn under the cursor |
| `tunnel-top.svg` | shape 92 | 133x59 | (0, 0) | tunnel top, drawn over or under the cursor |
| `tunnel-zone-ends.svg` | shape 94 (black blobs) | 123.85x29.4 | (-12, -0.25) | invisible hit zone (alpha 0) |
| `tunnel-zone-sides.svg` | shape 96 (green bands) | 168.5x93 | (-8.5, -10) | invisible hit zone (alpha 0) |
| `pocket-body.svg` | shape 125 | 97x112 | (0, 0) | pocket (back) |
| `pocket-top.svg` | shape 152 | 97x112 | (0, 0) | pocket front/rim |
| `pocket-zone-opening.svg` | shape 154 | 38x22 | (-37, 4) | invisible hit zone |
| `pocket-zone-sides.svg` | shape 156 (green U) | 132x168 | (23, 22) | invisible hit zone |
| `bunny-01.svg` … `bunny-11.svg` | shapes 127…147 | 32x32 | (0, 0) | bunny animation frames |
| `switch-slot.svg` | shape 103 | 23x29 | (11.5, 14.5) | switch base (centred registration) |
| `switch-knob.svg` | shape 105 | 23x29 | (0, 0) | knob light (green bitmap, recoloured by filter) |
| `switch-wall.svg` | shape 108 | 66.5x78 | (16.85, 18) | WallMaker shape (invisible, alpha 0) |
| `maze.svg` | shape 115 (bitmap 114) | 300x210 | (-35, -30.85) | circuit lines on a bg-coloured rect |
| `maze-arrow.svg` | shape 116 | 5.7x9.95 | (0.6, 0.6) | chevron. At rot 0 it points **left** (−x) |
| `maze-junction-dot.svg` | shape 117 | 8x8 | (-1.75, -1.6) | black junction dot |
| `red-pin.svg` | shape 121 | 7.5x7.5 | (0, 0) | red square, WallMaker'd |
| `reference-render.png` | JPEXS frame 22 | 800x700 | — | visual check only. Toolkit objects, menu bar and glow are not drawn. Intro text renders on 2 lines there, but the real field breaks into 4 (see text) |

Text fields are not exported as art. Render them as HTML (specs below).

## Main timeline

| frame | label | what happens |
|---|---|---|
| 1 | | script: `Stage.scaleMode="noScale"; Stage.align="TL"; loading = "L  O  A  D  I  N  G        ";`. Places the loading text field (d498) |
| 2 | | places bg ×2, Engine, Watcher, `headerbar_holder`, `powercursor_holder` (empty, removed at f5), intro cover d497. Script: `loadMovie("headerbar.swf", _root.headerbar_holder)` |
| 3 | | nudges Engine/Watcher by 0.3 px (irrelevant) |
| 4 | | `percentage = ceil(holder.getBytesTotal() / holder.getBytesLoaded() * 100); loading = "L  O  A  D  I  N  G  " + percentage + " %"; if (percentage < 100) gotoAndPlay(3)`. **Bug:** the ratio is inverted, so it's always ≥100 (or NaN), and it never actually waits. Port: show the loading label ~4 frames, or until the headerbar is ready |
| 5 | | removes loading text and `powercursor_holder`. Places **all content** (table below). The glow overlay goes in at d498, alpha 0. The cover d497 (above everything except the glow) still hides it |
| 6 | `fadein` | glow alpha 32/256 |
| 7–14 | | cover alpha 224,192,160,128,96,64,32,0 /256 (f7…f14). Glow alpha 64,96,128,160,192,224,256 (f7…f13) |
| 17 | | cover d497 removed |
| 22 | | `stop()`. Everything after this is driven by the sub-clips |

So the intro is: f1–f4 loading label (~0.13 s), then ~0.3 s cross-fade (cover out, glow in). Meanwhile the big top-right disc plays its hole→bump morph (below).

## Display list (main timeline, final state, depth order)

Stage px. All sub-clip containers have scale 1 and rotation 0, so child stage coords = parent + local.

| depth | node (sprite id) | instance name | x | y | alpha | renders | notes |
|---|---|---|---|---|---|---|---|
| 1 | background (shape 51) | | -0.15 | -2 | 1 | `background.jpg` | 800x600 |
| 2 | background (shape 51) | | -0.15 | 598 | 1 | `background.jpg` | covers bottom 102 px |
| 3 | PC_Engine | | 857.3 | 500 | 1 | hidden | params above |
| 8 | PC_Watcher | | 857.3 | 357.8 | 1 | off-stage | |
| 27 | big disc (71) | `holebump` | 705.45 | 77.35 | 1 | see §A | starts as hole, morphs to bump |
| 47 | big disc (71) | `bumphole` | 102.15 | 525.65 | 1 | see §A | starts as bump. Has an empty clip-action record |
| 67 | small unit (77) | `smallholebump_` (sic, trailing `_`) | 208.5 | 51.85 | 1 | §B | |
| 89 | small unit (77) | | 288.95 | 98.1 | 1 | §B | |
| 111 | small unit (77) | | 255.95 | 149.85 | 1 | §B | |
| 133 | small unit (77) | | 326.2 | 149.85 | 1 | §B | |
| 155 | small unit (77) | | 217.5 | 105.1 | 1 | §B | |
| 177 | fan (88) | | 54.85 | 143 | 1 | §C | clip event below |
| 198 | tunnel (99) | | 204.4 | 451.8 | 1 | §D | |
| 222 | switch (113) | `switch_on` | 257.1 | 562.95 | 1 | §F | |
| 244 | maze (120) | | 427.45 | 313.3 | 1 | §G | clip events below |
| 455 | pin dimple (76 → shape 75) | | 136.2 | 111 | 1 | `dimple-b.svg` | 85x85, centre (178.7, 153.5) |
| 457 | red pin (122) | | 175 | 149.35 | 1 | `red-pin.svg` | child **PC_WallMaker** (d2, local (25.85, 22.85), `visible=true`): the 7.5x7.5 red square (x 175–182.5, y 149.35–156.85) is a **wall** |
| 460 | `block_holder` (123, empty sprite) | `block_holder` | 549.95 | 360 | — | nothing | never loaded into. Leftover. Ignore |
| 462 | `headerbar_holder` (54, empty) | `headerbar_holder` | 26 | 208 | 1 | `headerbar.swf` | headerbar's own frame 1 `stop()`s when loaded, so its bar is at holder + (365, 67) = **(391, 275)**, scale (0.9998, 1.001). Its 9 buttons use *this* engine (Add) and cursor. Bar spans stage ≈ x 31–771, y 258–292 |
| 464 | pocket (160) | | 355.1 | 484.15 | 1 | §E | |
| 490 | intro text (EditText 161) | | 40 | 307.65 | 1 | HTML text | below |
| 491 | **PC_ArrowCursor** | `cursor` | 636.3 | 219.5 | 1 | toolkit | |
| 493 | `tunnel_top` (93 → shape 92) | `tunnel_top` | placed (-140.15, 42.35). The tunnel's frame-1 script moves it to **(204.4, 451.8)** and sets `_visible=false` | | 1 | `tunnel-top.svg` | above the cursor |
| 495 | `pocket_top` (153 → shape 152) | `pocket_top` | placed (-118.95, 121). The pocket script moves it to **(355.1, 484.15)** and hides it | | 1 | `pocket-top.svg` | above the cursor |
| 497 | intro cover (shape 51) | | 0.3 | -3 | 1→0 | `background.jpg` | f2–f16 only |
| 498 | glow overlay (166) | | -248 | -146 | 0→1 | `glow-overlay.svg` | SVG top-left at (-88, -125.95). **Above the cursor** (it's just light) |

Main-timeline clip events:
- **fan d177** `onClipEvent(load)`: on `pc_mousedown` → `this.playing = !this.playing`.
- **maze d244** `onClipEvent(load)`: on `pc_rollin` → `this.gotoAndPlay(2)`. On `pc_rollout` → `this.gotoAndPlay(1)`.

### Intro text (EditText 161)

At (40, 307.65). Box: x -2…424.3, y -2…111.6 local (stage x 38–464, y 305.65–419.25). Arial 13 px, `#cccccc`, left-aligned, leading 2 px, non-selectable, multiline with **hard line breaks** (`<sbr/>`), no word-wrap:

```
Powercursor is a Flash toolkit to create interfaces you can touch.

Touch sensations like stickiness, volume, roughness, pressure
or mass can be experienced in a graphical user interface.
Powercursor uses a technique called 'optically simulated haptic
feedback' to evoke the tactile experience.
```

No links in the text. The only links on the page are the headerbar's.

### Loading text (EditText 49, frames 1–4)

At (328, 275). Box x 0.4–143.6, y -2–20.3. Centred (so the text is centred on stage x ≈ 400). Font `Arial_10pt_st` 10 px, `#cccccc`. Bound to variable `loading`. Shows "L  O  A  D  I  N  G" (f1), then "L  O  A  D  I  N  G  100 %" (f4).

---

## §A Big BUMP/HOLE disc (sprite 71, 22 frames). Instances `holebump` (705.45, 77.35) and `bumphole` (102.15, 525.65)

Children in local coords (add the instance position for stage). The force objects are centred on the instance (Hill centre (0,0), Hole centre (-2, -0.5)).

| depth | node | local x, y | scale | renders / params |
|---|---|---|---|---|
| 1 | **PC_Hill** `dynamichill2` (f2–11, f13–) | (-61, -61) | 1.22 | invisible. 122x122, centre (0,0). See params per frame |
| 7 | **PC_Hole** (f2–) | (-62, -60.5) | 1.2 | invisible. 120x120, centre (-2, -0.5) |
| 13 | bump shading (57 → shape 56) | (0.05, 0) | 1 | `bump-shading.svg` |
| 15 | hole shading (70 → shape 67) (f3–) | (0.05, 0) | 1 | `hole-shading.svg` (sprite 70 frame 2/shape 69 is never shown) |
| 17 | `bumptext` (63) | (-42.4, -43.55) | 1 | DropShadow (black, strength 0.297, angle 45°, distance 1, blur 1). Inner text at (1.4, 2) → text origin (-41.0, -41.55). Frame 1 = `label-bump.svg`, frame 2 = `label-hole.svg` (both `stop()`) |
| 19 | dashed circle (shape 64) | (-60, -60.55) | 1 | `area-circle-dashed.svg` |

Hill params (f2 and f13 instances): `strength=5, shape="U-shaped", plateauDiameter=1, style="None", tint=#DD2424, rolloverCursorStyle="Finger", rolloverCursorSound="scrape"`. Handlers: `pc_rollover` → `_root.cursor.gotoAndStop("finger")`; `pc_rollout` → `_root.cursor.gotoAndStop(1)`; `pc_mousedown` → `gotoAndPlay("makehole")`.

Hole params: `strength=5, shape="Sine-shaped", plateauDiameter=0, style="None", rolloverCursorStyle="Finger"`, sound `""` (f2, f22 instances) or `"scrape"` (f12 instance). The f12 and f22 instances have handlers: rollover → cursor finger; rollout → cursor 1; mousedown → (f22 only: `bumptext.gotoAndStop(1)`) `gotoAndPlay("makebump")`. The f2 instance has no handlers.

| frame | label | Hill α | Hole α | bump shading α | hole shading α | text | script |
|---|---|---|---|---|---|---|---|
| 1 | | — | — | 1 | — | BUMP | `if (_name=="holebump") { gotoAndStop("hole"); play(); } else gotoAndStop("bump");` |
| 2 | `bump` | 1 | 0 | 1 | — | BUMP | `stop()` |
| 3 | `makehole` | .891 | .102 | 1 | 0 | → HOLE | `bumptext.gotoAndStop(2)` |
| 4–11 | | .777 .668 .555 .445 .332 .223 .109 0 | .199 .301 .398 .5 .602 .699 .801 .898 | 1,1,1,1,1,.668,.332,0 (f9 .668, f10 .332, f11 0) | .145 .285 .43 .57 .715 .855 1 1 | HOLE | |
| 12 | `hole` | removed | 1 (new instance) | removed | 1 | HOLE | `bumptext.gotoAndStop(2); stop()` |
| 13 | | 0 (new instance) | .898 | — | 1 | HOLE | |
| 14 | `makebump` | .109 | .801 | 1 (re-placed) | 1 | → BUMP | `bumptext.gotoAndStop(1)` |
| 15–21 | | .223 .332 .445 .555 .668 .777 .891 | .699 .602 .5 .398 .301 .199 .102 | 1 | .875 .75 .625 .5 .375 .25 .125 | BUMP | |
| 22 | | 1 | 0 (new instance) | 1 | 0 | BUMP | `gotoAndStop("bump")` → frame 2 |

Behaviour:
- `holebump` (top-right) at start: jumps to `hole` and plays the hole→bump morph (f12→f22, ~0.33 s, during the intro fade), then rests at `bump`.
- `bumphole` (bottom-left) at start: rests at `bump`.
- In `bump`: clicking the hill → `makehole` (9 frames) → `hole`. In `hole`: clicking the hole → `makebump` (8 frames) → `bump`.
- Both rest as **BUMP** after the intro. JPEXS's static render shows "HOLE" text, but that's only because scripts don't run in the render.

## §B Small hole/bump unit (sprite 77, 36 frames)

Instances (stage centre = instance position):

| where | depth | stage (x, y) |
|---|---|---|
| main | 67 (`smallholebump_`) | (208.5, 51.85) |
| main | 89 | (288.95, 98.1) |
| main | 111 | (255.95, 149.85) |
| main | 133 | (326.2, 149.85) |
| main | 155 | (217.5, 105.1) |
| maze (120) d1 | | (470.10, 378.40) |
| maze (120) d23 | | (759.50, 355.45) |
| maze (120) d45 | | (707.50, 552.45) |

Frame-1 script: `if (this._name != "smallholebump") gotoAndPlay("hole"); else gotoAndStop("bump");`. **No instance is named exactly `smallholebump`** (the one candidate has a trailing underscore), so **all 8 start in `hole`**.

Children (local; all force objects centred on (0,0)):

| depth | node | local x, y | scale | notes |
|---|---|---|---|---|
| 1 | **PC_Hill** | (-23, -23) | 0.46 | 46x46, style None |
| 7 | **PC_Hole** "big" | (-8,-8) @0.16 in bump, (-23.5,-23.5) @0.47 in hole, animated between | | style "Disc with shading" |
| 13 | **PC_Hole** "trigger" | (-8, -8) | 0.16 | 16x16, style "Disc with shading" |
| 19 | dimple base (74 → shape 73) | (-42.65, -42.15) | 1 | `dimple-a.svg`, always |
| 21 | hole look (76 → shape 75) (f3–) | (-42, -41) | 1 | `dimple-b.svg`, alpha animated |

Parameters (all: `shape="Sine-shaped"`, `strength=5`, tint `#DD2424`):

| frame placed | node | plateau | style | cursorStyle | sound | handlers |
|---|---|---|---|---|---|---|
| 2 | Hill | 10 | None | Ball | scratch | rollover → cursor "ball"; rollout → cursor 1 **and** `gotoAndPlay("makehole")`; mousedown → `gotoAndPlay("makehole")` |
| 2 | big Hole α .738 | 0 | Disc w/ shading | Finger | "" | — |
| 2 | trigger Hole α .129 | 0 | Disc w/ shading | Ball | frantic | — |
| 16 | Hill α 0 | 10 | None | Finger | "" | rollover → cursor finger; rollout → cursor 1; mousedown → `gotoAndPlay("makehole")` |
| 17 | big Hole 0.47, α 1 | 0 | Disc w/ shading | Ball | scratch | rollover → cursor "ball"; rollout → cursor 1; mousedown → `gotoAndPlay("makebump")` |
| 17 | trigger Hole α .711 | 0 | Disc w/ shading | Ball | "" | **rollover → `gotoAndPlay("makebump")`** |
| 19 | Hill α 0 | 10 | None | Finger | "" | rollout → `gotoAndPlay("makehole")` |
| 20 | trigger Hole α .699 | 0 | Disc w/ shading | Finger | "" | — |
| 36 | Hill α 1 | 10 | None | Finger | "" | rollover → finger; rollout → 1; mousedown → `gotoAndPlay("makehole")` (also `_parent.bumptext.gotoAndStop(2)`, which doesn't exist here) |
| 36 | big Hole 0.16 α .75 | 0 | Disc w/ shading | Finger | "" | rollover → finger; rollout → 1; mousedown → `gotoAndPlay("makebump")` |

Timeline (α = alpha; big-hole scale grows linearly):

| frame | label | Hill α | big Hole scale / α | dimple-b α | script |
|---|---|---|---|---|---|
| 2 | `bump` | 1 | 0.16 / .738 | — | `stop()` |
| 3–15 | `makehole` (f3) | .93 → .07 (step ≈ −.071/frame: .93 .855 .785 .715 .645 .57 .5 .43 .355 .285 .215 .145 .07) | 0.1806 → 0.4286 (+0.0207/frame) / .754 → .965 | 0 → 1 (0, .082, .168, .25, .332, .418, .5, .582, .668, .75, .832, .918, 1) | |
| 16 | | 0 (new) | 0.4493 / .984 | 1 | |
| 17 | `hole` | removed | 0.47 / 1 (new) | 1 | `stop()` |
| 18 | | — | 0.4537 / .988 | 1 | |
| 19 | | 0 (new) | 0.4373 / .973 | 1 | |
| 20–35 | `makebump` (f20) | .059 → .941 (+.059/frame) | 0.421 → 0.1763 (−0.0163/frame) / .961 → .762 | .938 → .0625 (−.0625/frame) | |
| 36 | | 1 (new) | 0.16 / .75 (new) | 0 | `gotoAndStop("bump")` |

Behaviour summary: in **hole**, the cursor falls into a 47 px sine hole. If it reaches the 16 px trigger at the centre (`pc_rollover` on the trigger), the unit morphs into a **bump** over 16 frames (~0.5 s), pushing the cursor out. The f19 hill's `pc_rollout` (cursor left the 46 px area) → morphs back to **hole** (13 frames). In **bump**, rolling off or clicking the hill also starts `makehole`. Net effect: a hole that spits you out when you hit bottom, then re-forms.

## §C Fan (sprite 88, 9 frames) at (54.85, 143)

Same mechanism as the standalone `fan` demo (see `fan.md`), relocated:

| depth | node | stage x, y | scale | notes |
|---|---|---|---|---|
| 1 | **PC_EventDispatcher** (parent = fan) | (119.2, 160) | 1 | `visible=true, minHeight=0, minWidth=0`. Makes the fan sprite emit pc_* events over its drawn art |
| 3 | **PC_Hole** | (55.85, 143) | 0.647 | 64.7 px, centre (88.20, 175.35). `strength=3, shape="U-shaped", plateauDiameter=0, style="None", rolloverCursorStyle="Finger", rolloverCursorSound="pop"` |
| 9 | **PC_Twister** (f1–7) / `fan-4.svg` (f8–9) | (54.85, 143) | 0.6673 | 66.7 px, centre (88.21, 176.36). `strength=18, shape="U-shaped", plateauDiameter=10, spin="Right Out", style="None", vortexStyle="None", rolloverCursorStyle="Null", rolloverCursorSound=""` |
| 20 | blade art (f1–7) | (54.85, 143) | 1 | f1–3 `fan-1`, f4–5 `fan-2`, f6–7 `fan-3` |

Scripts: f1 `playing = true`. f9: `if (playing) gotoAndPlay(3) else gotoAndPlay(_currentframe - 1)`.
- Running loop f3–f9 (7 frames): art 1,2,2,3,3,4,4. The Twister exists on f3–f7, is removed on f8–f9 and re-created on f3 (a 2-of-7-frame dropout; the port can keep it on).
- Click (pc_mousedown, toggled by the main-level handler) → `playing=false`. The loop then becomes f8↔f9: static `fan-4`, no Twister. Only the Hole remains. Click again → resumes.

## §D Tunnel (sprite 99, 19 frames) at (204.4, 451.8)

| depth | node | local x, y | stage x, y | scale | notes |
|---|---|---|---|---|---|
| 1 | body | (0, 0) | (204.4, 451.8) | 1 | `tunnel-body.svg` |
| 2 | **PC_Gutter** (f7–12 "bobble") | (16.25, 10.4) | (220.65, 462.2) | 0.5009, 1.44 | 100.2x36, centre (270.74, 480.2). `strength=-3, shape="Sine-shaped", plateauDiameter=2, graphicsStyle="None", rolloverCursorStyle="Null"` (negative = ridge) |
| 2 | **PC_Gutter** (f13– "tunnel") | (21.4, 16.9) | (225.8, 468.7) | 0.4491, 1 | 89.8x25, centre (270.71, 481.2). `strength=4, shape="V-shaped", plateauDiameter=2, graphicsStyle="None", rolloverCursorStyle="Null"` |
| 6 | **PC_Hole** (f4–) | (-7.15, 9.05) | (197.25, 460.85) | 0.381 | 38.1 px, centre (216.30, 479.90). `strength=3, shape="U-shaped", plateauDiameter=0, style="None", rolloverCursorStyle="Default", rolloverCursorSound="scratch"` |
| 12 | **PC_Hole** (f4–) | (101.7, 9.6) | (306.1, 461.4) | 0.4037 | 40.4 px, centre (326.28, 481.58). Same params |
| 18 | `tunnel_top_local` (93) | (0, 0) | (204.4, 451.8) | 1 | `tunnel-top.svg` (under the cursor) |
| 20 | end zones (95), α 0 | (-4.15, 12.85) | (200.25, 464.65) | 1 | `tunnel-zone-ends.svg` (art stage x 212.25–336.1, y 464.9–494.3) + child EventDispatcher (local (178, 46.25)). Handler: `pc_rollin` → `_parent.gotoAndPlay("tunnel")` |
| 23 | side zones (97), α 0 | (7.8, 13.5) | (212.2, 465.3) | 1 | shape 96 at (-27.85, -40) inside → `tunnel-zone-sides.svg` art stage x 192.85–361.35, y 435.3–528.3 + EventDispatcher (local (115.7, 73.25)). Handler: `pc_rollin` → `_parent.gotoAndPlay("bobble")` |

Timeline:

| frame | label | script / state |
|---|---|---|
| 1 | `init` | `tunnelX=_x; tunnelY=_y; _parent.tunnel_top._visible=false; _parent.tunnel_top._x=tunnelX; _parent.tunnel_top._y=tunnelY; stop()`. **No forces yet** |
| 4 | | (passed through) end holes placed |
| 7 | `bobble` | ridge gutter (−3). `tunnel_top_local._visible=true; _parent.tunnel_top._visible=false; stop()` |
| 12 | | `stop()` (unreached) |
| 13 | `tunnel` | V gutter (+4) replaces ridge. `tunnel_top_local._visible=false; _parent.tunnel_top._visible=true` (top drawn **over** the cursor) |
| 19 | | `stop()` |

Effect: from above or below, the tunnel is a ridge you bump over, and the top is under the cursor. Entering an end zone switches to "tunnel": the cursor is pulled into the end hole and guided along the V groove, visually hidden under the tunnel top. Touching a side zone again switches back to "bobble".

## §E Pocket with bunny (sprite 160, 19 frames) at (355.1, 484.15)

| depth | node | local x, y | stage x, y | scale | notes |
|---|---|---|---|---|---|
| 1 | **PC_Hill** (f7–12 "bobble") | (8.3, 14.4) | (363.4, 498.55) | 0.8243 | 82.4 px, centre (404.62, 539.77). `strength=5, shape="Sine-shaped", plateauDiameter=0, style="None", rolloverCursorStyle="Default", rolloverCursorSound=""` |
| 1 | **PC_Hole** (f13– "tunnel") | (9.3, 13.3) | (364.4, 497.45) | 0.8243 | 82.4 px, centre (405.62, 538.67). `strength=3, shape="U-shaped", plateauDiameter=0, style="None", rolloverCursorStyle="Default", rolloverCursorSound="scratch"` |
| 7 | **PC_Wall** (f13–) | (95, 96.85) rot 180 | (450.1, 581) | 0.2899, 0.7885 | covers x 421.11–450.1, y 502.15–581 (right wall). `rolloverCursorStyle="Null", rolloverCursorSound="", tint=#DD2424` |
| 9 | **PC_Wall** (f13–) | (32.85, 96.85) rot 180 | (387.95, 581) | 0.2899, 0.7885 | x 358.96–387.95, y 502.15–581 (left wall). Same params |
| 11 | **PC_Wall** (f13–) | (85.75, 104.35) rot 180 | (440.85, 588.5) | 0.7697, 0.4279 | x 363.88–440.85, y 545.71–588.5 (floor). Same params |
| 13 | **PC_Slope** (≈PC_Ramp) (f13–) | (16.75, 46.6) | (371.85, 530.75) | 0.62, 0.5503 | 62x55, centre (402.85, 558.26). `angle=0, strength=3, graphicsStyle="Square", tint=#DD2424` |
| 15 | pocket body | (0, 0) | (355.1, 484.15) | 1 | `pocket-body.svg`. Drawn **above** depths 1–13, so any wall/slope visualisation is hidden behind it |
| 16 | bunny (150) | (26.65, 32.75) | (381.75, 516.9) | 1 | contains bunny anim (148) at (0.35, 0.35) → stage (382.1, 517.25), and **PC_DraggerMaker** (local (40.35, 26.35), `visible=true`): the bunny can be dragged with the PowerCursor |
| 20 | pocket top (153), instance `tunnel_top_local` | (0, 0) | (355.1, 484.15) | 1 | `pocket-top.svg` (under the cursor) |
| 22 | opening zone (155), α 0 | (-4.15, 12.85) | (350.95, 497) | 1 | `pocket-zone-opening.svg` (art x 387.95–425.95, y 493–515) + EventDispatcher. `pc_rollin` → `_parent.gotoAndPlay("tunnel")` |
| 25 | side zone (157), α 0 | (7.8, 13.5) | (362.9, 497.65) | 1 | `pocket-zone-sides.svg` (art x 339.9–471.9, y 475.65–643.65) + EventDispatcher. `pc_rollin` → `_parent.gotoAndPlay("bobble")` |

Timeline: f1 `init`: `pocketX=_x; pocketY=_y; _parent.pocket_top._visible=false; move pocket_top to (pocketX, pocketY); stop()`. No forces. f7 `bobble`: Hill. `pocket_top_local._visible=true; _parent.pocket_top._visible=false; stop()`. f13 `tunnel`: Hole + walls + slope. `pocket_top_local._visible=false; _parent.pocket_top._visible=true`. f19 `stop()`.

**Bug to preserve or decide:** the inner top is named `tunnel_top_local` (copy-paste from the tunnel), but the script uses `pocket_top_local`. So the local top is **never hidden**. In "tunnel" state the main-level `pocket_top` (d495, above the cursor) becomes visible on top of it. Net visual: the front of the pocket draws over the cursor when inside. Same as intended.

Bunny animation (sprite 148, 117-frame loop at 30 fps): frames 1–20 `bunny-01`, 21–26 `-02`, 27–35 `-03`, 36–55 `-04`, 56–60 `-05`, 61–70 `-06`, 71–75 `-07`, 76–85 `-08`, 86–90 `-09`, 91–110 `-10`, 111–117 `-11`.

## §F Switch (sprite 113, 71 frames), instance `switch_on` at (257.1, 562.95)

Static children: slot `switch-slot.svg` (d20) centred at (257.1, 562.95) (x 245.6–268.6, y 548.45–577.45). Knob light `switch-knob.svg` (d21, sprite 106) at local (-11.5, -7.4) = stage (245.6, 555.55) in "off". It moves to local y -14.5 (stage 548.45) in "on". Label (d1) at local (-6.75, -30) = stage (250.35, 532.95): "off" (EditText 101) or "on" (EditText 112, from f29). Arial 13 px `#999999`, box 22.75x20.8.

Knob ColorMatrix filter (SVG `feColorMatrix` with the 5th column ÷255):
- **off** (f1, f68): `[0.351804 0.694716 0.09348 0 -43.09; same row ×3; 0 0 0 1 0]` = greyscale, darkened.
- **on** (f30): `[0.76580 3.24626 -2.87206 0 -43.09; -0.41332 0.60186 0.95146 0 -43.09; 2.52299 -1.26871 -0.11428 0 -43.09; 0 0 0 1 0]` = turns the green light **red**.
- f25–29 ramp off→on and f62–67 on→off through intermediate matrices (exact values are in `home.xml`). Linear interpolation of the 20 coefficients is close.

Force objects (all **PC_Hole** unless noted). Stage centres:

| id | placed at frame(s) | local pos, scale | stage centre, size | params |
|---|---|---|---|---|
| H-area-off | f1 (str 0), f5 (str 2) | (-13.25, -14.5), 0.2662x0.3549 | (257.16, 566.19), 26.6x35.5 | `shape="U-shaped", plateauDiameter=20, style="None"` |
| H-knob-off | f6 (str 3, plateau 2), f17 (str 0, plateau 5) | (-6.15, -4.15), 0.13 | (257.45, 565.30), 13x13 | `shape="Sine-shaped", style="None", tint=#00FFFF` |
| H-up | f19 | (-4.05, -11.4), 0.088x0.0836 | (257.45, 555.73), 8.8x8.4 | `str 3, Sine, plateau 4, style="Circle with shading"` |
| PG-up (**PC_Pushgutter**) | f24 | (-4.5, 12.1), rot -90, 0.0825 (len) x 0.4 | (257.60, 566.80), 16.5 long x 10 | `strength=3, pushStrength=3, shape="U-shaped", plateauDiameter=5, arrowStyle="Still", graphicsStyle="None"`. Pushes **up** |
| W (sprite 110, α 0) + **PC_WallMaker** | f24, f61 | (-16.65, -22.75) | `switch-wall.svg` reg at stage (240.45, 540.2) | wall = shape 108's filled area. Free space is only a small ellipse ≈ stage x 255.0–260.5, y 557.5–566.3 (the knob path). WallMaker `visible=true` |
| D (**PC_Dimmer**) | f24, f61 | (-10.6, -14.25), 0.2206x0.2842 | (257.53, 562.91), 22.1x28.4 | `scope="Mouse", dimmingFactor=0, directionDependency="None", dirDepAngle=0, tint=#EEABAB`. Mouse input ignored while inside |
| H-area-on | f39 (str 0), f43 (str 2) | (-13.25, -21), 0.2662x0.3549 | (257.16, 559.69), 26.6x35.5 | as H-area-off |
| H-knob-on | f42 (str 3, plateau 2, style None), f53 (str 1, plateau 3, style "Circle") | (-6.15, -10.15), 0.13 | (257.45, 559.30), 13x13 | Sine, tint #00FFFF |
| H-down | f56 | (-3.75, -0.1), 0.0821 | (257.46, 566.96), 8.2x8.2 | `str 3, Sine, plateau 4, style="Circle with shading"` |
| PG-down (**PC_Pushgutter**) | f61 | (5.5, -12), rot +90, 0.0685 x 0.4 | (257.60, 557.80), 13.7 x 10 | `strength=3, pushStrength=3, U-shaped, plateauDiameter=4, arrowStyle="Still", graphicsStyle="None"`. Pushes **down** |

All switch holes have `rolloverCursorStyle="Null", rolloverCursorSound=""`. The pushgutter and dimmer handlers only set the cursor to "finger" on rollover.

Timeline / state machine (`dragswitch = true` is set in f1. `status` is only read in f1, which is never revisited, so it's dead code):

| frame | label | display changes | script / handlers active |
|---|---|---|---|
| 1 | | H-area-off (str 0) | `dragswitch=true; if (status=="on") {gotoAndStop("on_rollout"); play();}`. Falls through |
| 2 | `off_rollout` | | `stop()`. **Rest state "off"** |
| 4 | `off_rollover` | | |
| 5 | | H-area-off str 2 | H-area handlers: rollover → `play()`; rollin → `gotoAndPlay("off_rollover")`; rollout → cursor "arrow", `gotoAndStop("off_rollout")` |
| 6 | | + H-knob-off str 3 | H-knob: rollover/rollin → cursor "finger"; rollout → `gotoAndPlay("off_rollout")`; mousedown → `gotoAndPlay("turn_on")` |
| 12 | `off_inside` | H-area removed | |
| 17 | | H-knob-off re-placed str 0 | same handlers |
| 19 | `off_inside_forawhile` | + H-up | `stop()`. H-up: rollin → cursor finger, `if (dragswitch) gotoAndPlay("turn_on")`; rollout → cursor finger |
| 24 | `turn_on` | H-knob, H-up removed. + PG-up, W, D | `_root.cursor.gotoAndStop("finger")` |
| 25–29 | | knob y -8.8, -10.25, -11.65, -13.1, -14.5. f29 label → "on" | |
| 30 | | knob filter = on (red) | |
| 31 | | | `status="on"; gotoAndStop("on_go_inside"); play()`. Skips to f47, applying f32–f47 changes on the way: PG/W/D removed, H-area-on str 2, H-knob-on str 3 |
| 35 | `on_rollout` | | `play()` |
| 39 | | + H-area-on str 0 | H-area-on: rollover → `play()`; rollout → cursor "arrow", `gotoAndPlay("on_rollout")`; rollin → `gotoAndPlay("on_rollover")` |
| 41 | | | `stop()`. **Rest state "on"** |
| 42 | `on_rollover` | + H-knob-on str 3 | H-knob-on: rollover → finger; rollout → cursor "arrow", `gotoAndPlay("on_rollout")`; mousedown → `gotoAndPlay("turn_off")` |
| 43 | | H-area-on str 2 | |
| 47 | `on_go_inside` | | |
| 49 | | H-area-on removed | |
| 51 | `on_inside` | | |
| 53 | | H-knob-on re-placed str 1, style Circle | same handlers |
| 56 | `on_inside_forawhile` | + H-down | `stop()`. H-down: rollin → finger, `if (dragswitch) gotoAndPlay("turn_off")`; rollout → finger |
| 61 | `turn_off` | H-knob, H-down removed. + PG-down, W, D | `_root.cursor.gotoAndStop("finger")` |
| 62–68 | | knob y -13.5, -12.45, -11.45, -10.45, -9.45, -8.4, -7.4. Filter ramps to grey (f68) | |
| 71 | | W removed | `status="off"; gotoAndStop("off_inside"); play()`. Jumps back to f12 and plays to f19 `stop()`. The display list is rebuilt for f12: label "off", knob grey at -7.4, H-knob-off (f6 instance) |

Experience: hovering the switch adds a weak hole (str 2) and a knob hole (str 3) that settle the cursor onto the knob. About 0.5 s after rolling in (f4→f19) the area hole goes and a small hole appears just above the knob ("off") or below it ("on"). Nudging into it, or clicking the knob, throws the switch. During the 7-frame throw, the Dimmer cancels mouse input, the WallMaker confines the cursor to the knob slot, and the Pushgutter carries the cursor with the knob. The label flips and the light turns red/grey.

## §G Circuit / maze (sprite 120, 2 frames) at (427.45, 313.3)

Frame 1 (`stop()`), always present:

| depth | node | stage | notes |
|---|---|---|---|
| 1, 23, 45 | small units (77) | (470.10, 378.40), (759.50, 355.45), (707.50, 552.45) | see §B (start as holes) |
| 67 | maze art (shape 115) | reg (427.45, 313.3) | `maze.svg`. Art covers x 462.45–762.45, y 344.15–554.15 |
| 68–81 | 14 arrows (shape 116) | see list | `maze-arrow.svg` (reg offset (0.6, 0.6)), rotation about the reg point |
| 162–202 | 6 junctions (118) | see list | each = **PC_Hole** (scale 0.11 at (0,0) → 11 px, centre local (5.5, 5.5)) + `maze-junction-dot.svg` at (0,0). Hole: `strength=3, shape="U-shaped", plateauDiameter=2, style="None", tint=#CCCCCC, rolloverCursorStyle="Finger"`. Handlers: rollover → cursor "ball"; rollout → cursor 1 |
| 210 | **PC_EventDispatcher** (parent = maze) | (584.8, 330.65) | `visible=true`. Drives the main-level rollin/rollout handlers |

Arrows (stage reg point, rotation): d68 (576.60, 442.30) 0°, d69 (627.85, 442.20) 0°, d70 (658.35, 478.20) 0°, d71 (644.65, 514.30) 0°, d72 (553.90, 514.30) 0°, d73 (508.25, 481.15) 90°, d74 (508.25, 414.15) 90°, d75 (532.15, 383.30) 180°, d76 (606.90, 383.20) 180°, d77 (707.90, 360.95) 180°, d78 (561.15, 400.65) 90°, d79 (703.45, 403.40) −90°, d80 (703.40, 453.65) −90°, d81 (639.40, 406.15) −90°.

Junction sprite positions (top-left; hole centre = +5.5,+5.5): (551.40, 372.95), (637.90, 372.95), (674.40, 372.45), (701.90, 476.95), (701.90, 512.30), (606.90, 440.95).

Frame 2 (`stop()`): adds the force network, sprite 119, at (477.75, 369.15). Its `onClipEvent(load)` registers rollover → (empty function) and rollout → `_root.cursor.gotoAndStop(1)`.

Main-level handlers on the maze: `pc_rollin` → `gotoAndPlay(2)` (network on). `pc_rollout` → `gotoAndPlay(1)` (network removed). **The circuit only pushes while the cursor is inside the maze area.**

Sprite 119 contents (stage). All **PC_Pushgutter** have `strength=3, pushStrength=5, shape="Sine-shaped", plateauDiameter=0, arrowStyle="None", graphicsStyle="None", rolloverCursorStyle="Null", rolloverCursorSound="tickle"`, tint `#333333` (d7, d19: `#DD2424`). They push along local +x (rot 0 → right, 90 → down, 180 → left, −90 → up):

| depth | stage reg x, y | sx (len) | sy (width) | rot | centre | length x width |
|---|---|---|---|---|---|---|
| 1 | 477.75, 369.15 | 1.1254 | 0.7184 | 0 | (590.29, 378.13) | 225.1 x 18.0 |
| 7 | 716.80, 369.15 | 0.8451 | 0.7987 | 90 | (706.82, 453.66) | 169.0 x 20.0 |
| 13 | 702.35, 523.65 | 0.9808 | 0.7184 | 180 | (604.27, 514.67) | 196.2 x 18.0 |
| 19 | 494.50, 523.05 | 0.7004 | 0.7987 | −90 | (504.48, 453.01) | 140.1 x 20.0 |
| 37 | 703.85, 491.20 | 0.4707 | 0.7184 | 180 | (656.78, 482.22) | 94.1 x 18.0 |
| 43 | 652.70, 455.70 | 0.4984 | 0.7184 | 180 | (602.86, 446.72) | 99.7 x 18.0 |
| 49 | 652.70, 378.10 | 0.3459 | 0.7184 | 90 | (643.72, 412.69) | 69.2 x 18.0 |
| 55 | 547.75, 455.70 | 0.3816 | 0.7184 | −90 | (556.73, 417.54) | 76.3 x 18.0 |
| 61 | 604.75, 491.00 | 0.1946 | 0.7184 | −90 | (613.73, 471.54) | 38.9 x 18.0 |
| 67 | 670.25, 377.60 | 0.1046 | 0.7184 | −90 | (679.23, 367.14) | 20.9 x 18.0 |
| 73 | 669.75, 347.70 | 0.4335 | 0.7184 | 0 | (713.10, 356.68) | 86.7 x 18.0 |

**PC_Dimmer** ×6 (scale 0.127 → 12.7x12.7). `scope="Local forces", dimmingFactor=0, directionDependency="None", dirDepAngle=0, tint=#333333`. They sit exactly on the junctions and cancel the push there. Centres: (557.10, 378.25), (643.10, 378.10), (680.10, 378.10), (706.60, 482.10), (706.60, 517.10), (612.10, 446.10).

**PC_EventDispatcher** d79 at (746.10, 400.00).

Flow: right along the top line, down the right side, left along the bottom, up the left side, with inner branches as listed. At each junction the dimmer zeroes the push and the 11 px junction hole holds the cursor, so the user picks the next branch.

---

## Toolkit visuals: what is actually visible

- Every force object here uses `style="None"` / `graphicsStyle="None"` (invisible), with these exceptions:
  - §B holes: `"Disc with shading"` with **plateauDiameter 0**. PC_RoundReadyMadeObject scales the disc by `plateau/100` → **disc invisible**. Only `PC_Round_Light/Shade` shading would show.
  - Switch H-up/H-down: `"Circle with shading"`, plateau 4. H-knob-on (f53): `"Circle"`, plateau 3. The circle is scaled to 3–4 % of 8–13 px, so effectively invisible.
  - Pocket Slope `"Square"` and the three Walls (default look): all drawn **under** the opaque pocket body, so hidden.
  - Dimmers attach `PC_Square` tinted (`#333333` in the maze = bg-coloured; `#EEABAB` in the switch, which would flash pink for ~8 frames).
- **Uncertain:** home.swf does not export `PC_Disc`, `PC_Square` or `PC_Round_Light/Shade` (it does export `PC_Circle`). The author seems to have relied on those `attachMovie` calls failing. JPEXS can't render imports, so this can't be confirmed from the SWF. **Recommendation:** render all of these objects invisible in the port. The demo's own bitmaps (dimples, shading discs) carry all the visuals.

## Verification

1. Load: grey brushed-metal page with a small "L O A D I N G" at centre (x≈400, y≈285) for a moment. Then the scene fades in over ~0.3 s while a soft radial glow brightens the middle. The glow does not cover the menu bar. The top-right disc visibly morphs from a dark hole to a raised bump with "BUMP / less accessible area".
2. Menu bar at y≈258–292 (x≈31–771). Its buttons highlight and pull the cursor briefly, and clicks navigate (see `headerbar.md`).
3. Moving onto either big disc: the cursor turns to a Finger, "scrape" plays, and it is pushed off-centre (hill, strength 5 over 122 px). Click: the text switches to "HOLE / easily accessible area", the shading flips, and the cursor is now drawn to the centre. Click again: back to BUMP.
4. Small dimples: the cursor falls in toward the centre. On reaching it, the dimple rises (~0.5 s) and ejects the cursor ("frantic"/"scratch" sounds, Ball cursor). After leaving, it sinks back.
5. Fan: approaching the head spins the cursor away clockwise-outward. Clicking the fan freezes the blades and the cursor can then rest in the head (gentle hole). Click to restart.
6. Red pin: the cursor cannot pass through the 7.5 px red square.
7. Tunnel: from above or below the cursor rides over a ridge. Entering at the left or right mouth, it slides along the axis and disappears under the tunnel top until it exits.
8. Pocket: from outside it bulges (hill). Through the opening the cursor drops in, is confined by the walls and is hidden by the pocket front. You can drag the bunny.
9. Switch: hovering parks the cursor on the knob. Click (or wait ~0.5 s and nudge up) and the knob slides up carrying the cursor (mouse frozen ~7 frames). The light turns red and the label reads "on". Reverse to turn off (light grey, "off").
10. Maze: once the cursor enters the circuit rectangle (x 462–762, y 344–554) it gets carried along the lines in the arrow directions and stops at each black junction dot. Leaving the area switches the push network off.
