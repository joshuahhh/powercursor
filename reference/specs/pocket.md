# Demo spec: `pocket` ("Pocket + Tunnel")

Source: `pocket.swf` (from `pocket.fla`, 2008-02-05). Decompiled in `$SCRATCH/out/pocket/`.
Examplelist description: "Try and move your cursor through the tunnel, or in the pocket. Using dynamic forcefields to create different levels."

## Stage

| | |
|---|---|
| Size | 500 x 300 px |
| Background | `#333333` |
| Frame rate | 25 fps |
| Main timeline | 4 frames, stops on frame 3 when standalone |
| Stage mode | `Stage.scaleMode = "noScale"; Stage.align = "TL"` (only when the movie is `_root`) |

## What the user experiences

There are two grey 3D-looking objects on a dark background: a horizontal **tunnel** (a cylinder with dark openings at both ends, left) and a **pocket** (a sphere with an elliptical opening on top, right). Each one is a small state machine with three states (`init`, `bobble`, `tunnel`). Which state it is in depends on where the cursor enters it.

- **Tunnel, entering from above or below** (`bobble`): the cursor rides over the round body. A negative-strength sine gutter pushes it away from the tunnel's centre line, so it "bobbles" over the cylinder. The cursor is drawn on top of the tunnel.
- **Tunnel, entering through either end opening** (`tunnel`): a hole at each mouth pulls the cursor in (with the `scratch` rollover sound). A V-shaped gutter then holds it on the tunnel's centre line. The tunnel's front image is now drawn **above** the cursor, so the cursor seems to travel *through* the tunnel and disappears behind its skin.
- **Pocket, entering from the sides or bottom** (`bobble`): a sine-shaped hill makes the cursor slide over the sphere.
- **Pocket, entering through the top opening** (`tunnel`): the cursor drops *into* the pocket. A hole pulls it towards the sphere's centre, three walls trap it in a narrow shaft, and the sphere's front image is drawn above the cursor so the cursor seems to be inside. A **pixel-art bunny** is hidden inside the pocket. Clicking on it while the cursor is over it drags it (DraggerMaker), so you can pull the bunny out through the opening. Its idle animation (blinking, ear twitches) loops all the time.
- At start (`init`) neither object has any force field. Both are flat pictures until the cursor first touches one of the trigger zones.

The trick is the **depth sandwich**. The ArrowCursor sits at depth 56, between the scene clips (depths 6 and 32) and two root-level copies of the front images (`tunnel_top` at depth 58 and `pocket_top` at depth 60). A front copy is shown only while its object is in the `tunnel` state.

## Toolkit instance parameters

**PC_Engine** (main depth 1, placed on frame 3 at (362, 246), scaleY 1.0007629; it is invisible):
`bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=false, hideAllObjects=false`

**PC_ArrowCursor** instance `PC_Cursor` (main depth 56, placed on frame 3 at (392.5, 84)):
`cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true`

## Display list (stage pixels, depth order, bottom to top)

All transforms have rotation 0, no skew and alpha 1, unless stated otherwise. "Stage AABB" is the object's 100x100 / 200x25 local box after the transform.

### Main timeline

| Depth | Frames | Element | Instance name | Transform (stage) | Notes |
|---|---|---|---|---|---|
| 1 | 3+ | PC_Engine | (none) | (362, 246) | Parameters above. Frame 4 moves it to (361.65, 245.95), but frame 4 is never reached standalone. |
| 6 | 1+ | **Pocket clip** (sprite 42) | (none) | (291.6, 76.4), scale 1 | Children in the next section. |
| 32 | 1+ | **Tunnel clip** (sprite 53) | (none) | (95.5, 84.5), scale 1 | Children below. |
| 56 | 3+ | PC_ArrowCursor | `PC_Cursor` | (392.5, 84) | Parameters above. |
| 58 | 1+ | `tunnel-front.svg` (sprite 47) | `tunnel_top` | authored at (-417, 72); the tunnel clip's frame 1 script moves it to **(95.5, 84.5)** | Starts hidden. Visible only in the tunnel's `tunnel` state. Drawn above the cursor. |
| 60 | 1+ | `pocket-front.svg` (sprite 32) | `pocket_top` | authored at (-232.5, 45); the pocket clip's frame 1 script moves it to **(291.6, 76.4)** | Starts hidden. Visible only in the pocket's `tunnel` state. Drawn above the cursor. |

### Pocket clip (sprite 42), origin at stage (291.6, 76.4)

| Depth | Frames (state) | Element | Local transform | Stage result | Parameters / notes |
|---|---|---|---|---|---|
| 1 | 7-12 (`bobble`) | **PC_Hill** | (8.3, 14.4), scale 0.82432556 | AABB (299.9, 90.8)-(382.33, 173.23), centre **(341.12, 132.02)**, 82.43 px | `strength=5, shape="Sine-shaped", plateauDiameter=0, style="None", tint=14492708 (#DD2424), rolloverCursorSound="", rolloverCursorStyle="Default", visible=true` |
| 1 | 13-19 (`tunnel`) | **PC_Hole** (replaces the Hill) | (9.3, 13.3), scale 0.82432556 | AABB (300.9, 89.7)-(383.33, 172.13), centre **(342.12, 130.92)** | `strength=3, shape="U-shaped", plateauDiameter=0, style="None", tint=#DD2424, rolloverCursorSound="scratch", rolloverCursorStyle="Default"` |
| 7 | 13-19 | **PC_Wall** (right) | (95, 96.85), scaleX -0.28987122, scaleY -0.78852844 (equivalent to rotation 180° with positive scales) | AABB x 357.61-386.60, y 94.40-173.25 | `tint=#DD2424, rolloverCursorSound="", rolloverCursorStyle="Null", visible=true` |
| 9 | 13-19 | **PC_Wall** (left) | (32.85, 96.85), same scales | AABB x 295.46-324.45, y 94.40-173.25 | same as above |
| 11 | 13-19 | **PC_Wall** (bottom) | (85.75, 104.35), scaleX -0.7696533, scaleY -0.42793274 | AABB x 300.39-377.35, y 137.96-180.75 | same as above |
| 13 | 13-19 | **PC_Slope** (see "Unusual": this class is missing from the toolkit) | (16.75, 46.6), scaleX 0.6199951, scaleY 0.5502777 | AABB (308.35, 123.0)-(370.35, 178.03) | `angle=0, strength=3, graphicsStyle="Square", tint=#DD2424, visible=true` |
| 15 | 1+ | `pocket-back.svg` (shape 4) | (0, 0) | (291.6, 76.4), 97x112 | Opaque JPEG. It covers the walls, slope and hill/hole art at depths below it, so their art is never seen. |
| 16 | 1+ | **Bunny clip** (sprite 29) | (26.65, 32.75) | n/a | Contains: |
| 16 > 1 | | bunny animation (sprite 27) | (0.35, 0.35) inside sprite 29 | image top-left **(318.6, 109.5)**, 32x32 | `bunny-01..11.png`, frame table below |
| 16 > 3 | | **PC_DraggerMaker** (behaviour; parent = sprite 29) | (40.35, 26.35) inside sprite 29 | icon is not drawn | `rolloverCursorSound="", rolloverCursorStyle="Null", visible=true`. Hit area = sprite 29's art = the 32x32 bunny square (stage (318.6, 109.5)-(350.6, 141.5)). The parent moves with the drag. |
| 20 | 1+ | `pocket-front.svg` (sprite 32), local copy | (0, 0) | (291.6, 76.4) | Instance is named **`tunnel_top_local`** (copy-paste naming). Always visible: see bug note. |
| 22 | 1+ | **Mouth trigger** (sprite 35), **alpha 0** | (-4.15, 12.85) | registration (287.45, 89.25); shape AABB x 324.45-362.45, y 85.25-107.25 | Art = `hit-pocket-mouth.svg` at (0, 0) inside. Child PC_EventDispatcher at (178, 46.25) with no on(construct) parameters. `onClipEvent(load)`: on `pc_rollin`, the pocket clip does `gotoAndPlay("tunnel")`. |
| 25 | 1+ | **Rim trigger** (sprite 37), **alpha 0** | (7.8, 13.5) | registration (299.4, 89.9); shape AABB x 276.4-408.4, y 67.9-235.9 | Art = `hit-pocket-rim.svg` at (0, 0). Child PC_EventDispatcher at (115.7, 73.25), no parameters. On `pc_rollin`, the pocket clip does `gotoAndPlay("bobble")`. The shape is a horseshoe band around the sphere's silhouette, open at the top where the mouth is. |

### Tunnel clip (sprite 53), origin at stage (95.5, 84.5)

| Depth | Frames (state) | Element | Local transform | Stage result | Parameters / notes |
|---|---|---|---|---|---|
| 1 | 1+ | `tunnel-back.svg` (shape 44) | (0, 0) | (95.5, 84.5), 133x59 | Opaque JPEG |
| 2 | 7-12 (`bobble`) | **PC_Gutter** | (16.25, 10.4), scaleX 0.500885, scaleY 1.4400177 | AABB (111.75, 94.9)-(211.93, 130.9), 100.18x36.0, centre line **y = 112.9** | `strength=-3, shape="Sine-shaped", plateauDiameter=2, graphicsStyle="None", tint=#DD2424, rolloverCursorSound="", rolloverCursorStyle="Null"`. Negative strength gives a ridge that pushes away from the centre line. |
| 2 | 13-19 (`tunnel`) | **PC_Gutter** (new instance; old one removed) | (21.4, 16.9), scaleX 0.44908142, scaleY 1.0 | AABB (116.9, 101.4)-(206.72, 126.4), 89.82x25, centre line **y = 113.9** | `strength=4, shape="V-shaped", plateauDiameter=2, graphicsStyle="None", tint=#DD2424, rolloverCursorSound="", rolloverCursorStyle="Null"` |
| 6 | 4+ (so in `bobble` and `tunnel`, not in `init`) | **PC_Hole** (left mouth) | (-7.15, 9.05), scale 0.3809967 | AABB (88.35, 93.55)-(126.45, 131.65), centre **(107.40, 112.60)**, 38.10 px | `strength=3, shape="U-shaped", plateauDiameter=0, style="None", tint=#DD2424, rolloverCursorSound="scratch", rolloverCursorStyle="Default"` |
| 12 | 4+ | **PC_Hole** (right mouth) | (101.7, 9.6), scale 0.40367126 | AABB (197.2, 94.1)-(237.57, 134.47), centre **(217.38, 114.28)**, 40.37 px | same as the left mouth |
| 18 | 1+ | `tunnel-front.svg` (sprite 47), local copy | (0, 0) | (95.5, 84.5) | Instance `tunnel_top_local`. Visible in `init`/`bobble`, hidden in `tunnel`. |
| 20 | 1+ | **Mouth trigger** (sprite 49), **alpha 0** | (-4.15, 12.85) | registration (91.35, 97.35); shape AABB x 103.35-227.2, y 97.6-127.0 | Art = `hit-tunnel-mouths.svg` at (0, 0): two blobs at the left and right openings. Child PC_EventDispatcher at (178, 46.25), no parameters. On `pc_rollin`, the tunnel clip does `gotoAndPlay("tunnel")`. |
| 23 | 1+ | **Band trigger** (sprite 51), **alpha 0** | (7.8, 13.5) | n/a | Contains `hit-tunnel-bands.svg` at **(-27.85, -40)**, so its registration is at stage (75.45, 58.0) and its AABB is x 83.95-252.45, y 68-161. Two horizontal bands, above (stage y ~68-96.5) and below (y ~131.5-161) the tunnel. Child PC_EventDispatcher at (115.7, 73.25) inside sprite 51. On `pc_rollin`, the tunnel clip does `gotoAndPlay("bobble")`. |

The PC_Hole art in the tunnel clip (style None) and the gutter art (graphicsStyle None) draw nothing visible.

## Timelines and state machines

The pocket clip and the tunnel clip have the same 19-frame structure. Labels: `init` = frame 1, `bobble` = frame 7, `tunnel` = frame 13.

```
// ---- main timeline ----
frame 1:  if (this == _root) { Stage.scaleMode = "noScale"; Stage.align = "TL"; }
          if (_root != this) stop();      // only when embedded in the example shell
frame 3:  stop();                         // engine + cursor exist from here on

// ---- pocket clip (sprite 42) ----
frame 1 "init":
    pocketX = this._x + _parent._x;  pocketY = this._y + _parent._y;   // = 291.6, 76.4
    _root.pocket_top._visible = false;
    _root.pocket_top._x = pocketX;  _root.pocket_top._y = pocketY;
    stop();
frame 7 "bobble":
    pocket_top_local._visible = true;     // BUG: no such instance (it is named tunnel_top_local), so this does nothing
    _root.pocket_top._visible = false;
    stop();
frame 12: stop();                         // unreachable
frame 13 "tunnel":
    pocket_top_local._visible = false;    // BUG: does nothing (same naming issue)
    _root.pocket_top._visible = true;
    // keeps playing ...
frame 19: stop();

// ---- tunnel clip (sprite 53) ----
frame 1 "init":
    tunnelX = this._x + _parent._x;  tunnelY = this._y + _parent._y;   // = 95.5, 84.5
    _root.tunnel_top._visible = false;
    _root.tunnel_top._x = tunnelX;  _root.tunnel_top._y = tunnelY;
    stop();
frame 7 "bobble":
    tunnel_top_local._visible = true;  _root.tunnel_top._visible = false;
    trace("bobble"); stop();
frame 13 "tunnel":
    tunnel_top_local._visible = false; _root.tunnel_top._visible = true;
    trace("tunnel");                      // plays on to frame 19: stop()

// ---- triggers (onClipEvent(load) on the alpha-0 trigger clips) ----
mouthTrigger.addEventListener("pc_rollin", () => clip.gotoAndPlay("tunnel"));
rimOrBandTrigger.addEventListener("pc_rollin", () => clip.gotoAndPlay("bobble"));
```

The port can collapse this into one state machine per object:

| State | Pocket force objects | Tunnel force objects | Root front copy (above cursor) | Local front copy (below cursor) |
|---|---|---|---|---|
| `init` (start) | none | none | hidden | visible |
| `bobble` | Hill | Gutter(-3, sine, 100.18x36) + 2 mouth Holes | hidden | visible |
| `tunnel` | Hole + 3 Walls (+ Slope, see below) | Gutter(4, V, 89.82x25) + 2 mouth Holes | **visible** | pocket: still visible (bug, but invisible in effect because the root copy covers it at the same spot); tunnel: hidden |

Transitions (the same for both objects): the cursor rolls into the mouth trigger and the object goes to `tunnel`; the cursor rolls into the rim/band trigger and it goes to `bobble`. Rolling out does nothing. There is no way back to `init`. Re-entering the current state is harmless.

- When a state is left, every force object that state placed is destroyed, and the next state's objects are created fresh, so their per-cursor "inside" memory is reset.
- The four trigger clips and the bunny persist across all states, so their memory survives.

## Event semantics to reproduce (from PC_Object.heartbeat)

- `pc_rollin` fires only when `cursorsInside[i] == false` on the previous frame. A fresh object starts with `undefined`, so a cursor that is already inside an object when it is created gets **no** rollin until it leaves and comes back.
- Hit tests are `hitTest(x, y, shapeFlag=true)` against the parent's drawn shape. This works on alpha-0 clips. The behaviour's own icon (`graphics` child) is unloaded at construction, so it is not part of the hit area.
- The PC_EventDispatcher children have no parameters, so their own listener registers for an `undefined` event and does nothing. They exist only so that the parent becomes an event source (`mx.events.EventDispatcher.initialize(_parent)`) and gets hit-tested every frame. The demo's own `onClipEvent(load)` listeners do the work.
- The bunny's DraggerMaker:
  - `pc_mousedown` (mouse pressed while the cursor is over the bunny square) starts dragging.
  - While dragging, every frame does `bunnyClip.x += cursor.xLastDisp; bunnyClip.y += cursor.yLastDisp` (the cursor's last total displacement: force plus mouse).
  - `pc_mouseup` stops the drag.
  - `pc_rollout` starts a delayed stop: the drag ends after the counter goes past 10, about 11 frames later, unless `pc_rollin` cancels it.
  - It also calls `_parent._parent.beginDrag()` / `endDrag()`. These don't exist here, so they do nothing.
  - The bunny is not constrained by the walls, but the cursor is.
- The rollover sound `"scratch"` (toolkit sound, looped through `PC_Cursor.setCursorSound`, volume tied to displacement) belongs to the pocket's `tunnel`-state Hole and to both tunnel mouth Holes. Every other object has `""` or `"Null"`.

## Bunny animation (sprite 27, 117 frames, loops for ever, 25 fps)

| Bitmap | Frames | Duration (frames) |
|---|---|---|
| bunny-01.png | 1-20 | 20 |
| bunny-02.png | 21-26 | 6 |
| bunny-03.png | 27-35 | 9 |
| bunny-04.png | 36-55 | 20 |
| bunny-05.png | 56-60 | 5 |
| bunny-06.png | 61-70 | 10 |
| bunny-07.png | 71-75 | 5 |
| bunny-08.png | 76-85 | 10 |
| bunny-09.png | 86-90 | 5 |
| bunny-10.png | 91-110 | 20 |
| bunny-11.png | 111-117 | 7 |

The bitmaps are drawn with a non-smoothed fill (fill style 0x43), so use `image-rendering: pixelated`.

The bunny sits **below** both pocket-front copies, so it shows only where `pocket-front` is transparent: the mouth notch, and outside the sphere silhouette once it has been dragged out. At rest it is hidden or nearly hidden inside the sphere.

## Assets (`public/demos/pocket/`)

| File | Source | Size | Registration offset in SVG (tx, ty) | Used by |
|---|---|---|---|---|
| `pocket-back.svg` | shape 4 (JPEG 3, cropped to 97 px wide) | 97x112 | (0, 0) | pocket clip depth 15 |
| `pocket-front.svg` | shape 31 (PNG with alpha) | 97x112 | (0, 0) | pocket depth 20 (local) + main depth 60 (`pocket_top`) |
| `tunnel-back.svg` | shape 44 (JPEG 43, cropped to 133 px wide) | 133x59 | (0, 0) | tunnel clip depth 1 |
| `tunnel-front.svg` | shape 46 (PNG with alpha) | 133x59 | (0, 0) | tunnel depth 18 (local) + main depth 58 (`tunnel_top`) |
| `bunny-01.png` ... `bunny-11.png` | bitmaps 5, 7, ..., 25 | 32x32 | top-left = registration | bunny animation |
| `hit-pocket-mouth.svg` | shape 33 | 38x22 | **(-37, 4)** | pocket mouth trigger (alpha 0) |
| `hit-pocket-rim.svg` | shape 36 | 132x168 | **(23, 22)** | pocket rim trigger (alpha 0) |
| `hit-tunnel-mouths.svg` | shape 48 | 123.85x29.4 | **(-12, -0.25)** | tunnel mouth trigger (alpha 0) |
| `hit-tunnel-bands.svg` | shape 50 | 168.5x93 | **(-8.5, -10)** | tunnel band trigger (alpha 0); placed at (-27.85, -40) inside its trigger clip |

The `hit-*.svg` files are never drawn: they are filled black or green in the SVG only for inspection. Use their `<path d>` (with the offset) for point-in-shape tests, for example with `Path2D` + `isPointInPath`.

Toolkit symbols that are not copied: PC_Engine, PC_ArrowCursor, PC_Hill, PC_Hole, PC_Wall, PC_Gutter, PC_DraggerMaker, PC_EventDispatcher, and the sound `scratch`.

## Unusual or unresolved

1. **`PC_Objects.PC_Slope` does not exist in the toolkit.** The demo imports it (character 41) from `powercursor.swf`, but neither the shipped `powercursor.swf` nor the AS2 source exports a class or symbol with that name. Its parameters (`angle`, `strength`, `graphicsStyle`, `tint`) match **PC_Ramp** exactly, so it is probably the pre-rename name.
   - **In the deployed demo it does nothing**: the missing import gives an empty clip.
   - For a faithful port, **omit it**. The tunnel-state pocket then has the cursor sinking to the Hole centre (342.12, 130.92), at the bottom of the shaft between the walls.
   - If the intended design is wanted instead, use PC_Ramp with angle 0 and strength 3. That pushes up (-y) inside AABB (308.35, 123.0)-(370.35, 178.03). Its "Square" art would be hidden under `pocket-back` either way.
2. **Pocket naming bug**: the pocket's local front copy is named `tunnel_top_local`, but the scripts toggle `pocket_top_local`. The local copy therefore stays visible in every state. This has no visual effect because the root copy covers it exactly. The port can simply copy the tunnel's correct behaviour.
3. Pocket interior geometry in the `tunnel` state:
   - The free shaft between the walls is x 324.45-357.61, open above y 94.40 at the sides and closed below y 137.96.
   - Above y 94.40 the cursor can leave sideways or upwards.
   - The bunny square overlaps the shaft, so the cursor can reach and grab it.
4. When the cursor leaves the pocket straight up through the mouth without touching the rim band, the pocket stays in `tunnel`: the front copy stays above the cursor and the walls stay active. The next approach from the sides or bottom crosses the rim band first, because the rim AABB is larger than the walls, which switches it back to `bobble`.
5. The Hill/Hole/Wall art in the pocket clip lies under the opaque `pocket-back` image (depth 15), so it is never visible. The tunnel's force objects have graphics style None.
6. Unused library symbol: `bol (MC)` (sprite 2, a 114 px white-to-black radial-gradient ball with an empty `onEnterFrame`). It is exported but never placed. The `-1.wav` in sounds is an empty stream header. The demo has no other sounds, video or text.
7. When embedded in the example shell (`_root != this`) the main timeline stops at frame 1. That only matters for the shell. The port behaves as standalone.

## Verification

- At load: two static images (tunnel left, pocket right) on `#333333`, the red arrow cursor visible, and the OS cursor hidden. Moving over either image produces **no** force until a trigger zone has been crossed.
- Tunnel:
  - Approach from above or below: you feel a ridge, and the cursor is pushed away from y ≈ 113 and slides around the cylinder. The cursor is always drawn on top.
  - Approach from the left or right end: the cursor is sucked into the mouth (scratch sound), slides along y ≈ 113.9, and **disappears behind the tunnel's front skin**, visible only through the dark openings.
  - Pushing hard up or down out of the tunnel body touches a band and switches back to riding over the tunnel.
- Pocket:
  - Approach from the side or bottom: the cursor rolls off a dome centred near (341, 132). It is always on top.
  - Enter through the top opening: the cursor drops in, disappears behind the sphere's front, is pulled down towards (342, 131), and is boxed in by invisible walls (it cannot move sideways out of the sphere below y ≈ 94).
  - Click and drag inside the pocket over the bunny: the bunny follows the cursor and appears once it is pulled above the sphere's rim.
- The bunny blinks and twitches on a 117-frame (4.68 s) loop.
