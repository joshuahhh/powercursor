# block: porting spec

Source: `block.swf` (AS2, SWF v8), decompiled with JPEXS into `$SCRATCH/out/block/`. The SWF also embeds a lot of unused Flash UI-component and toolkit-preview clutter (sprites 2–59: twister vortex art, Label/UIObject/FocusManager, etc.). Ignore it; the demo is entirely sprite 225.

## Stage
| | |
|---|---|
| Size | 250 × 250 px |
| Background | #FFFFFF (fully covered by a 256×256 dark texture image) |
| FPS | **40** |
| Main timeline | 32 frames. Frame 1: `if (_root != this) stop();` (only inside the examples shell). Frame 31: `gotoAndPlay(_currentframe - 1)`, so it loops frames 30↔31 forever. Nothing on the main timeline changes after frame 3, so this is irrelevant to the port. |

**What it is** (examplelist.xml): "The wooden cube can be flipped by pushing the cursor on the right side. This is a more complex example of how visual force feedback can be used to simulate properties of physical objects."
A photo-real wooden cube sits on a dark floor with a soft orange glow beneath it. It is a 30-step pre-rendered animation of the cube rolling over its bottom-right edge onto its right side. While the cursor is on the cube's **top face**, the cursor becomes a finger. A small pulsing red arrow on the top face points toward the right edge. Pushing the cursor into the strip along the top face's **right edge** tips the cube one animation step per tick. An invisible PushGutter shoves the cursor back toward the rear of the face, which is the cube resisting. Leaving the top face lets "gravity" take over: before the halfway frame (14) the cube falls back upright, after it the cube falls over onto its side. The cursor rides along and is caught in a small Hole on the new face. Every force object is hidden under the background image. Only the background, shadow, glow, cube bitmap and hint arrow are visible.

## Engine / cursor (main timeline, frame 3)
| depth | object | stage pos | params |
|---|---|---|---|
| 49 | `PC_System.PC_Engine` | (-162, 1), off-stage | bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", **scaleToAlpha=false**, hideAllObjects=false |
| 54 | `PC_Cursors.PC_ArrowCursor`, name `cursor` | (209.3, 21), irrelevant | graphicStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true |

Scripts call `_root.cursor.gotoAndStop("finger")` / `("arrow")` to change the cursor look (see blokbovenvlak).

## Display list
Main depth 1: **sprite 225** at (298.4, 212.05), identity. All stage coordinates below already include this +298.4/+212.05 offset. Children are in depth order (bottom to top). **Everything below depth 41 is hidden behind the opaque background image.** Those layers are force/event geometry only and must not be drawn.

| depth | name | sprite-225 frames | stage transform | what / params |
|---|---|---|---|---|
| 1 | `hoepback` (sprite 67) | 1–32 | per frame, see table | "push back" zone. Hit area = local square −34…34 (a 67×67 square with a 1 px stroke). Child `PC_ButtonMaker` at (0.65,−0.8): outframe=1, overframe="over", downframe=1, upframe=1, rolloverCursorStyle="Finger" |
| 6 | `hoep2` (sprite 71) | 1–32 | per frame | "push forward" zone. Same square, same ButtonMaker params |
| 11 | mask (clipDepth) | 1–32 | (298.55, 212.05) | Masks depth 12. The shape = the top-face shape of the same frame (`topface-NN.svg`). In frames 1–2 and 28–31 it masks nothing. |
| 12 | `Goot 2`: `PC_Objects.PC_Pushgutter` | 3–27 | per frame; **new instance every frame** | alpha 128/256 (irrelevant: scaleToAlpha=false). Frames 3–6: strength=0, pushStrength=1, arrowStyle="Still", graphicsStyle="Rectangle". Frames 7–27: strength=3, pushStrength=3, arrowStyle="Animated", graphicsStyle="Block with shading". All: shape="U-shaped", plateauDiameter=20, tint=13434675 (#CCFF33), rolloverCursorStyle="Null" |
| 19 | gravity driver | sprite 73 in 1–13, sprite 223 in 14–30, none in 31 | n/a (no art) | calls `gravityPush(−1)` (sprite 73) or `gravityPush(+1)` (sprite 223) every tick |
| 21 | `blockframe` (sprite 91) | 1–32 | (297.25, 212.15) | **walls**: child `PC_Behaviours.PC_WallMaker` at local (−201.4,−95.95), no params. The parent's strokes (2 px red lines) are the walls → `wall-NN.svg` |
| 26 | `rougharea` (sprite 122) | 1–32 | (298.0, 211.9) | **sand over the whole cube**: child `PC_Behaviours.PC_SandMaker` at local (−186.7,−93.5): strengthStickyness=2, strengthRoughness=0, directionDependency="None", dirDepAngle=0 → `sand-NN.svg`. (Colour transform mult 108/256 + add 89, invisible anyway) |
| 29 | `blokbovenvlak` (sprite 153) | 1–32 | (298.55, 212.05) | **top-face event area**: child `PC_Behaviours.PC_EventDispatcher` named `hittop` at local (−198.45,−159.45), no params → `topface-NN.svg`. The custom listeners below drive `pushing` |
| 32 | sand patch (sprite 155) | 1–2 and 28–31 | frames 1–2: x=127.05 y=97.15 scale 0.684265; frames 28–31: x=185.25 y=101.9 scale 1 | child `PC_SandMaker` at local (24.75,−1): strengthStickyness=3, strengthRoughness=0, directionDependency="None", dirDepAngle=0 → `sandpatch.svg`. A thin band along the right-hand edge of the face the cursor rests on (just below the top-right edge) |
| 35 | `PC_Objects.PC_Hill` | 1–2 | x=34.1 y=11.15 scale 1.003174 → centre (84.3, 61.3), r≈50 | strength=**−1** (pulls inward), shape="Sine-shaped", plateauDiameter=0, style="Disc with shading", tint=16737792 (#FF6600). Gentle well on the resting top face |
| 35 | `PC_Objects.PC_Hole` | 28–31 | x=135.95 y=94.15 scale 1 → centre (185.95, 144.15) | strength=3, shape="U-shaped", plateauDiameter=2, style="Disc with shading", tint=16737792. Catches the cursor on the face that is now facing the viewer on the right |
| 41 | background (shape 158) | all | `background.jpg` 256×256, top-left at stage (0.1, 0.65) | opaque, so it hides depths 1–35 |
| 42 | shadow (sprite 160 → shape 159) | all | registration at (122.45, 155.3) | `shadow.svg` (black polygon), **alpha 38/256 (0.148), blend mode DARKEN** (≈ black at 14.8 % over the dark floor) |
| 44 | `blokjesshade` (sprite 221) | all | matrix [1, 0, 0, 0.5744171, 298.8, 230.95] | the orange **glow under the cube**: a vertically squashed copy of `blokjes` (same frame, including the hint arrow). Alpha 95/256 (0.371). Filters in order: **Blur blurX=52 blurY=66 (1 pass, box)**, then **ColorMatrix** (rows R,G,B,A × [r,g,b,a,offset]): [0.8344991, 0.06654648, 0.0089544, 0, −55.254997], [0.033699118, 0.8673464, 0.0089544, 0, −55.254997], [0.033699118, 0.06654648, 0.8097544, 0, −55.254997], [0,0,0,1,0]. Flash filter sizes are in screen pixels (not scaled by the matrix). A 1-pass box blur of 52/66 is roughly a Gaussian σ ≈ 15/19 px |
| 47 | `blokjes` (sprite 221) | all | (298.3, 212.4), identity | the cube: `block-NN.png` (200×200, transparent PNG) drawn with its top-left at local (−275,−200) → **stage top-left (23.3, 12.4)**. Plus the hint arrow (below) |

### Hint arrow (sprite 164 inside sprite 221, depth 2)
- Shape 163 = red (#FF0000) downward triangle, about 596×597 local → `hint-arrow.svg`, registration offset (−0.65, −0.95). It is drawn heavily scaled and sheared so that it lies in the plane of the top face.
- Present in blokjes/blokjesshade frames **1–2** with matrix (inside sprite 221) [0.05177307, −0.031158447, 0.032440186, 0.020355225, −222.65, −134.65]. In stage space (blokjes) that is [same a,b,c,d, 75.65, 77.75]: the triangle (75.7,77.8)-(106.7,59.1)-tip(110.6,80.6), pointing down-right toward the right edge of the top face.
- Present again in frames **30–31** (new instance) with [−0.046081543, 0.03894043, 0.001953125, −0.04145813, −95.3, −82.7]. Stage (blokjes): tx,ty = 203.0, 129.7. The triangle (203.0,129.7)-(175.4,153.1)-tip(190.3,116.6) points up-left, meaning "push it back".
- **Glow filter**: colour #853B1A (r133 g59 b26), alpha 1, blurX=blurY=15, strength 2, 1 pass, outer, not knockout.
- Alpha animation (sprite 164, 75 frames at 40 fps): frames 1–25 empty (a 0.625 s delay after each (re)creation). Frame 26 is labelled `start`. Frames 26–75 alpha/256 = 77,80,83,86,95,105,114,124,133,143,152,162,171,180,190,199,209,218,228,237,247, then 256 for frames 47–62, then 242,228,215,201,187,173,160,146,132,118,105,91,77. Frame 75 script: `gotoAndStop("start"); play();`, so it loops frames 26–74 (49 frames, about 1.2 s).
- When the cube leaves frame 2 the arrow is removed, and it restarts its delay on return (a new instance).

### Hit-geometry assets (per animation frame NN = 02…31)
| file | parent node | parent stage registration | SVG registration offset (tx,ty) | notes |
|---|---|---|---|---|
| `topface-NN.svg` | blokbovenvlak | (298.55, 212.05) | (395.45, 267.35) | filled polygon (#00CC00 + 1 px red stroke) = area of the face that was on top at rest. It follows that face as it rolls (by frame 31 it is the right-facing side) |
| `wall-NN.svg` | blockframe | (297.25, 212.15) | (273, 172) | 2 px stroke lines only. NN=02: full outline of the upright cube (all 9 visible edges). 03: same minus the two rear top edges. 04–16: a single line from the bottom-front corner (≈ stage (91,170)) up to the moving front-top corner. **17–29: no file = no walls.** 30–31: full outline of the fallen cube |
| `sand-NN.svg` | rougharea | (298.0, 211.9) | (273, 176) | filled polygon = whole visible cube silhouette |
| `sandpatch.svg` | sand patch (depth 32) | see table above | (29.5, 24.5) | thin quadrilateral band |
| `block-NN.png` | blokjes | (298.3, 212.4) | image top-left at local (−275, −200) | NN=02…30; **frame 31 uses block-30.png** (same bitmap) |

Converting an SVG point to stage: `stage = parentReg + (svgPoint − svgOffset)` (no scale or rotation on these parents).

All per-frame stage-space data (hoep matrices and corners, gutter matrix/corners/params, gravity, hill/hole/sandpatch, which files) is also in **`public/demos/block/block-frames.json`**. That file was generated from the SWF, so prefer it over retyping the table below.

## Per-frame state (sprite 225, frames 2–31)
Matrices are [a,b,c,d,tx,ty], stage space, with x'=a·x+c·y+tx and y'=b·x+d·y+ty (same as canvas `setTransform`). The hoep squares are skewed parallelograms (local −34…34). The gutter has no skew: local box 0…200 × 0…25, push direction = `rot`. "grav" is the direction gravity applies when not pushing.

| f | grav | hoepback [a,b,c,d,tx,ty] | hoep2 [a,b,c,d,tx,ty] | pushgutter x, y, scaleX, scaleY, rot (= push dir) | gutter strength/pushStrength | wall | other objects |
|---|---|---|---|---|---|---|---|
| 2 | -1 | [1.465713, -0.953873, 0.462448, 0.612091, 66.5, 57.85] | [0.947189, -0.616516, 0.192291, 0.295425, 108.8, 74.1] | — | — | y | Hill sandpatch hint |
| 3 | -1 | [1.415344, -0.921112, 0.474365, 0.63887, 70.15, 57.25] | [0.946976, -0.616394, 0.213898, 0.328613, 111.6, 76.0] | 115.3,115.85, 0.5098, 2.403, -151.44° | 0/1 | y |  |
| 4 | -1 | [1.365036, -0.888336, 0.485855, 0.665878, 74.0, 56.75] | [0.946732, -0.616272, 0.235489, 0.361755, 114.5, 78.1] | 117.05,119.25, 0.511, 2.4949, -149.17° | 0/1 | y |  |
| 5 | -1 | [1.314667, -0.855591, 0.499237, 0.691483, 77.7, 56.15] | [0.946442, -0.61615, 0.257111, 0.394928, 117.35, 80.15] | 118.7,122.45, 0.5128, 2.5901, -146.89° | 0/1 | y |  |
| 6 | -1 | [1.264343, -0.82283, 0.51001, 0.718918, 81.45, 55.6] | [0.946182, -0.616058, 0.278717, 0.428101, 120.2, 82.1] | 120.05,125.65, 0.5147, 2.6854, -144.42° | 0/1 | y |  |
| 7 | -1 | [1.214004, -0.790054, 0.522797, 0.744873, 85.05, 55.1] | [0.947495, -0.616623, 0.300674, 0.462006, 123.0, 84.1] | 121.55,128.6, 0.5173, 2.7851, -142.12° | 3/3 | y |  |
| 8 | -1 | [1.16362, -0.757294, 0.532791, 0.772736, 88.85, 54.55] | [0.946228, -0.616058, 0.307724, 0.472641, 126.0, 86.55] | 122.4,130.4, 0.518, 2.8456, -140.62° | 3/3 | y |  |
| 9 | -1 | [1.113296, -0.724548, 0.542389, 0.800812, 92.6, 54.05] | [0.946533, -0.616196, 0.315124, 0.484055, 129.0, 89.1] | 123.0,132.3, 0.5195, 2.9106, -138.91° | 3/3 | y |  |
| 10 | -1 | [1.062973, -0.691788, 0.554245, 0.827286, 96.3, 53.45] | [0.946838, -0.616348, 0.32251, 0.495438, 132.0, 91.55] | 123.95,134.15, 0.521, 2.9757, -137.38° | 3/3 | y |  |
| 11 | -1 | [1.012619, -0.659012, 0.563065, 0.855713, 100.0, 52.95] | [0.947159, -0.616486, 0.329895, 0.506836, 135.0, 94.1] | 124.65,135.85, 0.5225, 3.0407, -135.86° | 3/3 | y |  |
| 12 | -1 | [0.964355, -0.626266, 0.57431, 0.88443, 103.75, 52.4] | [0.949509, -0.616623, 0.337296, 0.519348, 138.0, 96.55] | 125.1,137.55, 0.5241, 3.1058, -134.14° | 3/3 | y |  |
| 13 | -1 | [0.960587, -0.625153, 0.53093, 0.821701, 109.55, 55.2] | [0.941238, -0.624481, 0.321625, 0.484756, 143.2, 100.15] | 125.7,139.2, 0.5265, 3.1763, -132.63° | 3/3 | y |  |
| 14 | +1 | [0.958862, -0.624039, 0.490433, 0.759018, 115.25, 57.9] | [0.934921, -0.632294, 0.30542, 0.451584, 148.5, 103.65] | 125.7,139.2, 0.5265, 3.1763, -132.63° | 3/3 | y |  |
| 15 | +1 | [0.957108, -0.62291, 0.449921, 0.696335, 121.1, 60.6] | [0.930038, -0.6409, 0.289032, 0.419434, 153.65, 107.3] | 139.3,15.05, 0.5262, 3.1749, 54.89° | 3/3 | y |  |
| 16 | +1 | [0.955383, -0.62178, 0.409439, 0.633682, 126.9, 63.3] | [0.997925, -0.700882, 0.38588, 0.549408, 158.15, 111.7] | 145.25,21.3, 0.5261, 3.162, 55.66° | 3/3 | y |  |
| 17 | +1 | [0.95369, -0.620651, 0.368958, 0.570999, 132.65, 66.0] | [1.066361, -0.763, 0.485397, 0.678391, 162.7, 116.1] | 151.2,27.4, 0.5269, 3.1542, 56.41° | 3/3 | — |  |
| 18 | +1 | [0.95192, -0.619553, 0.32843, 0.508316, 138.5, 68.75] | [1.133758, -0.826355, 0.587219, 0.805649, 167.35, 120.45] | 157.15,33.4, 0.5284, 3.1511, 57.15° | 3/3 | — |  |
| 19 | +1 | [0.95224, -0.618393, 0.289383, 0.445633, 144.25, 71.5] | [1.201889, -0.892532, 0.692474, 0.932556, 171.75, 124.85] | 164.9,37.95, 0.5317, 3.1218, 60.15° | 3/3 | — |  |
| 20 | +1 | [0.950195, -0.618408, 0.282715, 0.437561, 149.2, 75.9] | [1.199905, -0.907455, 0.695343, 0.919479, 174.15, 129.4] | 172.45,42.4, 0.5357, 3.0972, 62.93° | 3/3 | — |  |
| 21 | +1 | [0.950195, -0.618408, 0.277496, 0.429489, 154.1, 80.2] | [1.19957, -0.92395, 0.699188, 0.907776, 176.6, 134.05] | 180.3,47.1, 0.5398, 3.0727, 65.91° | 3/3 | — |  |
| 22 | +1 | [0.950211, -0.618408, 0.272278, 0.421417, 159.0, 84.6] | [1.199051, -0.940552, 0.702942, 0.896133, 178.95, 138.65] | 187.85,51.8, 0.5439, 3.0482, 68.7° | 3/3 | — |  |
| 23 | +1 | [0.950211, -0.618393, 0.267075, 0.413345, 163.9, 88.95] | [1.198257, -0.957184, 0.706482, 0.88443, 181.45, 143.2] | 195.55,56.75, 0.548, 3.0237, 71.67° | 3/3 | — |  |
| 24 | +1 | [0.950211, -0.618393, 0.261841, 0.405258, 168.8, 93.4] | [1.197357, -0.973938, 0.709915, 0.872757, 183.9, 147.85] | 203.1,61.75, 0.5521, 2.9993, 74.46° | 3/3 | — |  |
| 25 | +1 | [0.950226, -0.618423, 0.256638, 0.397186, 173.8, 97.75] | [1.196182, -0.990692, 0.713181, 0.861115, 186.3, 152.4] | 210.85,66.9, 0.5562, 2.9749, 77.43° | 3/3 | — |  |
| 26 | +1 | [0.950195, -0.618408, 0.252686, 0.38829, 178.7, 102.1] | [1.19484, -1.007492, 0.716293, 0.849457, 188.7, 156.95] | 218.35,72.0, 0.5603, 2.9505, 80.22° | 3/3 | — |  |
| 27 | +1 | [0.95224, -0.618393, 0.247452, 0.381042, 183.55, 106.5] | [1.193131, -1.028488, 0.722153, 0.837708, 191.25, 161.55] | 225.8,77.4, 0.5646, 2.9273, 83.01° | 3/3 | — |  |
| 28 | +1 | [0.950226, -0.618393, 0.220657, 0.341537, 185.35, 110.2] | [1.193131, -1.028488, 0.722153, 0.837708, 191.25, 161.55] | — | — | — | Hole sandpatch |
| 29 | +1 | [0.95224, -0.618393, 0.196121, 0.302002, 187.2, 113.9] | [1.193131, -1.028488, 0.722153, 0.837708, 191.25, 161.55] | — | — | — | Hole sandpatch |
| 30 | +1 | [0.95224, -0.618393, 0.196121, 0.302002, 187.2, 113.9] | [1.193131, -1.028488, 0.722153, 0.837708, 191.25, 161.55] | — | — | y | Hole sandpatch hint |
| 31 | +0 | [0.95224, -0.618393, 0.196121, 0.302002, 187.2, 113.9] | [1.193131, -1.028488, 0.722153, 0.837708, 191.25, 161.55] | — | — | y | Hole sandpatch hint |

Frame 14 re-creates the gutter with the same transform as frame 13. From frame 15 the gutter flips to push the cursor down-right, the way the cube is falling. Frame 1 exists but is never displayed (its script immediately jumps to 2). Frames 32 and higher are unreachable (clamped to 31).

## Scripts (exact logic)
Sprite 225, frame 1:
```
pushing = false
function setBlock(dir):
    frame = min(31, max(2, currentFrame + dir))
    gotoAndStop(frame)                         // sprite 225 itself
    blokbovenvlak.gotoAndStop(frame); rougharea.gotoAndStop(frame); blockframe.gotoAndStop(frame)
    blokjesshade.gotoAndStop(frame);  blokjes.gotoAndStop(frame)   // all six timelines stay in lockstep
function pushBlock(dir):    if (pushing)        setBlock(dir)
function gravityPush(dir):  if (pushing == false) setBlock(dir)
setBlock(1)                 // → frame 2 immediately
```
Per-tick drivers. Each one is a 2-frame movie clip: frame 1 calls the function, frame 2 does `gotoAndPlay(1)`. An AS2 goto runs the target frame's script at once, so **each call happens every tick (40 Hz)**. That reading of Flash semantics is very likely but not verified in a player.
- depth 19, sprite 73 (frames 1–13): `gravityPush(-1)`. Sprite 223 (frames 14–30): `gravityPush(+1)`. Frame 31: none.
- inside `hoepback` while it is on its "over" frame (frame 7, which holds sprite 65): `pushBlock(-1)`.
- inside `hoep2` while on "over" (frame 7, which holds sprite 70): `pushBlock(+1)`.

hoep ButtonMaker (both): on `pc_rollin` → parent `gotoAndStop("over")` (start pushing). On `pc_rollout` → `gotoAndStop(1)` (stop). `pc_mousedown` and `pc_mouseup` → `gotoAndStop(1)` too, so a click cancels the push until the cursor leaves and re-enters. Cursor style "Finger" while over, "Default" on rollout. Only `pc_rollin` starts it, so a zone that slides under a stationary cursor also counts as a roll-in.

`blokbovenvlak` (top face) listeners, attached in onClipEvent(load):
```
pc_rollin   → cursor.gotoAndStop("finger"); pushing = true
pc_rollover → cursor.gotoAndStop("finger"); pushing = true      // fires every tick while inside
pc_rollout  → cursor.gotoAndStop("arrow");  pushing = false
pc_mousedown / pc_mouseup → cursor.gotoAndStop("finger")
```
Port as a state machine with `f ∈ [2,31]`, evaluated once per 40 Hz tick:
```
pushing = cursor inside topface(f)
if pushing: f += (hoep2Over ? +1 : 0) + (hoepbackOver ? -1 : 0)   // each call clamps to [2,31]
else:       f += gravity(f)        // -1 for f≤13, +1 for 14≤f≤30, 0 for f=31 (2 stays put via clamp)
then swap every per-frame layer/force to frame f (a new gutter instance each frame)
```
hoepback and hoep2 abut along the line that splits the top face: hoep2 is the strip along the top face's right edge, hoepback the rear/left part (they overlap by ≈1–2 px). If the cursor is on the top face but in neither zone, the cube freezes. Engine order within a tick (forces vs. frame change) is not significant at this resolution.

## Assets (`public/demos/block/`)
| file | source | registration / placement |
|---|---|---|
| `background.jpg` | bitmap 157 (via shape 158) | 256×256, top-left at stage (0.1, 0.65) |
| `block-02.png` … `block-30.png` | bitmaps 161, 165, 167 … 219 (frame f≥3 → bitmap 159+2f) | 200×200, top-left at stage (23.3, 12.4) |
| `shadow.svg` | shape 159 | offset (88.45, 50.25); registration at stage (122.45, 155.3) |
| `hint-arrow.svg` | shape 163 | offset (−0.65, −0.95); matrices above |
| `topface-NN.svg`, `wall-NN.svg`, `sand-NN.svg`, `sandpatch.svg` | sprites 153, 91, 122, shape 154 | see hit-geometry table. Never drawn |
| `block-frames.json` | generated | per-frame stage data |

Toolkit classes used: PC_Engine, PC_ArrowCursor, PC_Pushgutter, PC_Hill, PC_Hole, PC_ButtonMaker, PC_WallMaker, PC_SandMaker, PC_EventDispatcher. Do not draw any toolkit graphics (hill/hole discs, gutter blocks and arrows): in the original they sit under the opaque background.

## Uncertainties
- **Gutter mask**: depth 11 masks the gutter to the top-face polygon. Flash's `hitTest(x,y,true)` is believed to ignore masks, so the original gutter probably pushes over its whole rectangle, which extends past the top face. Port it unmasked unless it feels wrong. Clipping it to `topface-NN` is the alternative.
- **Walls** are 2 px stroke lines checked only at the cursor's destination point (PC_Engine wall loop). Fast mouse moves can jump across them, and that is original behaviour. Frame 2's wall fully encloses the cube, so the cursor reaches the top face either by a fast jump or by sliding along the edges.
- The 40 Hz "every tick" rate of the 2-frame drivers (see Scripts).

## Verification
- At rest the cube sits upper-left with a dark shadow to its lower right and an orange glow below it. After about 0.6 s a small red arrow with a brown glow starts pulsing on the top face, pointing to the right edge.
- Moving onto the top face turns the cursor into a finger. It is slightly sticky (sand) and drawn gently toward the face centre (Hill −1). Moving slowly into the cube's side edges, the cursor catches on them (walls).
- Push the cursor to the right edge of the top face: the cube tilts right, one step per tick (a full roll takes about 0.75 s). The cursor is shoved back up-left, gently at first (push 1, frames 3–6), then harder (push 3 plus gutter pull, frames 7+).
- Leave the face before the cube is halfway over: it drops back upright (≈0.3 s). Past halfway (frame 14+) it keeps falling to the right on its own. The cursor is pushed down-right with it, ends on the side face now pointing right, and is caught by a small Hole at ≈(186,144). The arrow reappears pointing back up-left.
- From the fallen state the Hole centre (186,144) lies in hoep2 (the lower part of that face), so the cube stays at 31. Moving the cursor up into the hoepback band (the face's upper part, above the line ≈(161.5,145)→(226,103)) rolls it back one step per tick. It returns all the way upright only if pushed back past frame 13, otherwise it falls over again.
