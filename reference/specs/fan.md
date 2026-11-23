# fan — "Don't touch that Fan!"

Source: `fan.swf` (SWF v8, AS2). Decompiled from `$SCRATCH/out/fan`.

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 300 | 300 | `#333333` | 25 |

Standalone: `Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

examplelist description: *"What do you expect will happen when you move your cursor on the fan? This is a very basic example of visual force feedback. Click the icons above for other examples."*

**What you experience:** a small pixel-art desk fan (67x90 px) sits near the top-centre. Its blades spin (4-image loop). When you move the cursor onto the fan head while it spins, the cursor is flung outward in a clockwise spiral (Twister "Right Out", strength 18), so you can hardly touch it. The cursor turns into a Finger and the toolkit "pop" sound plays when you enter the head. Clicking anywhere on the fan image toggles it: when stopped, the blades freeze on image 4 and the twister is gone. Only a gentle Hole (strength 3) remains, pulling the cursor softly into the centre of the head. Click again to restart.

## Imports (toolkit classes)

| char id | class |
|---|---|
| 3 | `PC_Objects.PC_Hole` |
| 4 | `PC_Objects.PC_Twister` |
| 7 | `PC_Behaviours.PC_EventDispatcher` |
| 15 | `PC_System.PC_Engine` |
| 16 | `PC_Cursors.PC_ArrowCursor` |

## Display list (stage space, px)

Main timeline has 3 frames. Frame 1 places the fan. Frame 2 places Engine and Cursor and calls `stop()`. Frame 3 is never reached in standalone play (it only nudges the Engine to 392.65,295.95).

| depth | node | x | y | scaleX | scaleY | rot | alpha | renders with | notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 (f2) | **PC_Engine** | 393 | 296 | 1.0 | 1.0007629 | 0 | 1 | toolkit (hidden at runtime) | off-stage |
| 6 (f1) | **fan** (sprite 14, no instance name) | 125.05 | 77 | 1 | 1 | 0 | 1 | container | has `onClipEvent(load)`, see Scripts |
| ├ 1 | PC_Hole (child of fan) | 126.05 | 77 | 0.6470032 | 0.6470032 | 0 | 1 | toolkit, style None (invisible) | 64.70 px box. Centre at stage (158.40, 109.35) |
| ├ 7 | PC_Twister (child of fan) | 125.05 | 77 | 0.6672821 | 0.6672821 | 0 | 1 | toolkit, style None, vortex None (invisible) | 66.73 px box. Centre at (158.41, 110.36). Present only on fan frames 1–7 |
| ├ 7 | fan image 4 (replaces Twister on fan frames 8–9) | 125.05 | 77 | 1 | 1 | 0 | 1 | `fan-4.svg` | |
| ├ 18 | fan image 1/2/3 (cycled) | 125.05 | 77 | 1 | 1 | 0 | 1 | `fan-1.svg` / `fan-2.svg` / `fan-3.svg` | absent on fan frames 8–9 |
| └ 19 | PC_EventDispatcher (child of fan) | 127.8 | 132.5 | 1 | 1 | 0 | 1 | none (icon is unloaded at runtime) | acts on parent = fan sprite |
| 26 (f2) | **PC_ArrowCursor**, instance name `PC_Cursor` | 392.5 | 84 | 1 | 1 | 0 | 1 | toolkit | off-stage start |

### Toolkit parameters (`on(construct)`)

**PC_Engine (depth 1):** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", scaleToAlpha=false, hideAllObjects=false`

**PC_ArrowCursor `PC_Cursor` (depth 26):** `cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true, minHeight=0, minWidth=0`

**PC_Hole (fan/depth 1):** `strength=3, shape="U-shaped", plateauDiameter=0, style="None", tint=14492708 (#DD2424), rolloverCursorStyle="Finger", rolloverCursorSound="pop", visible=true, minHeight=0, minWidth=0`

**PC_Twister (fan/depth 7):** `strength=18, shape="U-shaped", plateauDiameter=10, spin="Right Out", style="None", vortexStyle="None", tint=14492708 (#DD2424), rolloverCursorStyle="Null", rolloverCursorSound="", visible=true, minHeight=0, minWidth=0`

**PC_EventDispatcher (fan/depth 19):** no `on(construct)` record (empty clip actions). So `event`, `action`, `parameter` and `target` are all undefined and its own listener does nothing. It matters only because PC_Behaviour sets `hitTestTarget = eventTarget = _parent` (the fan sprite) and mixes EventDispatcher into the fan. The fan sprite therefore receives `pc_mousedown` / `pc_mouseup` / `pc_rollin` / `pc_rollover` / `pc_rollout` whenever the cursor hit-tests on the fan's drawn content.

**Hit area of the fan sprite:** the union of its children. That is the opaque 67x90 bitmap rectangle (stage x 125.05–192.05, y 77–167; JPEXS shape path is a plain rectangle) plus the alpha-0 discs of the Hole and Twister, which both lie inside that rectangle. So it is effectively the 67x90 rect.

## Timelines / state

### Fan sprite (id 14), 9 frames

| frame | depth 7 | depth 18 | script |
|---|---|---|---|
| 1 | Twister (constructed) | fan-1 | `playing = true;` |
| 2 | Twister | fan-1 | |
| 3 | Twister | fan-1 | |
| 4 | Twister | fan-2 | |
| 5 | Twister | fan-2 | |
| 6 | Twister | fan-3 | |
| 7 | Twister | fan-3 | |
| 8 | **Twister removed**, fan-4 placed | (removed) | |
| 9 | fan-4 | — | `if (playing) gotoAndPlay(3); else gotoAndPlay(_currentframe - 1); // =8` |

The Hole (depth 1) and EventDispatcher (depth 19) are present on all 9 frames.

- **Spinning** loops frames 3→9 (7 frames = 280 ms). The image sequence is fan-1 ×1 frame, fan-2 ×2, fan-3 ×2, fan-4 ×2.
- **The Twister is destroyed on frame 8 and re-constructed on every jump back to frame 3.** So while spinning, the twister force is active on 5 of every 7 frames (frames 3–7) and absent on frames 8–9. A newly constructed instance starts with an empty `cursorsInside`, so it does not fire `pc_rollin` for a cursor that is already inside. The twister has no cursor style or sound anyway. This is the literal SWF behaviour; a port may keep the twister continuously active while spinning if the flicker is judged unintended. **Uncertain:** whether the author meant it.
- **Stopped** loops frames 8↔9: fan-4 shown, no Twister, Hole still active.

### Fan instance clip event (main timeline, depth 6)

```
onLoad:
  fan.addEventListener("pc_mousedown", function () {
    fan.playing = !fan.playing;   // toggle
  });
```
The toggle takes effect at the next frame-9 check, so stopping or starting has up to ~7 frames (280 ms) of latency, which is visible.

### Main timeline

```
frame 1: if (this == _root) { Stage.scaleMode = "noScale"; Stage.align = "TL"; }
         if (_root != this) stop();   // when hosted inside another SWF, stays on frame 1 and uses the host's engine
frame 2: stop();                      // standalone: engine + cursor now exist
```

## Assets — `/public/demos/fan/`

| file | source | size | registration offset (tx,ty) | use |
|---|---|---|---|---|
| `fan-1.svg` | shape 6 (bitmap 5) | 67x90 | (0, 0) | blades frame A |
| `fan-2.svg` | shape 9 (bitmap 8) | 67x90 | (0, 0) | blades frame B |
| `fan-3.svg` | shape 11 (bitmap 10) | 67x90 | (0, 0) | blades frame C |
| `fan-4.svg` | shape 13 (bitmap 12) | 67x90 | (0, 0) | blades frame D, also the "stopped" image |

The SVGs embed pixel-art PNGs with `image-rendering: pixelated`. The registration point is the top-left, so draw each at stage (125.05, 77).

## Unusual / notes

- **No demo sounds.** `sounds/-1.wav` is an empty 44-byte stream header. The only sound is the toolkit's `"pop"` rollover sound on the Hole. Per PC_Cursor, a rollover sound is started looped (`start(0, 9999)`) on rollin and stopped on rollout. Its volume is updated every displacement from cursor speed relative to the object's size; that is engine behaviour.
- Unused library symbol `bol (MC)` (sprite 2) is exported but never placed. It is a 114x114 radial-gradient ball with a script stub `numSpeed = 1.1`; it is template leftover. Ignore it.
- No text, no links, no video.
- The Hole and Twister are almost concentric. The Twister box is 2 px larger and offset by (-1, 0), so the centres differ by about (0.01, 1.01) px.

## Verification

1. A 300x300 dark-grey (#333) canvas, with the fan's top-left at (125,77). The blades animate at about 3.6 cycles/s.
2. When the cursor enters the fan head (circle ≈ 65 px across, centred ≈ (158,110)), it becomes a Finger and "pop" plays. While spinning, the cursor is pushed outward and spins clockwise (Right Out); it is hard to hold still on the fan.
3. Click on the fan (anywhere in the 67x90 image). Within ≤ 280 ms the blades freeze on image 4 and the outward push stops. The cursor is now gently pulled toward the head centre (Hole strength 3).
4. Click again and the spinning and the push resume.
5. The real OS cursor is hidden (`hideRealCursor=true`).
