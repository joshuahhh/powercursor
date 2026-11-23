# cursorbug: porting spec

Source: `cursorbug.swf` (AS2, SWF v8), decompiled with JPEXS into `$SCRATCH/out/cursorbug/`. Made by Holland Interactive.

## Stage
| | |
|---|---|
| Size | 492 × 375 px (the video is 500 px wide, so its rightmost 8 px fall off-stage) |
| Background | #FFFFFF |
| FPS | 25 |
| Main timeline | 5 frames. Frame 4 does `stop()`, so frame 5 is never reached |

**What it is** (from examplelist.xml): "You are cursor bug flying in the room. Try to land it on his Nose! Created by Holland Interactive". A full-frame video shows a young man sitting at a table, fidgeting in a loop. A looping fly buzz plays. The buzz is panned left/right with the cursor's x position, gets louder while the cursor moves and fades when it stops. When the cursor enters his head, he swats at it with one hand. The matching swat video plays, a "hit" sound plays, and an invisible PushGutter that follows his hand shoves the cursor violently out of the way. He then returns to the idle loop. Nothing is visible except the video and the cursor: every force object is invisible.

## Engine / cursor (main timeline, frame 4)
| depth | object | stage pos | params |
|---|---|---|---|
| 1 | `PC_System.PC_Engine` | (359, 396), off-stage | bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="high speed", **scaleToAlpha=true**, hideAllObjects=false |
| 24 | `PC_Cursors.PC_ArrowCursor`, instance name `cursor` | (-59.7, -28), irrelevant | cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true |

`scaleToAlpha=true` only matters for objects with alpha < 1. The two hit zones have alpha 0, so they exert no force. They only fire events.

## Display list
Main timeline, depth 6: sprite 13, instance `mc_video`, at (0,0) with identity matrix, present from frame 1. Every object below lives inside `mc_video`, so sprite-local coordinates are stage coordinates.

| depth | node | frames (of mc_video) | stage transform | alpha | renders / params |
|---|---|---|---|---|---|
| 1 | video | 1–69 / 75–111 / 115–140 | (0,0), 1:1, 500×375 | 1 | `video-idle.mp4` / `video-hit-left.mp4` / `video-hit-right.mp4` (see Timeline) |
| 2 | `PC_Objects.PC_Hill` | 1–140 | x=424.8, y=32.65, scaleX=scaleY=0.235992, rot 0 → 23.6 px box, centre (436.6, 44.45) | 1 | strength=15, shape="U-shaped", plateauDiameter=20, style="None" (invisible), tint=14492708 (#DD2424), rolloverCursorStyle="Null", rolloverCursorSound="" |
| 8 | `PC_Objects.PC_Pushgutter` | 75–81, 116–121 only | per-frame, see table below | 1 | strength=0, pushStrength=**250**, shape="U-shaped", plateauDiameter=100, arrowStyle="None", graphicsStyle="None" (invisible), tint=14492708 (frame-75 instance: tint=0), rolloverCursorStyle="Null" |
| 14 | **hit zone LEFT** (sprite 7) | 1–140 | x=215, y=104, 1:1 | **0** | child: `hit-zone-left.svg` (shape 5) + `PC_Behaviours.PC_ButtonMaker` |
| 17 | **hit zone RIGHT** (sprite 9) | 1–140 | x=267, y=103.5, 1:1 | **0** | child: `hit-zone-right.svg` (shape 8) + `PC_Behaviours.PC_ButtonMaker` |

The Hill sits exactly on the round brass wall knob (doorbell) in the top right of the video. It is an invisible bump on that knob, about 24 px across.

### Hit zones (children of sprites 7 and 9)
Together the two shapes form an oval over the man's head, split down the middle, each half roughly 51 × 100 px.
- Sprite 7 (LEFT half): depth 1 is shape 5 at (0,0). Its stage extent is x 189.55–240.5, y 54–154: a half-oval with its curved side on the left and a straight edge at x=240.5.
- Sprite 9 (RIGHT half): depth 1 is shape 8 at (0,0). Its stage extent is x 242.5–291.55, y 53.5–153.5: a half-oval with its curved side on the right and a straight edge at x=242.5.
- **There is a 2 px vertical gap (x 240.5–242.5) between the halves** with no trigger. Possibly the intended "nose" landing strip, but the man's head moves in the video and the gap doesn't track it. Uncertain whether this is deliberate.
- ButtonMaker child of each: at (-2.55,-2) in sprite 7 and (-3.05,-2) in sprite 9 (its icon is unloaded at runtime, so its position is irrelevant). Params: outframe=1, overframe=2, downframe=3, upframe=2, rolloverCursorStyle="Arrow", rolloverCursorSound="", visible=true. The parent sprites have 1 frame, so the gotoAndStop calls do nothing. The only effect is the cursor style ("Arrow" on rollin/rollover, "Default" on rollout).
- Fill colour #CCCCCC, never seen (alpha 0). The hit test still works at alpha 0, as in Flash.

| asset | registration offset (tx,ty) |
|---|---|
| `hit-zone-left.svg` | (25.45, 50) |
| `hit-zone-right.svg` | (24.5, 50) |

### PushGutter keyframes (depth 8)
Toolkit Pushgutter geometry: a local box of 200 × 25 with its registration at the top left. It pushes along local +x. Push force = `pushStrength*cos(rot)/2, pushStrength*sin(rot)/2`, where rot = Flash `_rotation` = atan2(b,a). Matrix order is [a,b,c,d,tx,ty]: x'=a·x+c·y+tx, y'=b·x+d·y+ty. None of these matrices has any skew.

| mc_video frame | instance | matrix [a, b, c, d, tx, ty] | scaleX, scaleY | rot (push dir) | stage corners (0,0)(200,0)(200,25)(0,25) |
|---|---|---|---|---|---|
| 75 | A (new) | [0.38519, -0.013092, 0.13326, 3.9172, 176.55, 90.45] | 0.3854, 3.9195 | -1.95° → right | (176.6,90.5) (253.6,87.8) (256.9,185.8) (179.9,188.4) |
| 76 | A | [0.52077, -0.028915, 0.2171, 3.9112, 177.6, 55.4] | 0.5216, 3.9172 | -3.18° | (177.6,55.4) (281.8,49.6) (287.2,147.4) (183.0,153.2) |
| 77 | B (new) | [0.45882, 0.11714, -1.0948, 4.288, 213, 37.55] | 0.4735, 4.4256 | 14.32° | (213.0,37.5) (304.8,61.0) (277.4,168.2) (185.6,144.8) |
| 78 | B | [0.47041, 0.10696, -0.99629, 4.3823, 232.2, 39.15] | 0.4824, 4.4941 | 12.81° | (232.2,39.1) (326.3,60.5) (301.4,170.1) (207.3,148.7) |
| 79 | B | [0.18997, 0.39516, -3.8838, 1.8675, 309.5, 79.45] | 0.4385, 4.3095 | 64.32° | (309.5,79.5) (347.5,158.5) (250.4,205.2) (212.4,126.1) |
| 80 | B | [0.066544, 0.43333, -4.0051, 0.61505, 321.4, 113.6] | 0.4384, 4.0521 | 81.27° | (321.4,113.6) (334.7,200.3) (234.6,215.6) (221.3,129.0) |
| 81 | B | [-1.5259e-05, 0.41777, -3.5987, 3.0518e-05, 318.05, 134.1] | 0.4178, 3.5987 | 90.00° → down | (318.1,134.1) (318.0,217.7) (228.1,217.7) (228.1,134.1) |
| 82 | removed | | | | |
| 116 | C (new) | [-0.33186, -0.081299, 0.92467, -3.7756, 258.15, 164.1] | 0.3417, 3.8872 | -166.23° → left | (258.1,164.1) (191.8,147.8) (214.9,53.5) (281.3,69.7) |
| 117 | C | [-0.42793, -0.14552, 1.1977, -3.5225, 269.75, 149.35] | 0.4520, 3.7205 | -161.22° | (269.8,149.3) (184.2,120.2) (214.1,32.2) (299.7,61.3) |
| 118 | C | [-0.39473, -0.23676, 1.9488, -3.2494, 248, 141.55] | 0.4603, 3.7890 | -149.04° | (248.0,141.6) (169.1,94.2) (217.8,13.0) (296.7,60.3) |
| 119 | C | [-0.47444, 0.11629, -0.89244, -3.6402, 226.35, 153] | 0.4885, 3.7480 | 166.23° | (226.3,153.0) (131.5,176.3) (109.2,85.3) (204.0,62.0) |
| 120 | C | [-0.31235, 0.32512, -2.7522, -2.6439, 227.7, 147.9] | 0.4508, 3.8164 | 133.85° | (227.7,147.9) (165.2,212.9) (96.4,146.8) (158.9,81.8) |
| 121 | C | [-0.14825, 0.4263, -3.3813, -1.1758, 238.2, 144.75] | 0.4513, 3.5799 | 109.18° → down-left | (238.2,144.8) (208.5,230.0) (124.0,200.6) (153.7,115.4) |
| 122 | removed | | | | |

These are hand-animated keyframes, one per frame (no tweening between them). They follow the swatting hand: the box is about 80–105 × 90–110 px, with its long local-y axis across the push direction.

## Timeline / states (sprite 13 `mc_video`, 141 frames at 25 fps)
Labels: `start`=1, `start_loop`=14, `hit_left`=75, `hit_right`=115. Frames 70–74 and 112–114 are unreachable gaps.

Video mapping (the video is a frame-synced embedded stream, so sprite frame N shows exactly one video frame):
| sprite frames | clip | video frame index (0-based) |
|---|---|---|
| 1–69 | `video-idle.mp4` (69 frames) | N−1 |
| 75–110 (111) | `video-hit-left.mp4` (36 frames) | N−75 |
| 115–140 | `video-hit-right.mp4` (26 frames) | N−115 |

Frame scripts (an AS2 goto inside a frame script runs before that frame renders, so the frame carrying the jump is effectively replaced by its target):
- **frame 69**: `gotoAndStop("start_loop"); play();` → the idle loop is video frames 13…67 (55 frames, 2.2 s). Idle frame 68 is never shown.
- **frame 111**: `gotoAndStop("start"); play();` → after a left hit, playback restarts at frame 1, **including the 13-frame intro** (idle video frames 0–12), then loops.
- **frame 140**: `gotoAndStop("start_loop"); play();` → after a right hit, playback goes straight back to the loop (frame 14). Hit-right video frame 25 is never shown.

State machine (port as code; one tick = 1/25 s):
```
state IDLE_INTRO  (frames 1–13)  → IDLE_LOOP
state IDLE_LOOP   (frames 14–68, loops)
state HIT_LEFT    (frames 75–110; 36 ticks) → IDLE_INTRO (frame 1)
state HIT_RIGHT   (frames 115–139; 25 ticks) → IDLE_LOOP (frame 14)

on pc_rollin of hit zone LEFT  (sprite 7, x≈189–240): gotoAndPlay("hit_right")   // from ANY state, restarts it
on pc_rollin of hit zone RIGHT (sprite 9, x≈242–292): gotoAndPlay("hit_left")
```
- The naming is crossed. Entering the **left** half of the head triggers `hit_right`: his hand sweeps from screen-right to screen-left and the gutter pushes the cursor **left**. Entering the **right** half triggers `hit_left`: the hand sweeps from screen-left to screen-right and the gutter pushes **right**, curling down.
- `pc_rollin` fires only on the frame the cursor goes from outside to inside a zone (PC_Object heartbeat: `cursorsInside[i]==false` → inside). The initial value is undefined, so a cursor that starts inside never fires until it leaves and comes back.
- The zones stay active during hits. Re-entering a zone mid-swat restarts the corresponding hit from its first frame. On any state change, remove any existing gutter; the gutter exists only on the frames listed in the table.
- **Sound "hit"** (`hit.mp3`, 0.52 s) starts on frame 75 and on frame 115, once each time those frames are entered. Its StartSound envelope is a constant 16236/32768 ≈ **0.50 volume** on both channels.
- Hill and hit zones: placed at frame 1 and kept (never re-constructed) across all jumps.

## Main timeline scripts
- Frame 1: empty. Frames 1–2 just show `mc_video`.
- Frame 3 (buzz sound control; `this` = `_root`):
```
buzz = new Sound(_root)        // NOTE: a Sound bound to _root = GLOBAL volume/pan for the whole movie,
buzz.attachSound("snd_buzz")   //       so it also scales/pans the "hit" sound.
buzz.start(0, 99999)           // loop forever
buzz.setVolume(100)
if (_root != this) { stop(); } // only when loaded inside the examples shell; standalone: continue
every frame (25 Hz):
    rel = (cursor.x - mc_video.x) / mc_video.width        // mc_video.x = 0, width = 500 (video width)
    pan = clamp(round((rel - 0.5) * 2 * 100), -100, 100)  // Flash pan: -100 = full left, +100 = full right
    buzz.setPan(pan)
    if (cursor.x != oldX || cursor.y != oldY) {          // oldX/oldY start undefined → first tick counts as moved
        oldX = cursor.x; oldY = cursor.y
        buzz.setVolume(max(2, min(100, buzz.getVolume() * 2)))
    } else {
        buzz.setVolume(buzz.getVolume() / 1.2)
    }
```
  `cursor` is the PowerCursor mock cursor (`_root.cursor`), not the real mouse. Volume is 0–100. Flash probably truncates to an integer (uncertain). If so, when the cursor is still it decays 100→83→69→…→1→0 in about 20 ticks (0.8 s). When moving it climbs from 0 as 2,4,8,16,32,64,100 (7 ticks). Web Audio: use one master GainNode = vol/100 and a StereoPannerNode = pan/100 on the master bus, so both buzz and hit go through it.
- Frame 4: places Engine and cursor, then `stop()`.

## Assets (`public/demos/cursorbug/`)
| file | source | notes |
|---|---|---|
| `video-idle.mp4` | DefineVideoStream 3 (VP6, 69 frames) | H.264, 25 fps, **500×376**: 1 white row padded at the bottom because H.264 4:2:0 needs even dimensions. Draw at (0,0) and clip to 500×375 (or just let the stage edge at y=375 crop it). Top-left = stage (0,0). |
| `video-hit-left.mp4` | stream 10 (36 frames) | same format |
| `video-hit-right.mp4` | stream 12 (26 frames) | same format |
| `buzz.mp3` | sound 1, export name `snd_buzz` | 44.1 kHz mono, 7.55 s, loop |
| `hit.mp3` | sound 2, export name `hit` | 11 kHz mono, 0.52 s |
| `hit-zone-left.svg` | shape 5 | registration (25.45, 50), hit area only (alpha 0) |
| `hit-zone-right.svg` | shape 8 | registration (24.5, 50), hit area only (alpha 0) |

Drive video by frame index rather than free-running playback if possible (seek to frame/25 s), so the gutter keyframes stay locked to the hand. Toolkit classes used: PC_Engine, PC_ArrowCursor, PC_Hill, PC_Pushgutter, PC_ButtonMaker.

## Verification
- On load: the man sits still for about 0.5 s (intro), then fidgets in a 2.2 s loop. A buzz is audible; it fades out when you stop moving the mouse and swells as soon as you move. Moving left or right pans it across the speakers.
- Brush past the brass knob at top right (≈437,44): the cursor gets a small bump and slides off it.
- Move onto the right half of his face: the hit sound plays, his hand sweeps left-to-right, and the cursor is flung strongly to the right and then downward (frames 75–81, about 0.28 s). He settles back and the clip restarts with the short intro.
- Move onto the left half: his other hand sweeps right-to-left, and the cursor is flung left, then down-left. He returns straight to the loop.
- No force graphics are visible at any time. Only the cursor and video are drawn.
