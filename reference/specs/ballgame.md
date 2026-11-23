# Demo spec: `ballgame` ("Ball Game")

Source: `ballgame.swf` (from `ballgame.fla`, 2008-02-09). Decompiled in `$SCRATCH/out/ballgame/`.
Examplelist description: "Virtual version of the well known ball game requiring patience and coordination. Can you get the two balls in the two holes?"
(The SWF metadata title wrongly says "Pocket + Tunnel"; it was copied from the other demo.)

## Stage

| | |
|---|---|
| Size | 450 x 450 px |
| Background | `#333333` |
| Frame rate | 25 fps |
| Main timeline | 7 frames: frames 5-6 loop for ever (see below) |
| Stage mode | `Stage.scaleMode = "noScale"; Stage.align = "TL"` (only when `_root`) |

## What the user experiences

This is a virtual version of the hand-held dexterity puzzle: a red square board with a raised red ring around a recessed blue round dish, two small black holes in the dish, and two grey ball bearings.

- **There is no arrow cursor.** The OS cursor stays visible (`hideRealCursor=false`).
- The two balls are **BallCursors**. Both are linked to the mouse with *mouse movement as force*, so moving the mouse pushes **both balls together in the same direction**, like tilting the board. They have inertia, keep rolling, and slow down.
- The dish is **slick** (low surface grip), so the balls slide a long way.
- A faint dome in the middle of the dish nudges the balls outward.
- A strong rim field beyond about 86 px from the centre pushes them back in.
- The balls **bounce off each other**.
- Each hole has a small raised lip that pushes balls away, and inside the lip a pull that captures a ball once it gets over the lip. Rolling into a hole plays the toolkit `pop` rollover sound.
- **Win**: when the two holes each hold a ball (a hole counts after its ball has stayed inside for 4 frames), both dish discs animate from blue through white to yellow (`#ffcc00`) and stay yellow. If a ball later leaves a hole, the dish snaps back to blue at once.

## Toolkit instance parameters

**PC_Engine** (main depth 1, frame 1, at (312, 392), scaleY 1.0007629; invisible; frame 2 moves it to (311.65, 391.95)):
`bouncingBalls=true, hideRealCursor=false, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=false, hideAllObjects=false`

**PC_BallCursor** `ball1` and `ball2` (placed on main frame 4), identical on(construct):
`grip=50, inertia=10, tint=10066329 (#999999), visible=true`

Values that are **not** in on(construct) but come from the class defaults:
- `isBall=true`
- `mouseLink=true` (PC_BallCursor overrides PowerBall's `false`)
- **`mouseAsForce=true`** (from PC_PowerBall; the BallCursor has no inspectable that turns it off)
- `surfaceGrip` resets to 1 each frame

Ball art is the toolkit `PC_Ball_Disc` + shading: a disc about 19.5 px in diameter centred on the registration point. The tint is applied to the disc only, and `draw()` forces xscale = yscale. Collision radius in the engine: two balls touch when `dist < (b1._xscale + b2._xscale)/10` = **20 px** at 100 % scale. Hardness is 0.9 and mass is (xscale/100)², so the two balls are equal.

## Display list (stage pixels, depth order, bottom to top)

All transforms have rotation 0 and alpha 1. Sizes are diameters.

### Main timeline

| Depth | Frame placed | Element | Instance name | Transform (stage) | Result / parameters |
|---|---|---|---|---|---|
| 1 | 1 | PC_Engine | (none; the class renames itself `PC_Engine`) | (312, 392) | invisible; parameters above |
| 6 | 1 | **PC_Hole** (big rim field) | (none) | (63, 18), scale 3.3200073 | AABB (63, 18)-(395, 350), 332 px, centre **(229, 184)**. `strength=20, shape="U-shaped", plateauDiameter=52` (force-free radius 26 local = **86.32 px**), `style="None", tint=#DD2424, rolloverCursorSound="", rolloverCursorStyle="Null", visible=true` |
| 12 | 1 | **PC_Hill** (outer push) | (none) | (63, 18), scale 3.3200073 | Same box and centre (229, 184). `strength=10, shape="U-shaped", plateauDiameter=80` (force-free radius **132.8 px**), `style="None", tint=#DD2424, rolloverCursorSound="", rolloverCursorStyle="Null"`. In practice it is almost never reached: see the clamp below. |
| 18 | 1 | **Slick dome clip** (sprite 7) | (none) | (143, 100) | Children: |
| 18 > 1 | | **PC_Hill** (central dome) | (none) | local (0, 2), scale 1.699997, so stage (143, 102)-(313, 272) | 170 px, centre **(228, 187)**. `strength=2, shape="U-shaped", plateauDiameter=15` (flat radius 12.75 px), `style="Disc with shading", tint=14492708 (#DD2424), rolloverCursorSound="puff", rolloverCursorStyle="Null", visible=true`. Its red disc art is **covered** by the board square (depth 26), so it is never seen. |
| 18 > 7 | | **PC_SlickMaker** (behaviour; parent = sprite 7) | (none) | local (131, 27) (icon unloaded) | `strength=2, directionDependency="None", dirDepAngle=0`. Hit area = sprite 7's drawn art ≈ the hill disc, r 85 px around (228, 187). Effect while a ball is over it: `surfaceGrip = 1 - |2|/(2+2) = 0.5`. |
| 26 | 1 | `board-square.svg` (shape 8) | (none) | registration (230, 239.8), scale 0.6875 | Red `#ff0000` square, stage x 54-406, y 15-367 (352x352) |
| 27 | 1 | `border-disc.svg` (sprite 10) | `border` | (229, 189), scale 1 | Red `#ff0000` disc, **r = 121.97**, centre (228.97, 188.97). **BevelFilter**: type *full* (onTop=true), angle 45°, distance 5, blurX/Y 39, strength 2.6367188, highlight `#ffffff` α1, shadow `#000000` α1, quality 3. |
| 31 | 1 | `playingfield-disc.svg` (sprite 15) | `playingfield` | (135, 94), scale 1.5762787 | Disc **186.00 px**, centre **(228.0, 187.0)**, colour animated (below). **BevelFilter**: type *inner*, angle 225°, distance 3, blur 5, strength 1.0, highlight white, shadow black, quality 3. |
| 33 | 1 | `playingfield-disc.svg` (sprite 15) | `playingfieldtop` | (140, 99), scale 1.4911346 | Disc **175.95 px**, centre (227.98, 186.98), colour animated (below). **BevelFilter**: type *inner*, angle 45°, distance 14, blur 40, strength 0.796875, highlight white, shadow black, quality 3. |
| 35 | 1 | **Hole assembly** (sprite 18) | `hillhole` | (174.55, 202.5) | Children in the next section. **BevelFilter**: type *outer*, angle 45°, distance 2, blur 12, strength 1.0078125, white/black, quality 3. |
| 49 | 1 | **Hole assembly** (sprite 18) | `hillhole2` | (211.55, 223.5) | Same as `hillhole`, but bevel strength **1.1875** |
| 63 | 4 | **PC_BallCursor** | `ball1` | (213.25, 211.75) | parameters above |
| 67 | 4 | **PC_BallCursor** | `ball2` | (236.3, 236.75) | parameters above |

Bevel angles are stored in radians (0.7853851 = 45°, 3.9269867 = 225°). Flash measures the angle clockwise from +x in screen coordinates. Filters do not change `_width`/`_height`.

### Hole assembly (sprite 18), used twice

Local coordinates, then stage coordinates for `hillhole` at (174.55, 202.5) and for `hillhole2` at (211.55, 223.5).

| Depth | Element | Local transform | hillhole stage | hillhole2 stage | Parameters / notes |
|---|---|---|---|---|---|
| 1 | **PC_Hole** `hole` | (0, 1), scale 0.1802826 (18.03 px) | centre (183.56, 212.51) | centre (220.56, 233.51) | `strength=9, shape="U-shaped", plateauDiameter=3, style="Disc", tint=0 (#000000), rolloverCursorSound="", rolloverCursorStyle="Null", visible=true`. **Visible**: a black 18 px toolkit disc. |
| 7 | **PC_Hill** (lip) | (-10, -10), scale 0.3799591 (38.0 px) | centre (183.55, 211.5) | centre (220.55, 232.5) | `strength=3, shape="U-shaped", plateauDiameter=20` (flat radius 3.8 px), `style="None", tint=#DD2424, rolloverCursorSound="", rolloverCursorStyle="Null"` |
| 13 | **Hole sensor** (sprite 17) | (2, 2) | dot box (176.55, 204.5)-(190.5, 218.45), centre (183.53, 211.48) | box (213.55, 225.5)-(227.5, 239.45), centre (220.53, 232.48) | Art = `hole-dot.svg`: a black disc 13.95 px (sprite 15 at scale 0.118621826, colour transform RGB×0 = black). Child **PC_ButtonMaker** at (4, 33): `outframe="out", overframe="over", downframe="over", upframe="over", rolloverCursorSound="pop", rolloverCursorStyle="Default", visible=true`. Hit area = the dot (r ≈ 6.98), tested against the ball **centre**. |

Net feel of one hole:
- The lip hill pushes outward everywhere within 19 px of the centre, except inside 3.8 px.
- The hole pulls inward within 9 px, with a much steeper slope per stage pixel (local units are scaled 1/0.18 vs 1/0.38).
- So a ball must be pushed over the lip, and is then captured.

## Scripts (pseudocode, numbers exact)

```
// ---- main frame 1 ----
function KeepBallsInGame() {
    ball1.x = clamp(ball1.x, xmin, xmax);  ball1.y = clamp(ball1.y, ymin, ymax);
    ball2.x = clamp(ball2.x, xmin, xmax);  ball2.y = clamp(ball2.y, ymin, ymax);
}
function ballInside(i) {                    // i = +1 or -1
    ballinholes = max(0, ballinholes + i);
    if (ballinholes == 2) { playingfield.gotoAndPlay(2); playingfieldtop.gotoAndPlay(2); }   // win
    if (ballinholes <  2) { playingfield.gotoAndStop(1); playingfieldtop.gotoAndStop(1); }   // back to blue
}
if (this == _root) { Stage.scaleMode = "noScale"; Stage.align = "TL"; }
xmin = playingfield._x;                      // 135
xmax = playingfield._x + playingfield._width;   // 135 + 118*1.5762787 = 321.0009
ymin = playingfield._y;                      // 94
ymax = playingfield._y + playingfield._height;  // 280.0009
ballinholes = 0;

// ---- main frame 3 ----
if (_root != this) gotoAndPlay(_currentframe - 1);   // embedded in the shell: loops frames 2-3 and never places the balls
// standalone: falls through to frame 4, where ball1 and ball2 are placed

// ---- main frame 6 ----
KeepBallsInGame();
gotoAndPlay(5);           // frames 5 -> 6 -> 5 ...: the clamp runs every 2nd frame (12.5 Hz), after the engine moved the balls

// ---- hole sensor (sprite 17), 10 frames, labels: "out" = frame 2, "over" = frame 4 ----
frame 1: inside = false; stop();
frame 2 "out":  if (inside == true)  { _root.ballInside(-1); inside = false; }  trace("inside:" + name + " " + inside); stop();
frame 4 "over": play();                       // frames 5, 6, 7 are empty
frame 8:        if (inside == false) { _root.ballInside(+1); inside = true; }   trace(...); stop();
// frames 9-10 are unreachable

// ---- the ButtonMaker on the sensor (toolkit behaviour, with this demo's parameters) ----
on construct:            sensor.gotoAndStop("out")   // runs frame 2: inside is not true, so nothing happens
pc_rollin  (ball i):     engine.setCursorStyle("Default", i) /* no-op for balls */; sensor.gotoAndStop("over")
pc_rollout (ball i):     engine.setCursorStyle("Default", i); sensor.gotoAndStop("out")
pc_mousedown / pc_mouseup (mouse button while a ball centre is on the dot): sensor.gotoAndStop("over")
```

Note: `gotoAndStop("over")` runs frame 4's `play()`, so the sensor plays on and reaches frame 8 **4 frames (160 ms) later**. A ball that leaves within those 4 frames is never counted.

### Playing-field colour animation (sprite 15, both `playingfield` and `playingfieldtop`)

Frame 1 has `stop()` (blue). The win calls `gotoAndPlay(2)`, which plays to frame 20, where a `stop()` holds it. Frames 21-36 (yellow back to blue) are never reached. The shape (a 118 px circle) stays the same; only the fill colour changes:

| Frame | 1-5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | **20 (hold)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fill | `#0099cc` | `#20a6d2` | `#40b3d9` | `#60bfdf` | `#80cce6` | `#9fd9ec` | `#bfe6f2` | `#dff2f9` | `#ffffff` | `#fff8db` | `#fff0b6` | `#ffe992` | `#ffe26d` | `#ffdb49` | `#ffd324` | `#ffcc00` |

The sequence is: blue for 4 frames, linear fade to white over frames 5-13, linear fade to yellow over frames 13-20, then hold. Total 0.76 s.

## Behaviour details and edge cases to keep

- **Ball clamp**: the bounds are the playing field's bounding **square** (135..321.0009, 94..280.0009), not the disc. Balls can sit in the square's corners over the red ring. The clamp runs only on every second frame, after the engine step.
- **Rim field**: the big Hole (centre (229, 184), flat inside r = 86.32) pulls balls back towards the dish once they pass about r = 86. The dish edge is at r = 93 around (228, 187). The big Hill (push beyond r = 132.8) is reachable only in the extreme clamp corners (the corner (135, 280) is 134.4 px from (229, 184)).
- **Slick + mouseAsForce**: over the slick disc, `surfaceGrip = 0.5`. The engine's speed decay becomes `(1 - 50/100)^0.5` per 50 ms of frame time instead of `0.5`. In addition, because `mouseAsForce` is on, an extra force of `MouseMov * (100/baseForce) * (1 - surfaceGrip)` = 0.5 × the mouse movement is added after the step (the engine's "gripPush").
- **Mouse as force** (both balls): each frame the engine does `addForce(i, MouseMovX*100/baseForce, MouseMovY*100/baseForce)`. Like all forces this is scaled by `5/inertia` = 0.5 inside `addForce`, then added to speed. Both balls get the same push. The OS cursor position itself does not matter; only its movement does.
- **Speed limit** `"high speed"` (preset 50) applies because the balls are mouse-linked (`__mouselink=true`). When the engine's measured mouse speed (`numDst`, the average mouse movement per frame over the last 5 frames) is above 50 px, it displaces each ball rigidly by the raw mouse movement instead of the force result. This is engine behaviour, but it is noticeable here: a fast flick drags both balls with the mouse.
- **Hole counting quirks** (one `inside` flag per hole, events per ball):
  - Two balls in the same hole count once.
  - If one ball rolls into a hole that already holds the other, nothing changes.
  - If either ball then leaves, the hole's `pc_rollout` decrements the count, although the other ball is still in. That ball is not recounted until it leaves the dot and re-enters it.
  - `ballinholes` is clamped at ≥ 0.
- **Sounds** (toolkit library sounds, looped by `PC_Cursor.setCursorSound`; volume starts at strength×10, or 50 when the object has no strength, and then follows displacement):
  - `"puff"`: rolling onto the central dome Hill (strength 2, so initial volume 20).
  - `"pop"`: rolling onto a hole sensor (no strength, so 50).
  - Each object's `pc_rollout` stops the sound (`"Null"`).
  - Objects with `""` call `setCursorSound("")`, which stops the current sound when they roll in.
- `rolloverCursorStyle` values have no effect, because BallCursors have no styles.
- The real cursor is visible (`hideRealCursor=false`), and nothing hides it.

## Assets (`public/demos/ballgame/`)

| File | Source | SVG size | Registration offset (tx, ty) | Placement |
|---|---|---|---|---|
| `board-square.svg` | shape 8 | 512x512 | **(256, 327)** | registration at stage (230, 239.8), scale 0.6875 |
| `border-disc.svg` | sprite 10 frame 1 (red square clipped by the circle mask) | 512x512 | **(256, 327)** | registration at (229, 189), scale 1. The visible disc is r 121.97 around the registration point. Apply the full bevel in the port. |
| `playingfield-disc.svg` | shape 14 (the 118 px circle, `#0099cc`; the same geometry as the morph shapes 9/11/12/13) | 118x118 | (0, 0) | `playingfield` (135, 94) ×1.5762787 and `playingfieldtop` (140, 99) ×1.4911346. Recolour it per the frame table, or draw a circle. |
| `hole-dot.svg` | sprite 17 frame 1 | 13.95x13.95 | (0, 0) | inside each hole assembly at local (2, 2) |

All four are plain filled circles or squares, so the port may draw them procedurally instead. The bevel filters must be recreated (SVG filter, or canvas shadow/gradient approximation) from the parameters above.

Toolkit symbols that are not copied: PC_Engine, PC_BallCursor ×2, PC_Hole ×3, PC_Hill ×4, PC_SlickMaker, PC_ButtonMaker ×2, and the sounds `puff` and `pop`. The PC_Hole `hole` in each assembly is **visible** (style "Disc", black), so the engine must render that style.

## Unusual or unresolved

1. JPEXS's `frames/*.png` renders are wrong for this file. They draw the masked `border` disc as an off-centre red ball near the top-left, so don't trust them. `$SCRATCH/dl/ex/ballgame.gif` (the original thumbnail) confirms the layout described here: red board, bevelled red ring, blue dish, two black holes, two grey balls.
2. Unused symbol `bol (MC)` (sprite 2, a 114 px white-to-black gradient ball) is exported but never placed. The `-1.wav` is an empty stream header. There is no text, video or link.
3. The dome Hill's "Disc with shading" art (sprite 7) is hidden under the board square. Its hit area still defines the slick region. If the engine's Hill hit area differs from its drawn disc, use a disc of r 85 around (228, 187).
4. When the demo is embedded in the example shell, the main timeline loops frames 2-3 and never places the balls (frame 3 script). The shell is presumably meant to advance it. Port the standalone behaviour.
5. Not verified in a live Flash player: the exact feel depends on the engine's Hill/Hole force formulas with these local scales. The parameters above are exact.

## Verification

- At load: red square board, bevelled red ring, recessed blue dish (a darker inner-shadow rim), two black holes at about (183.5, 211.5) and (220.5, 232.5), and two grey balls at (213.25, 211.75) and (236.3, 236.75). The OS arrow cursor is visible.
- Moving the mouse right pushes **both** balls right. They keep gliding (slick) and slowly settle. Stopping the mouse does not stop them at once.
- Balls collide and bounce when their centres come within 20 px.
- Balls never leave the dish's bounding square (135..321, 94..280). Near the dish edge they are pulled back towards the centre.
- A ball skimming past a hole is deflected by the lip. Pushed squarely, it drops in and stays (pop sound).
- With one ball resting in each hole for about 0.16 s: both dish layers fade blue → white → yellow over about 0.6 s and stay yellow. Knocking a ball out turns the dish blue again at once.
