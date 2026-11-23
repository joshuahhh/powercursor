# switch — "Sweet Switch"

Source: `switch.swf` (SWF v8, AS2). Decompiled from `$SCRATCH/out/switch`.

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 400 | 400 | `#333333` | 25 |

Standalone: `Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

examplelist description: the entry for `switch.swf` reuses the Pocket text (*"Try and move your cursor through the tunnel, or in the pocket…"*). It is a copy-paste error in the original list and does not describe this demo.

**What you experience:** two identical small toggle switches (a dark 23x29 slot holding a round lime-green knob) sit side by side. Each has an "off"/"on" label above it. Below the left one is the caption "with visual / force feedback"; below the right one, "regular / (no feedback)".

- **Left switch (force feedback).**
  - Hovering it pulls the cursor in (outer Hole, strength 2). The cursor then sinks into a small dimple under the knob (inner Hole, strength 3) and turns into a Finger.
  - **Click** to flip the switch. For the ~0.3–0.4 s flip animation, mouse input is muted (Mouse dimmer 0 %). An invisible wall confines the cursor to a tiny pocket, and a Pushgutter shoves it in the knob's direction, so **the cursor travels with the knob**.
  - Alternatively, rest on the switch ~0.6 s. An invisible extra "drag target" Hole then appears just beyond the knob (above it when off, below it when on). Nudging the cursor into it flips the switch: this is the "drag" gesture.
- **Right switch (regular).** Exactly the same clip and logic, but a root-level Dimmer (Global forces → 0 %) sits over it, so all its pulls and pushes are nullified. The visuals, cursor-style changes and click/drag toggling behave the same. **Literal-SWF caveat:** the Mouse dimmer and the wall are not affected by a Global-forces dimmer. So the cursor also freezes inside the right switch during its flip, without being carried.

All toolkit objects are invisible: either style "None", alpha 0, or drawn at depths below the opaque switch-base bitmap. The only visible art is the two bitmaps plus the text.

## Imports (toolkit classes)

| char id | class |
|---|---|
| 3 | `PC_System.PC_Engine` |
| 6 | `PC_Objects.PC_Hole` |
| 12 | `PC_Objects.PC_Pushgutter` |
| 14 | `PC_Behaviours.PC_WallMaker` |
| 16 | `PC_Objects.PC_Dimmer` |
| 21 | `PC_Cursors.PC_ArrowCursor` |

## Root display list (stage space, px)

Main timeline: frame 1 places everything except the cursor. Frame 2 places the cursor and calls `stop()`. Frame 3 is empty and never reached.

| depth | node | x | y | scaleX | scaleY | rot | alpha | renders with | notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 (f1) | **PC_Engine** | 562 | 420 | 1.0 | 1.0007629 | 0 | 1 | toolkit (hidden) | off-stage; moved to (561.65, 419.95) on f2 |
| 6 (f1) | **switch sprite 18**, name `switch_on` (left, force feedback) | 123.05 | 94.2 | 1 | 1 | 0 | 1 | container, see below | |
| 28 (f1) | **PC_Dimmer** (root) | 242 | 76 | 0.27975464 | 0.39988708 | 0 | 0.199 (alphaMult 51/256) | toolkit square tinted #333333 (invisible on bg) | 27.98 x 39.99 px box, x 242–269.98, y 76–115.99. Covers the right switch |
| 30 (f1) | **switch sprite 18**, name `switch_on2` (right, regular) | 254.95 | 94.2 | 1 | 1 | 0 | 1 | container | |
| 52 (f1) | text "with visual⏎force feedback" | 76.9 | 128.75 | 1 | 1 | 0 | 1 | HTML text | see Text |
| 53 (f1) | text "regular⏎(no feedback)" | 207.9 | 128.75 | 1 | 1 | 0 | 1 | HTML text | see Text |
| 54 (f2) | **PC_ArrowCursor**, instance name **`cursor`** | 392.5 | 84 | 1 | 1 | 0 | 1 | toolkit | Scripts call `_root.cursor.gotoAndStop(...)`, so the name matters |

**Root PC_Engine:** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=false, hideAllObjects=false`.
Because `scaleToAlpha` is false, the root Dimmer's 20 % alpha does not weaken its effect.

**Root PC_ArrowCursor `cursor`:** `cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true, minHeight=0, minWidth=0`

**Root PC_Dimmer (depth 28):** `scope="Global forces", dimmingFactor=0, directionDependency="None", dirDepAngle=0, tint=3355443 (#333333), rolloverCursorStyle="Null", rolloverCursorSound="", visible=true, minHeight=0, minWidth=0`.
This multiplies every force on a cursor inside its rect by 0. Relative to `switch_on2`, the rect is local x −12.95…15.03, y −18.2…21.79. It covers all of that switch's objects except slivers: the off-state outer sensor pokes 0.3 px out on the left, and the on-state outer sensor pokes 2.8 px out at the top.

## Switch sprite 18 (71 frames). Local coordinates

Stage position = local + (123.05, 94.2) for the left switch, or local + (254.95, 94.2) for the right switch. No nested scaling, so local px = stage px.

### Persistent / visible children

| depth | node | local x | local y | renders with | notes |
|---|---|---|---|---|---|
| 1 | label text "off" (frames 1–28); replaced by "on" (frame 29 onward) | −6.75 | −30 | HTML text | the label reverts to "off" whenever the timeline jumps back before frame 29 |
| 20 | **switch base** (shape 8, opaque RGB bitmap 23x29) | 0 | 0 | `switch-base.svg` | registration is the CENTRE: covers local −11.5…11.5, −14.5…14.5 |
| 21 | **knob** (sprite 11 → shape 10, RGBA bitmap 23x29) | −11.5 | y varies | `switch-knob.svg` | registration top-left. Green ball pixels occupy image rect (7,5)–(17,15), so the ball centre = (x+12, y+10) |

Knob y by frame (x is always −11.5):

| frames | knob y | ball centre (local) |
|---|---|---|
| 1–24, and everything reached by jumping to frames < 25 (off states) | −7.4 | (0.5, 2.6) |
| 25 / 26 / 27 / 28 | −8.8 / −10.25 / −11.65 / −13.1 | |
| 29–60 (on states) | −14.5 | (0.5, −4.5) |
| 62 / 63 / 64 / 65 / 66 / 67 | −13.5 / −12.45 / −11.45 / −10.45 / −9.45 / −8.4 | |
| 68–71 | −7.4 | |

Depth order in the sprite is d1 text < d2 < d8 < d12 < d14 < **d20 base (opaque)** < d21 knob. Every toolkit object in this sprite lies at depth < 20 and inside the base's rectangle (or has style None). So nothing toolkit-drawn is ever visible. A port can skip drawing them.

### Toolkit object catalogue (char 6 = Hole unless noted)

The geometry is the symbol's 100x100 box (Pushgutter 200x25) after the placement matrix. Hole hit area = the ellipse inscribed in that box.

| id | first placed (script folder) | depth | local x,y | scaleX, scaleY | box size | centre | params | event handlers (pseudocode) |
|---|---|---|---|---|---|---|---|---|
| **A** off-sensor | frame 1 (`frame_1/PlaceObject2_6_2`) | 2 | −13.25, −14.5 | 0.26620483, 0.35488892 | 26.62x35.49 | (0.06, 3.24) | strength 0, U-shaped, plateau 20, style None, tint #DD2424 | rollin → `gotoAndPlay("off_rollover")`; rollover → `play()`; rollout → `cursor→"arrow"; gotoAndStop("off_rollout")` |
| **B** off-pull | frame 5 (`frame_5/…6_2`) | 2 | same as A | same | same | same | **strength 2**, U-shaped, plateau 20, None, #DD2424 | same as A |
| **C** off-dimple | frame 6 (`frame_6/…6_8`) | 8 | −6.15, −4.15 | 0.13000488, 0.13000488 | 13.00x13.00 | (0.35, 2.35) | strength 3, Sine-shaped, plateau 2, None, tint 65535 (#00FFFF) | rollin → `cursor→"finger"`; rollover → `cursor→"finger"`; rollout → `gotoAndPlay("off_rollout")`; **mousedown → `gotoAndPlay("turn_on")`** |
| **D** off-rest | frame 17 (`frame_17/…6_8`) | 8 | same as C | same | same | same | **strength 0**, Sine-shaped, plateau 5, None, #00FFFF | same as C |
| **E** off-drag-target | frame 19 (`frame_19/…6_14`) | 14 | −4.05, −11.4 | 0.08804321, 0.08355713 | 8.80x8.36 | (0.35, −7.22) | strength 3, Sine-shaped, plateau 4, style "Circle with shading", #00FFFF | rollin → `cursor→"finger"; if (dragswitch) gotoAndPlay("turn_on")`; rollout → `cursor→"finger"` |
| **F** on-sensor | frame 39 (`frame_39/…6_2`) | 2 | −13.25, −21.0 | 0.26620483, 0.35488892 | 26.62x35.49 | (0.06, −3.26) | strength 0, U-shaped, plateau 20, None, #DD2424 | rollin → `gotoAndPlay("on_rollover")`; rollover → `play()`; rollout → `cursor→"arrow"; gotoAndPlay("on_rollout")` |
| **G** on-dimple | frame 42 (`frame_42/…6_8`) | 8 | −6.15, −10.15 | 0.13000488, 0.13000488 | 13.00x13.00 | (0.35, −3.65) | strength 3, Sine-shaped, plateau 2, None, #00FFFF | rollover → `cursor→"finger"`; rollout → `cursor→"arrow"; gotoAndPlay("on_rollout")`; **mousedown → `trace("turn off"); gotoAndPlay("turn_off")`** |
| **H** on-pull | frame 43 (`frame_43/…6_2`) | 2 | same as F | same | same | same | **strength 2**, U-shaped, plateau 20, None, #DD2424 | same as F |
| **J** on-rest | frame 53 (`frame_53/…6_8`) | 8 | same as G | same | same | same | **strength 1**, Sine-shaped, plateau 3, style "Circle", #00FFFF | rollover → `cursor→"finger"`; rollout → `cursor→"arrow"; gotoAndPlay("on_rollout")`; **mousedown → `gotoAndPlay("turn_off")`** |
| **K** on-drag-target | frame 56 (`frame_56/…6_14`) | 14 | −3.75, −0.1 | 0.0821228, 0.0821228 | 8.21x8.21 | (0.36, 4.01) | strength 3, Sine-shaped, plateau 4, "Circle with shading", #00FFFF | rollin → `cursor→"finger"; if (dragswitch) gotoAndPlay("turn_off")`; rollout → `cursor→"finger"` |
| **P↑** Pushgutter (char 12) | frame 24 (`frame_24/PlaceObject2_12_2`) | 2 | −4.5, 12.1 | matrix a=0, b=−0.08253479, c=0.3999939, d=0 → **rot −90°**, scaleX 0.08253479, scaleY 0.3999939 | 16.51 long x 10.00 wide | strip x −4.5…5.5, y −4.41…12.1 | strength 3, pushStrength 3, U-shaped, plateau 5, arrowStyle "Still", graphicsStyle "None", tint #DD2424 | rollover → `cursor→"finger"`. Local +x (push direction) points **up** (−y) |
| **P↓** Pushgutter (char 12) | frame 61 (`frame_61/PlaceObject2_12_2`) | 2 | 5.5, −12.0 | a=0, b=0.06851196, c=−0.3999939, d=0 → **rot +90°**, scaleX 0.06851196, scaleY 0.3999939 | 13.70 long x 10.00 wide | strip x −4.5…5.5, y −12.0…1.7 | strength 3, pushStrength 3, U-shaped, **plateau 4**, "Still", "None", #DD2424 | rollover → `cursor→"finger"`. Push direction points **down** (+y) |
| **M** Mouse dimmer (char 16) | frames 24 and 61 (`frame_24/…16_12`, `frame_61/…16_12`, identical) | 12 | −10.6, −14.25 | 0.22059631, 0.28419495 | 22.06x28.42 | (0.43, −0.04) | **scope "Mouse"**, dimmingFactor 0, directionDependency None, dirDepAngle 0, tint 15641515 (#EEABAB) | rollover → `cursor→"finger"` |
| **W** wall guide (sprite 15) | frames 24 and 61 | 8 | −16.65, −22.75 | 1, 1 | — | — | instance **alpha 0** (alphaMult 0). Contains shape 13 at (0,0) and a PC_WallMaker at (51.6, 33.6) with `rolloverCursorSound="", rolloverCursorStyle="Null"` | none |

All Holes also carry `rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`. Pushgutters and Dimmers carry the same common fields.

`cursor→"finger"` / `cursor→"arrow"` is literally `_root.cursor.gotoAndStop("finger"|"arrow")`. PC_ArrowCursor's own timeline (its `graphics_mc` is itself) has frame labels `Arrow, MacArrow, Finger, Ball, Hand, GrabHand`, and AVM1 label lookup is case-insensitive. So this just switches the cursor graphic to Finger/Arrow without updating the cursor's internal `cursorStyle`. Port it as a visual cursor-style change.

**Wall W geometry** (`switch-wall-guide.svg`, shape 13, in sprite-18 local coords after the (−16.65, −22.75) offset):
- A dark `#303030` block from x −33.5…33.0, y −40.75…37.25, with a rectangular hole at x −11.0…11.0, y −14.5…13.5.
- That hole is almost entirely filled by a green `#00ff00` rectangle (x −11.15…11.25, y −14.1…14.15).
- The green rectangle has an even-odd cut-out: an **oval pocket ≈ x −2.1…3.35, y −5.5…3.35**, plus a negligible 0.15 px speck and an enclosed, unreachable 0.4 px sliver at y −14.5…−14.1.
- WallMaker makes the union of both fills a wall. So while W exists, the cursor can only occupy that pocket, or anything outside the block. The pocket spans the travel of the knob's ball: ball centre y 2.6 (off) ↔ −4.5 (on). The Pushgutter strip carries the cursor along it.
- Engine note: `addWall` registers a path string and walls are never unregistered. Once the instance is removed, the path no longer resolves and the wall stops acting. So a **wall is active only while W exists**: frames 24–31 and 61–70. Each new W instance gets a new auto-name and is re-added.

### Frame labels

| label | frame |
|---|---|
| `off_rollout` | 2 |
| `off_rollover` | 4 |
| `off_inside` | 12 |
| `off_inside_forawhile` | 19 |
| `turn_on` | 24 |
| `on_rollout` | 35 |
| `on_rollover` | 42 |
| `on_go_inside` | 47 |
| `on_inside` | 51 |
| `on_inside_forawhile` | 56 |
| `turn_off` | 61 |

### Frame-by-frame display list and scripts

("+X" = placed, "−dN" = depth removed. Frames not listed change nothing.)

| frame | changes | frame script |
|---|---|---|
| 1 | + text "off" (d1), + **A** (d2), + base (d20), + knob y −7.4 (d21) | `dragswitch = true; if (status == "on") { gotoAndStop("on_rollout"); play(); }` |
| 2 `off_rollout` | — | `stop();` |
| 5 | −d2, + **B** (d2) | |
| 6 | + **C** (d8) | |
| 12 `off_inside` | −d2 (B gone) | |
| 17 | −d8, + **D** (d8) | |
| 19 `off_inside_forawhile` | + **E** (d14) | `stop();` |
| 24 `turn_on` | −d8, −d14; + **P↑** (d2), + **W** (d8, alpha 0), + **M** (d12) | `_root.cursor.gotoAndStop("finger");` |
| 25–28 | knob y −8.8, −10.25, −11.65, −13.1 | |
| 29 | −d1, + text "on" (d1); knob y −14.5 | |
| 31 | — | `status = "on"; gotoAndStop("on_go_inside"); play();` (jumps to 47) |
| 32 | −d2, −d8, −d12 | (only passed through during the 31→47 jump) |
| 35 `on_rollout` | — | `play();` |
| 39 | + **F** (d2) | |
| 41 | — | `stop();` |
| 42 `on_rollover` | + **G** (d8) | |
| 43 | −d2, + **H** (d2) | |
| 47 `on_go_inside` | — | |
| 49 | −d2 (H gone) | |
| 51 `on_inside` | — | |
| 53 | −d8, + **J** (d8) | |
| 56 `on_inside_forawhile` | + **K** (d14) | `stop();` |
| 61 `turn_off` | −d8, −d14; + **P↓** (d2), + **W** (d8, alpha 0), + **M** (d12) | `_root.cursor.gotoAndStop("finger");` |
| 62–68 | knob y −13.5, −12.45, −11.45, −10.45, −9.45, −8.4, −7.4 | |
| 71 | −d8 (W gone) | `status = "off"; gotoAndStop("off_inside"); play();` (jumps back to 12) |

Jump semantics, as in Flash and as a port must reproduce them: a goto rebuilds the display list to exactly what the target frame shows. Objects absent from the target frame are destroyed. Objects placed by the timeline are re-constructed, with their `on(construct)` params and handlers re-attached, and the label text and knob position are restored.

- 31 → 47 gives: text "on", **H** (d2), **G** (d8), base, knob at −14.5.
- 71 → 12 gives: text "off", **C** (d8), base, knob at −7.4. P↓ and M are destroyed. Note that the frame-12 state has C at d8, not D: D only arrives at frame 17.
- Any → 2 (`off_rollout`) gives: text "off", **A**, base, knob −7.4.
- Any → 35 (`on_rollout`) gives: text "on", base, knob −14.5, and **no sensor** until frame 39, a 4-frame (160 ms) dead time.

Frame scripts on frames that a goto skips over are not run.

### State machine (what the timeline amounts to)

```
OFF_IDLE (frame 2, stopped; A present, strength 0 sensor)
  A.rollin / A.rollover        → OFF_HOVER (gotoAndPlay 4 / play)
OFF_HOVER (frames 4–18 playing)
  f5: sensor becomes B (pull strength 2) · f6: dimple C (strength 3) appears
  f12: B removed · f17: C replaced by D (strength 0)
  f19: stop → OFF_REST, drag target E appears above the knob (centre y −7.22)
  A/B.rollout                  → cursor arrow; OFF_IDLE (gotoAndStop 2)
  C/D.rollout                  → OFF_IDLE (gotoAndPlay 2, which hits stop())
  C/D.mousedown                → TURN_ON
  E.rollin (dragswitch==true)  → TURN_ON
TURN_ON (frames 24–30, 7 frames = 280 ms)
  cursor finger; P↑ pushes up, W confines cursor to the pocket, M mutes mouse input (×0)
  knob slides up 7.1 px over frames 25–29; label → "on" at f29
  f31: status = "on" → ON_ENTER (frame 47)
ON_ENTER / ON_HOVER (frames 42/47–55 playing)
  (from on_rollover, 42: G dimple strength 3 appears; 43: sensor becomes H, pull strength 2)
  f49: H removed · f53: G replaced by J (strength 1)
  f56: stop → ON_REST, drag target K appears below the knob (centre y 4.01)
  F/G/H/J.rollout              → cursor arrow; ON_IDLE (gotoAndPlay 35)
  G/J.mousedown                → TURN_OFF
  K.rollin (dragswitch==true)  → TURN_OFF
ON_IDLE (frames 35–41 playing, then stopped at 41; F sensor from frame 39)
  F.rollin                     → ON_HOVER (gotoAndPlay 42)
  F.rollover                   → play() (stopped at 41 → continues into 42)
TURN_OFF (frames 61–70, 10 frames = 400 ms)
  cursor finger; P↓ pushes down, W confines, M mutes mouse
  knob slides down 7.1 px over frames 62–68; label stays "on" until the jump
  f71: status = "off" → OFF_REST_ENTRY (jump to frame 12: dimple C, then D at f17, E + stop at f19)
```

Drag-target overlap, which makes the drag gesture reliable: E (y −11.4…−3.04) overlaps C/D (y −4.15…8.85) by about 1.1 px. K (y −0.1…8.11) overlaps G/J (y −10.15…2.85) by about 2.95 px. Moving toward the target therefore produces E/K `rollin` before C/D/G/J `rollout`.

**Uncertain:** if both events land in the same frame, the order depends on the engine's per-object heartbeat order. With the overlap, the rollin should come first.

Toolkit-engine side effects that also apply (from PC_Object.heartbeat):
- Each object's own rollin calls `setCursorStyle("Null")`. That is a no-op visually, because there is no "Null" frame label.
- Each object's rollout calls `setCursorStyle("Arrow")` *after* dispatching `pc_rollout`. This can override a handler's `cursor→"finger"`. For example, E/K rollout effectively ends on Arrow, unless another object's rollover sets Finger again that same frame.
- A freshly (re)constructed object does not fire `pc_rollin` for a cursor already inside it on its first frame, because `cursorsInside[i]` is undefined and not `false`. It does fire `pc_rollover`. The state machine above relies on this: for example, the replacement A→B or C→D does not re-trigger rollin handlers.

## Text

All text uses DefineEditText (static-looking, `noSelect`, `readOnly`), font **Arial** (device font, not outlines), **13 px** (fontHeight 260 twips), colour **#999999**, leading 2 px, single-line paragraphs.

| where | content | anchor (placement) | box (placement + bounds) | align |
|---|---|---|---|---|
| sprite 18, d1 (off states) | `off` | local (−6.75, −30) | local x −8.75…14.0, y −32…−11.2 | left |
| sprite 18, d1 (frame 29+) | `on` | local (−6.75, −30) | same | left |
| root d52 | `with visual` ⏎ `force feedback` | stage (76.9, 128.75) | stage x 68.6…182.3, y 126.75…166.1 (centre x 125.45) | center |
| root d53 | `regular` ⏎ `(no feedback)` | stage (207.9, 128.75) | stage x 199.6…313.3, y 126.75…166.1 (centre x 256.45) | center |

Flash EditText draws the text 2 px inside the box (gutter), so the first glyph's top-left is at about anchor + (0, 0). Stage positions of the "off"/"on" label: (116.3, 64.2) for the left switch and (248.2, 64.2) for the right.

## Assets — `/public/demos/switch/`

| file | source | size | registration offset (tx,ty) | use |
|---|---|---|---|---|
| `switch-base.svg` | shape 8 (bitmap 7, RGB, opaque) | 23x29 | **(11.5, 14.5)**: the registration is the image centre | the slot/background. Draw so its centre is at the switch origin |
| `switch-knob.svg` | shape 10 / sprite 11 (bitmap 9, RGBA) | 23x29 | (0, 0) | knob; place top-left at (−11.5, knobY) local |
| `switch-wall-guide.svg` | shape 13 | 66.5x78 | **(16.85, 18.0)** | **not drawn** (instance alpha 0). Use it only as the wall hit-shape of W; place its registration at local (−16.65, −22.75) |

Knob colour: the raw ARGB bitmap data is lime green (for example, ball-centre pixels around rgb(206,255,137)), and the SVG/PNG export shows the same. **Discrepancies, unresolved:** the JPEXS frame render (`frames/2.png`) shows the ball as light grey, and the 100x100 example icon `switch.gif` shows a red knob in the "on" position, probably from an older build. Trust the bitmap: green.

## Unusual / notes

- **No sounds.** `sounds/-1.wav` is an empty stream header, and every object has `rolloverCursorSound=""`.
- `trace("turn off")` in G's mousedown handler is debug output. It can be logged or ignored.
- `dragswitch` is always `true`, so drag-to-toggle is always enabled. `status` is only read in frame 1, which is only reached at start. That branch is a guard and never fires in practice.
- The instance names `switch_on` and `switch_on2` are never referenced by any script.
- Unused exported symbol `bol (MC)` (gradient ball, template leftover). Ignore it.
- Holes C/D/G/J/E/K use tint #00FFFF, and J/E/K have visible styles ("Circle", "Circle with shading"). The author evidently used them as authoring guides. They are hidden behind the opaque base bitmap at runtime.

## Verification

1. A 400x400 #333 canvas. Two switch slots are centred at (123,94) and (255,94), each showing a green knob at the bottom, with grey "off" above. The captions read "with visual / force feedback" (centred x≈125) and "regular / (no feedback)" (centred x≈256), starting at y≈129.
2. **Left switch.**
   - Approach it and the cursor is sucked onto the knob, becoming a Finger.
   - Click: the knob slides up over ~0.28 s, the cursor rides up with it (mouse movement ignored meanwhile), and the label changes to "on".
   - Leave and come back: you are pulled onto the knob in its upper position.
   - Click again: it slides down over ~0.4 s carrying the cursor, and the label reverts to "off".
3. **Drag gesture.** Hover on the left switch without clicking for ~0.6 s, then push the cursor gently up (when off) or down (when on) by about 5–10 px. The switch flips without a click.
4. **Right switch.** The labels, the toggling by click or drag, and the knob animation are the same, but the cursor is not pulled in or carried. During the flip the cursor stays frozen; this is literal SWF behaviour, see the caveat above.
5. Leaving a switch restores the Arrow cursor. The real OS cursor is hidden throughout.
