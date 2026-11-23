# maze — "Maze"

Source: `maze.swf` (SWF v8, AS2). Decompiled from `$SCRATCH/out/maze`.

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 700 | 500 | `#333333` | 25 |

Standalone: `Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

examplelist description: *"This simple maze example shows how to use a wall object."*

**What you experience:** a red maze (≈395x281 px) in the upper-left area of the stage. The red strokes are **walls**: the PowerCursor cannot pass through them and slides along them. The maze has an opening on the left side (around stage y 222–246) and another on the right side (around y 208–238). Inside the maze's outer bounding box, an invisible **Slick** area makes the cursor slightly slippery (it keeps momentum a little longer). On entering it the cursor turns into a **Ball** and the toolkit sound `"frantic"` plays. Leaving it restores the Arrow.

## Imports (toolkit classes)

| char id | class |
|---|---|
| 3 | `PC_System.PC_Engine` |
| 4 | `PC_Objects.PC_Slick` |
| 6 | `PC_Behaviours.PC_WallMaker` |
| 8 | `PC_Cursors.PC_ArrowCursor` |

## Display list (stage space, px)

Main timeline: frame 1 places Engine, Slick and maze. Frame 2 places the Cursor and calls `stop()`. Frame 3 is empty and never reached.

| depth | node | x | y | scaleX | scaleY | rot | alpha | renders with | notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 (f1) | **PC_Engine** | 562 | 420 | 1.0 | 1.0007629 | 0 | 1 | toolkit (hidden at runtime) | moved to (561.65, 419.95) on f2; irrelevant |
| 6 (f1) | **PC_Slick** | 122.6 | 56 | 3.9036713 | 2.792511 | 0 | **0** (colorTransform alphaMult 0/256) | toolkit, invisible | 100x100 symbol → 390.37 x 279.25 px, covering x 122.6–512.97, y 56–335.25 |
| 10 (f1) | **maze** (sprite 7, instance name `maze`) | -30.2 | -34.5 | 1.0280151 | 1.0280151 | 0 | 1 | container | |
| ├ 1 | maze walls art (shape 5) | 120.918 | 55.092 | 0.666729 | 0.666729 | 0 | 1 | `maze-walls.svg` | composed: -30.2 + 1.0280151·147, -34.5 + 1.0280151·87.15; scale 1.0280151·0.6485596. Rendered size 394.74 x 281.29 px → x 120.92–515.65, y 55.09–336.38 |
| └ 2 | PC_WallMaker (child of `maze`) | 510.54 | 149.51 | 1.0280151 | 1.0280151 | 0 | 1 | none (icon `graphics` is unloaded at runtime) | makes its parent `maze` a wall. Its position is irrelevant |
| 13 (f2) | **PC_ArrowCursor**, instance name `PC_Cursor` | 392.5 | 84 | 1 | 1 | 0 | 1 | toolkit | |

Local (in-sprite) transforms, for reference: shape 5 is at (147, 87.15) with scale 0.6485596 inside `maze`. WallMaker is at (526, 179), unscaled, inside `maze`.

### Toolkit parameters (`on(construct)`)

**PC_Engine (depth 1):** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=false, hideAllObjects=false`

**PC_ArrowCursor `PC_Cursor` (depth 13):** `cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true, minHeight=0, minWidth=0`

**PC_Slick (depth 6):** `strength=0.1, style="Square", tint=14492708 (#DD2424), directionDependency="None", dirDepAngle=0, rolloverCursorStyle="Ball", rolloverCursorSound="frantic", visible=true, minHeight=0, minWidth=0`
- Per PC_Slick.applyForce: `surfaceGrip = 1 - |0.1| / (0.1 + 2) ≈ 0.95238` while inside.
- The `style="Square"` visual (a tinted square) would be drawn, but the instance's alpha is 0, so nothing shows. Hit testing still works.

**PC_WallMaker (maze/depth 2):** `rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`. On load it calls `PC_Engine.addWall(targetPath(maze))`. The wall shape is exactly the red fill of `maze-walls.svg`, transformed as above. The WallMaker library symbol contains only its `graphics` icon, which is unloaded, so the behaviour adds nothing to the hit shape.

## Timelines / state

Static: no state changes, no event handlers. The only scripts are:

```
frame 1: if (this == _root) { Stage.scaleMode = "noScale"; Stage.align = "TL"; }
         if (_root != this) stop();   // when hosted inside another SWF, stays on frame 1
frame 2: stop();
```

## Assets — `/public/demos/maze/`

| file | source | intrinsic size | registration offset (tx,ty) | use |
|---|---|---|---|---|
| `maze-walls.svg` | shape 5 | 592.05 x 421.9 | (0, 0) | the visible maze and the wall hit-shape. Draw at stage (120.918, 55.092) scaled 0.666729 |

Solid red `#ff0000`, a single even-odd path. Corridors are holes in the fill.

## Unusual / notes

- **No demo sounds.** `sounds/-1.wav` is an empty 44-byte stream header. The only sound is the toolkit's `"frantic"` rollover sound on the Slick. It loops while the cursor is inside and stops on rollout. Its volume is driven by cursor movement (PC_Cursor.displace); that is engine behaviour.
- The Slick sits *under* the maze art (depth 6 < 10) and is invisible (alpha 0). Its rectangle is about 1.7 px inside the maze's outer bounding box on every side. It covers the walls as well as the corridors, but the cursor can only be in corridors.
- Unused exported symbol `bol (MC)` (gradient ball, template leftover). Ignore it.
- No text, links or video.
- The JPEXS frame render shows a faint light bevel on the red walls. That is a rendering artefact: the shape is a single flat `#ff0000` fill with no stroke.

## Verification

1. A 700x500 #333 canvas with a red maze spanning roughly (121,55)–(516,336).
2. The cursor cannot cross any red stroke. Pushing into a wall makes the cursor slide along it, and the real mouse keeps moving while the visible cursor stays blocked.
3. You can enter through the gap on the left edge (y ≈ 222–246) and exit through the gap on the right edge (y ≈ 208–238).
4. Inside the maze's bounding box the cursor is a Ball, the "frantic" sound plays on entry, and motion is slightly slippery. Outside, it is an Arrow.
5. The real OS cursor is hidden.
