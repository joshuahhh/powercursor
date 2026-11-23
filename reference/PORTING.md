# Porting a PowerCursor demo

How the Flash demos map onto the TypeScript engine in `src/pc/`. Read
`src/demos/fan.ts` first: it is a complete, small, faithful port of
`reference/specs/fan.md`.

## Files

- `reference/specs/<demo>.md`: the reverse-engineered spec (layout, parameters, scripts).
- `public/demos/<demo>/`: the demo's assets (SVG exports keep the Flash registration
  point; `art()` reads it from the SVG, so place nodes at the spec's x/y).
- `public/lib/`: toolkit library art (objects and cursors draw themselves).
- `src/demos/<demo>.ts`: the port. Default-export a `Demo` (see `src/demos/types.ts`);
  it's picked up automatically (`import.meta.glob`) and ordered by `ORDER` in `src/demos/index.ts`.
- `public/original/<demo>.swf`: the original, shown next to the port with
  "Compare with original" (Ruffle).
- `reference/original/as2-source/`: the original toolkit source, the ground truth.

## Coordinates and nodes

`Node` (`src/pc/node.ts`) is a Flash MovieClip: `x`, `y`, `scaleX`, `scaleY`,
`rotation` (degrees, clockwise), `alpha` (0..1), `visible`, `name`, children,
`addChild`/`addChildAt`/`remove`, `globalToLocal`/`localToGlobal`, `hitTest(stageX,
stageY)` (shape flag: its `hitShape` and its children's), `onEnterFrame = (dtMs) => …`,
and events `on(type, fn)` / `emit(type, ev)`. Use `node.set({ x, y, scale, rotation, alpha })`.
Units are stage pixels; registration point = local (0,0). **Nest nodes exactly like the
Flash sprites** (child coordinates are relative to the parent) whenever behaviours,
local dimmers or timelines depend on the parent; flatten only when nothing depends on it.

- `await art(path, { hit: true })`: an image node; `hit: true` makes its alpha its hit area
  (Flash shape-flag hit testing, needed for WallMaker / ButtonMaker / EventDispatcher parents).
- `await clip(paths, { fps, labels, play })`: an image sequence (`gotoAndStop`, `play`, ...).
- `new Timeline({ frames, labels, fps, play })`: a Flash MovieClip timeline.
  `place(what, from, to?, depth?, keys?)` puts a node, or a factory `() => Node`, on a frame
  range. A factory makes a fresh instance each time the playhead enters the range, which is
  what Flash does (handlers and rollover state start over). Off-frame nodes leave the stage,
  so their forces stop. `keys` are per-frame keyframes (`{ 5: { x: 10, alpha: 0.5 } }`).
  `script(frame, fn)` is a frame action; a goto inside one defers the target frame's
  actions (AVM1 order). Labels are case-insensitive; a goto to an unknown label does nothing.
  It starts on frame 1 at the first tick (or `begin()`). ButtonMaker defaults to calling
  `gotoAndStop` on its node, so a Timeline is the natural parent for ButtonMaker.
- Text: make a `Node` and set `node.el` content/styles directly (it's a positioned div).
  Any DOM content works (text, `<video>`, etc.).
- Hit shapes (`src/pc/hit.ts`): `rect(x,y,w,h)`, `circle(cx,cy,r)`, `pathShape("M…")`,
  masks from art, `{ kind: "fn", test }`.

## Engine and cursor

`Demo` fields set the stage (`width`, `height`, `background`) and `fps` (the original movie's
frame rate: dynamics are normalised to it). `engine:` takes the PC_Engine parameters from the
spec (`baseForce`, `scaleToAlpha`, `combineForces: "Add"|"Strongest"|"Topmost"`,
`speedLimit: "low speed"|"average speed"|"high speed"|"never"`, `bouncingBalls`, `hideAllObjects`).

Add the cursor last so it's on top: `stage.addChild(await ArrowCursor.create({ grip, inertia, cursorStyle }))`,
then `engine.placeCursors(x, y)` for a sensible start point (pointer-lock mode starts it there).
Balls: `await PowerBall.create({ scale, tint, grip, inertia })` / `BallCursor.create(...)`.
Cursor styles: `Arrow`, `MacArrow`, `Finger`, `Ball`, `Hand`, `GrabHand` (`cursor.setCursorStyle`).

Objects and behaviours take part automatically while they are on the stage (the engine walks
the display tree every frame). Their order in the tree is their paint order (`Topmost`).

Rollover semantics follow AS2 exactly: an object's first look at a cursor fires no
`pc_rollin`; on rollin the cursor's style and sound become the object's (unset ones change
only the style name / stop the sound); on rollout every object resets the style to "Arrow"
and stops the sound. `ArrowCursor.setCursorStyle` only acts when the name changes;
`showStyle` changes just the picture.

## Toolkit classes → TS

Ready-made objects (`src/pc/objects.ts`), constructed with their AS2 parameter names:
`Hill`, `Hole`, `Twister`, `Target` (100×100, centre 50,50), `Gutter`, `Pushgutter` (200×25),
`Ramp`, `Sand`, `Slick`, `Wall`, `Dimmer` (100×100), `Wedge` (tip at 0,0), `Button` (100×20).
Common: `rolloverCursorStyle`, `rolloverCursorSound` (library sound name like `"pop"`).
`PC_Slope` = old name of `Ramp`.

Behaviours (`src/pc/behaviours.ts`), attached with `node.addBehaviour(new X(...))`:
`WallMaker`, `SlickMaker(strength, dirDep, angle)`, `SandMaker(rough, sticky, dirDep, angle)`,
`HillMaker(strength)`, `RampMaker(strength, angle)`, `ForceDimmer(factor, scope, dirDep, angle)`,
`ButtonMaker({ out, over, down, up, rolloverCursorStyle, goto? })`,
`EventDispatcher({ pc_mousedown: fn, ... })`, `DraggerMaker` (`onDragStart/onDragEnd`),
`Synchronizer(strength, subtle)`.

Events (emitted on the object, or on the behaviour's node): `pc_rollin`, `pc_rollover`,
`pc_rollout`, `pc_mousedown`, `pc_mouseup`, `pc_plateau`; on cursors `pc_forceStart`,
`pc_force`, `pc_forceEnd`. Event objects: `{ type, target, cursor, cursorIndex, x, y, xLastDisp, yLastDisp }`.
Global mouse: `stage.on("pc_mousedown" | "pc_mouseup", fn)`, `engine.mouseIsDown`.
Sounds: `playSound(name | path)` for one-shots.

AS2 → TS idioms: `_alpha` 0–100 → `alpha` 0–1; `_xscale` 100 → `scaleX` 1; `_visible` →
`visible`; colours are numbers (`0xDD2424`); `onEnterFrame` gets `dtMs`: for per-frame
counters from the original, accumulate time against `1000 / fps`, not display frames.

## Rules of thumb

- Faithful first: keep the spec's numbers. Where the original has a bug that changes the
  experience, keep it unless it breaks the demo, and leave a one-line comment.
- Don't edit `src/pc/`. If the engine is missing something, work around it in the demo
  and note it so it can be folded into the engine.
- Test headless with `playwright-cli -s <your-session>` (close it afterwards), on
  `http://powercursor.prusik.localhost:2000/#<demo>`. Pointer lock doesn't work headless, so
  set `localStorage["pc.input"] = "free"` and reload; then `page.mouse.move` drives the cursor.
  "Compare with original" shows the SWF (in headless, dismiss Ruffle's GPU warning with its ×).
