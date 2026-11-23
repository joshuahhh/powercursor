# menu — "Menu with slick-disabled buttons"

Source: `menu.swf` (SWF v8, AS2). Decompiled from `$SCRATCH/out/menu`. Source FLA exists in `dl/ex/menu.zip` (not opened).

## Stage

| width | height | bg | fps |
|---|---|---|---|
| 600 | 400 | `#333333` | 25 |

Standalone: `Stage.scaleMode = "noScale"`, `Stage.align = "TL"`.

examplelist description: *"The disabled items in the drop-down menus are made slick, so that the cursor slides over them quickly. An example of assisted navigation."*

**What you experience:** a translucent grey panel (360x270) with a row of four white menu headers along its top: **Meat · Potatoe · Vegetable · Dessert**. The panel text reads "Use the dropdown menu's above to / **Select your Menu** / Meat / Potatoes / Vegetables / Dessert / This demo shows slick-disabled menu items." Clicking a header opens its drop-down. While a menu is open, hovering any other header switches to that header's drop-down. Hovering an item turns it dark with light text, and a short horizontal gutter snaps the cursor to the item's centre line for about 0.3 s. Disabled items ("X (sold out)", grey text) are **slick** for vertical motion, so the cursor glides over them. A thin grey bar at the bottom of each drop-down is a one-way **dimmer** that stops downward movement, so you can't slide off the bottom. Clicking an enabled item updates the panel text (e.g. "Meat" becomes " Chicken ") and opens a small white dialog "you selected: Chicken" with **Ok** and **Cancel** buttons. An invisible Target pulls the cursor towards **Ok**. Either button closes the dialog.

## Imports (toolkit classes)

| char id | class |
|---|---|
| 14 | `PC_Behaviours.PC_ButtonMaker` |
| 18 | `PC_Objects.PC_Gutter` |
| 20 | `PC_Objects.PC_Target` |
| 24 | `PC_Objects.PC_Slick` |
| 27 | `PC_Objects.PC_Dimmer` |
| 34 | `PC_System.PC_Engine` |
| 35 | `PC_Cursors.PC_ArrowCursor` |

## Demo-local symbols

| id | what | asset |
|---|---|---|
| shape 3 / sprite 4 | 90x90 square, vertical linear gradient `#ffffff` (top) to `#999999` (bottom). Every box in the demo (panel, headers, items, highlight, dialog, bottom bar) is this symbol scaled and colour-transformed | `menu-box-gradient.svg` |
| sprite 17 | menu label: one dynamic text field `menutext` (see Text). Frame script `menutext = _parent._name;` | text, no asset |
| sprite 19 | **header button** (27 frames) | composed |
| sprite 21 | **enabled menu item / dialog button** (27 frames) | composed |
| sprite 26 | **disabled menu item** (30 frames) | composed |
| sprite 28 | **"Terminator"** bottom bar of a drop-down (27 frames) | composed |
| sprite 29/30/31/32 | drop-downs Dessert / Vegetable / Meat / Potatoe | composed |
| sprite 23 | "you selected" dialog | composed |
| sprite 33 | the whole menu widget (panel + headers + state machine) | composed |
| sprite 2 `bol (MC)` | exported gradient ball, unused leftover | none |

Colour-transform notation: `c' = c·mult/256 + add` per channel.

- **White box** = box with `mult 0, add 255` (pure `#ffffff`, gradient hidden).
- **Highlight box** = box tinted per frame (see sprite 19/21 timeline). At rest it is `mult 64, add 0`, i.e. gradient `#404040` (top) to `#262626` (bottom).

## Display list (stage space, px)

Main timeline: frame 1 places sprite 33. Frame 2 places Engine and Cursor and runs `stop()`. Frame 3 only moves the Engine and is never reached.

| depth | node | x | y | scaleX | scaleY | alpha | renders with | notes |
|---|---|---|---|---|---|---|---|---|
| 1 (f2) | **PC_Engine** | 529 | 434 | 1 | 1.0008 | 1 | toolkit (offstage) | |
| 6 (f1) | **menu widget** (sprite 33) | 110 | 36 | 1 | 1 | 1 | container | filter **GlowFilter** black, blurX/Y 20, strength 1, outer, quality 3. Applies to everything inside: panel, headers, drop-downs, dialog |
| 151 (f2) | **PC_ArrowCursor** `PC_Cursor` | 370.5 | 59 | 1 | 1 | 1 | toolkit | |

### Inside sprite 33 (stage coords = local + (110, 36))

| depth | node | stage x | stage y | size / scale | alpha | renders with | notes |
|---|---|---|---|---|---|---|---|
| 1 | panel `background` (box) | 109.95 | 36 | sx 4.0003, sy 2.9985 → 360.03 x 269.87 | **0.6406** (alphaMult 164) | `menu-box-gradient.svg` | |
| 3 | text 6 "Select your Menu" | field 82–501.95 | field 86.75–133.75 | — | 1 | text | placed at local (-26, 52.75) |
| 4 | text 8, var `menuMeat` | field 80.05–500 | field 123.9–170.9 | — | 1 | text | local (-27.95, 89.9) |
| 5 | text 9, var `menuPotatoe` | 80.05–500 | 152.9–199.9 | — | 1 | text | local (-27.95, 118.9) |
| 6 | text 10, var `menuVegetable` | 80.05–500 | 185.9–232.9 | — | 1 | text | local (-27.95, 151.9) |
| 7 | text 11, var `menuDessert` | 80.05–500 | 220.9–267.9 | — | 1 | text | local (-27.95, 186.9) |
| 8 | text 12 "Use the dropdown menu's above to" | 82.05–502 | 62.05–87.05 | — | 1 | text | local (-25.95, 28.05) |
| 9 | text 13 "This demo shows slick-disabled menu items." | 82.05–502 | 262.5–327.5 | — | 1 | text | local (-25.95, 228.5) |
| 10 | **state slot**: one drop-down or the dialog, depending on frame (see Timeline) | | | | | | |
| 108 | header `Potatoe` (sprite 19) | 200 | 36 | sx 0.56161, sy 1 → 89.86 x 21.99 | 1 | composed | |
| 120 | header `Vegetable` (sprite 19) | 290 | 36 | same | 1 | | |
| 132 | header `Meat` (sprite 19) | 110 | 36 | same | 1 | | |
| 144 | header `Dessert` (sprite 19) | 380 | 36 | same | 1 | | |

Text field rects above are the field bounds, including Flash's 2 px gutter on each side. Headers sit at depths above the state slot, so drop-downs and the dialog draw **under** the header row.

### Header / enabled item / dialog button internals (sprites 19 and 21, local coords, before the instance's scale)

Sprites 19 and 21 have identical art. They differ only in their frame scripts.

| depth | node | local x,y | scale | frames present | notes |
|---|---|---|---|---|---|
| 1 | **PC_Gutter** (child) | 0, 0 | 0.80006 x 0.88 → 160.01 x 22 (local) | frames 6–13 only ("over" animation) | see params. Horizontal gutter, centre line at local y = 11 |
| 5 | white box `Halloo` | 0, 0 | 1.7778 x 0.24435 → 160.0 x 21.99 | always | colour `mult 0 add 255` (white) |
| 7 | highlight box | 0, 0 | 1.778 x 0.24455 → 160 x 22.0 | frames 6–22 | colour tween (below) + **BevelFilter** inner: blur 2, distance 1, angle 45°, strength 1, highlight `#ffffff`, shadow `#000000`, quality 3 |
| 9 | **PC_ButtonMaker** (child) | 142, 18 | 0.41177 | always | icon unloaded at runtime. Its hit area is the whole parent clip |
| 11 | label (sprite 17) | 8, 2.55 | 1 | always | **blend mode 10 = INVERT**. Its black text inverts what lies beneath: black on the white box, light grey (≈`#bfbfbf`–`#d9d9d9`) on the dark highlight |

Highlight colour tween (depth 7):

| frame | mult (r=g=b) | add | resulting top / bottom colour |
|---|---|---|---|
| 6 | 0 | 255 | white / white |
| 7 | 21 | 170 | ≈ `#bfbfbf` / `#b6b6b6` |
| 8 | 43 | 85 | ≈ `#80` / `#6f` |
| 9–22 | 64 | 0 | `#404040` / `#262626` |

### Disabled item internals (sprite 26, local)

| depth | node | local x,y | scale | frames present | notes |
|---|---|---|---|---|---|
| 1 | **PC_Slick** (child) | 0, 0 | 1.5998 x 0.2198 → 159.98 x 21.98 | frames 1–20 (removed at "down") | see params |
| 5 | white box `Halloo` | 0, 0 | 1.7778 x 0.24435 | always | white |
| 7 | **PC_ButtonMaker** (child) | 143.35, 17 | 0.47058 | always | |
| 9 | text 25 (var `menutext`) | 10, 4 | 1 x 0.99751 | always | grey `#bbbbbb`, no invert blend, no highlight |

Frame 1 script: `menutext = this._name; menutext = menutext.concat(" (sold out)", "  ");` → e.g. `"Kiwiflip (sold out)  "`.

### "Terminator" bar internals (sprite 28, local)

| depth | node | local x,y | scale | notes |
|---|---|---|---|---|
| 1 | **PC_Dimmer** `ramp` (child) | 0, 0 | 1.6 x 0.10001 → 160 x 10.0 | see params |
| 3 | box `Halloo` (no colour transform) | 0, 0 | 1.7778 x 0.11099 → 160 x 9.99 | grey gradient bar, white to `#999` |
| 5 | **PC_ButtonMaker** (child) | 142, 18 | 0.41177 | |

No text. No visual state change. Frame 6 `play()` and frame 14 `stop()` only.

### Drop-downs (sprites 29–32). Item rows in **stage** coords.

Each drop-down is placed in sprite 33 at the given local position, with **DropShadowFilter**: black, blur 10, distance 5, angle 45°, strength 0.398, quality 3. Each row's instance name is its label. Width = 160 · sx.

**Meat** (`myMeat`, sprite 31, local (20, 41), stage origin (130, 77)):

| item | kind | x | y | sx | sy | w x h |
|---|---|---|---|---|---|---|
| Chicken | enabled | 110 | 59.25 | 1.2346 | 1 | 197.54 x 21.99 |
| Pork | enabled | 110 | 81 | 1.2343 | 1 | 197.49 x 21.99 |
| Beef | **disabled** | 110 | 103 | 1.2346 | 1 | 197.54 x 21.99 |
| Tofu | enabled | 110 | 125 | 1.2343 | 1 | 197.49 x 21.99 |
| Shrimp | enabled | 110 | 147 | 1.2343 | 1 | 197.49 x 21.99 |
| Terminator | bar | 110 | 169 | 1.235 | 1 | 197.60 x 9.99 |

**Potatoe** (`myPotatoe`, sprite 32, local (110, 41), stage origin (220, 77)):

| item | kind | x | y | sx | sy | w x h |
|---|---|---|---|---|---|---|
| Mashed | **disabled** | 200 | 59 | 1.2346 | 1 | 197.54 x 21.99 |
| Cooked | enabled | 200 | 81 | 1.2343 | 1 | 197.49 x 21.99 |
| Fried | enabled | 200 | 103 | 1.2343 | 1 | |
| Baked | enabled | 200 | 125 | 1.2343 | 1 | |
| Terminator | bar | 200 | 146 | 1.235 | 1 | 197.60 x 9.99 |

**Vegetable** (`myVegetable`, sprite 30, local (197, 41), stage origin (307, 77)):

| item | kind | x | y | sx | sy |
|---|---|---|---|---|---|
| Spinach | enabled | 287 | 59.25 | 1.2346 | 1 |
| BlackPeas | enabled | 287 | 81 | 1.2343 | 1 |
| CucumberSalad | **disabled** | 287 | 103 | 1.2346 | 1 |
| TomatoSalad | enabled | 287 | 125 | 1.2343 | 1 |
| Asparagus | enabled | 287 | 147 | 1.2343 | 1 |
| Sprouts | **disabled** | 287 | 169 | 1.2342 | 0.99591 |
| Broccoli | **disabled** | 287 | 191 | 1.2342 | 0.99591 |
| Mushrooms | enabled | 287 | 213 | 1.2343 | 1 |
| Eggplant | enabled | 287 | 235 | 1.2343 | 1 |
| Terminator | bar | 287 | 257 | 1.235 | 1 |

**Dessert** (`myDessert`, sprite 29, local (285, 41), stage origin (395, 77)):

| item | kind | x | y | sx | sy |
|---|---|---|---|---|---|
| Applepie | enabled | 375 | 59.25 | 1.2346 | 1 |
| Kiwiflip | **disabled** | 375 | 81 | 1.2346 | 1 |
| OrangeCake | enabled | 375 | 103 | 1.2346 | 1 |
| Caramelpudding | enabled | 375 | 125 | 1.2343 | 1 |
| DameBlanche | **disabled** | 375 | 147 | 1.2342 | 0.99591 |
| GreenTeaCake | **disabled** | 375 | 169 | 1.2342 | 0.99591 |
| ChocolateCake | enabled | 375 | 191 | 1.2343 | 1 |
| BananaFlip | enabled | 375 | 213 | 1.2343 | 1 |
| StrawberryPie | enabled | 375 | 235 | 1.2343 | 1 |
| Terminator | bar | 375 | 257 | 1.235 | 1 |

All sy=1 rows are 21.99 tall and sy 0.99591 rows are 21.90 tall. The first row overlaps the header bottom (y 58) by about 1 px, and the headers draw on top. The Vegetable drop-down is 3 px left of its header (287 vs 290) and Dessert is 5 px left (375 vs 380). That is in the original.

### Dialog (sprite 23, at local (82, 71) in sprite 33 → stage origin (192, 107))

| depth | node | stage x | stage y | scale / size | alpha | notes |
|---|---|---|---|---|---|---|
| 1 | **PC_Target** (child) | 32.15 | -49.9 | 4.4183 → 441.83 px square, centre **(253.06, 171.0)** | 0.461 (alphaMult 118) | invisible (style None, bullseye off). Its centre is about 4 px from the Ok button centre (248.97, 174.5) |
| 9 | dialog box (box) | 185 | 107 | sx 2.5117, sy 1 → 226.05 x 90 | 1 | filters in order: **DropShadow** black, blur 10, dist 5, 45°, strength 1; then **ColorMatrix** `+100` on R,G,B (identity otherwise). The box becomes ≈ white (`#ffffff` to `#fdfdfd`), and the shadow is lifted to ≈ rgb(100,100,100) |
| 11 | button `Ok` (sprite 21) | 205.05 | 163.5 | sx 0.54897 → 87.84 x 21.99 | 1 | **DropShadow** black blur 5, dist 5, 45°, strength 0.207; **Glow** black blur 2, strength 1 (thin dark outline) |
| 23 | text 22 (var `okmenutext`) | field 187.94–405.98 | field 119–159.1 | sx 1.0797 | 1 | frame script `okmenutext = _parent.selected;` |
| 24 | button `Cancel` (sprite 21) | 304.05 | 163.5 | same as Ok | 1 | same filters |

The Ok/Cancel labels come from sprite 17 (`menutext = _parent._name`): `"Ok"` and `"Cancel"`.

### Toolkit parameters (`on(construct)`)

**PC_Engine:** `bouncingBalls=true, hideRealCursor=true, baseForce=100, combineForces="Add", speedLimit="average speed", scaleToAlpha=false, hideAllObjects=false`

**PC_ArrowCursor `PC_Cursor`:** `cursorStyle="Arrow", grip=50, inertia=10, __mouseasforce=false, visible=true, minHeight=0, minWidth=0`

**PC_ButtonMaker in headers (sprite 19) and enabled items (sprite 21):** `outframe="out", overframe="over", downframe="down", upframe="up", rolloverCursorSound="crackle", rolloverCursorStyle="Default", visible=true, minHeight=0, minWidth=0`

**PC_ButtonMaker in disabled items (26) and Terminator (28):** same, but `rolloverCursorSound=""`.

**PC_Gutter (in 19 and 21, frames 6–13):** `strength=4, plateauDiameter=5, shape="U-shaped", graphicsStyle="None", tint=14492708 (#DD2424), rolloverCursorSound="nerve.wav", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`

**PC_Slick (in 26):** `strength=6, directionDependency="Two-way", dirDepAngle=180, style="Block with shading", tint=14492708, rolloverCursorSound="tickle", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`
- Two-way at 180° means vertical motion (up or down) gets the full effect and horizontal motion none. At full alignment, `surfaceGrip = 1 - 6/(6+2) = 0.25`.
- `"Block with shading"` is not a valid Slick style. Because of the `if (__style = "Icy")` assignment bug in `PC_Slick.draw()`, no tinted square is drawn but the **Icy shading overlay is**. The overlay sits at depth 1, under the opaque white box (depth 5), so nothing is visible.

**PC_Dimmer `ramp` (in 28):** `scope="Mouse", dimmingFactor=0, directionDependency="One-way", dirDepAngle=180, tint=14492708, rolloverCursorSound="", rolloverCursorStyle="Ball", visible=true, minHeight=0, minWidth=0`
- One-way at 180° means downward motion. While moving straight down over the bar, mouse movement is dimmed to 0% (the cursor stops). Moving up is unaffected. Diagonals get partial dimming: alignment = sqrt(1 − angleDiff/180).
- Its tinted visualisation square is under the opaque grey bar, so it is not visible.

**PC_Target (dialog):** `strength=35, plateauDiameter=5, shape="Sine-shaped", style="None", showBullseye=false, tint=14492708, rolloverCursorSound="", rolloverCursorStyle="Null", visible=true, minHeight=0, minWidth=0`
- The plateau is 5 local units, about 22 px wide on stage. When the cursor reaches the plateau, the Target sets its own strength to 0 (PC_Target.applyForce) and hides its visuals. Strength is restored on the Target's next `pc_rollout`/`pc_rollin`.
- Its 10%-white plateau disc is hidden under the dialog box.

## Timelines / state

### Sprite 33 (menu widget). Frame labels (case as written):

| frame | label | content in slot depth 10 | script |
|---|---|---|---|
| 1 | — | empty | — |
| 2 | — | empty | defines `SetMenu`, `buttondown = false; selected = "niks"; stop();` |
| 10 | `ok` | dialog (sprite 23) | `stop()` |
| 18 | `Dessert` | `myDessert` (29) | `stop()` |
| 27 | `vegetable` (lower-case!) | `myVegetable` (30) | `stop()` |
| 35 | `Meat` | `myMeat` (31) | `stop()` |
| 45 | `Potatoe` | `myPotatoe` (32) | `stop()` |

Headers call `gotoAndPlay(this._name)` with `"Vegetable"` against the label `"vegetable"`. AVM1 frame-label lookup is case-insensitive, so this works. **Match labels case-insensitively** (or just map header name to state).

```
function SetMenu(type, what):          // type = drop-down instance name, what = item name
    trace("menu:" + type + " " + what)
    selected = "you selected: " + what + ""
    if type == "myPotatoe":   menuPotatoe   = "with " + what + " Potatoes"
    if type == "myMeat":      menuMeat      = " " + what + " "
    if type == "myVegetable": menuVegetable = "and " + what + " "
    if type == "myDessert":   menuDessert   = "" + what + " for dessert "
    if what == "Ok" or what == "Cancel":
        gotoAndPlay(1)        // closes dialog/drop-down; frame 2 resets buttondown=false, selected="niks"
    else:
        gotoAndStop("ok"); play();   // net effect: show dialog, stopped at "ok" (frame 10's stop() runs after play())
```

The `menu*` variables are bound to panel text fields 8–11 and persist (frame 2 doesn't reset them). Their initial values are the field texts: "Meat", "Potatoes", "Vegetables", "Dessert".

Assigning a plain string to these HTML fields renders it in the field's default format (Garamond 30, centred, black).

### Sprite 19 (header). ButtonMaker calls `gotoAndStop(<frame>)`.

| frame | label | display | script |
|---|---|---|---|
| 1 | — | white box + label | — (ButtonMaker constructor immediately `gotoAndStop("out")`) |
| 2 | `out` | white box + label (black text) | — |
| 6 | `over` | + Gutter (d1), + highlight (d7) fading in frames 6→9 | `if (_parent.buttondown) _parent.gotoAndPlay(this._name); play();` |
| 14 | `overready` | Gutter removed; highlight stays dark | `stop()` |
| 18 | `down` | highlight dark | `_parent.buttondown = true; _parent.gotoAndPlay(this._name);` (opens this header's menu) |
| 23 | `up` | highlight removed (white again while still hovered) | — |

### Sprite 21 (enabled item, Ok, Cancel). Same frames and display as 19. Scripts:

- frame 6 `over`: `play()`
- frame 14 `overready`: `stop()`
- frame 18 `down`: `_parent._parent.SetMenu(_parent._name, this._name)`
  - For items: `_parent` is the drop-down (`myMeat` etc.), `_parent._parent` is sprite 33.
  - For Ok/Cancel: `_parent` is the unnamed dialog instance, so `type` is something like `"instance12"` and only the Ok/Cancel branch applies.

### Sprite 26 (disabled item): labels `out` 2, `over` 6 (`play()`), `overready` 17 (`stop()`), `down` 21 (Slick removed), `up` 26.

- No visual change in any state.
- Clicking a disabled item does nothing except remove its Slick until the next out/over.
- After `up` the clip is stopped at frame 26 (ButtonMaker uses `gotoAndStop`), so the Slick stays gone until rollout puts it back on `out` (frame 2).

### Sprite 28 (Terminator): labels `out` 2, `over` 6 (`play()`), `overready` 14 (`stop()`), `down` 18, `up` 23. No visual change.

### Interaction flow summary

1. Rest: sprite 33 at frame 2, no drop-down, `buttondown=false`.
2. Click a header: its `down` frame sets `buttondown=true` and jumps sprite 33 to that header's label, showing the drop-down.
3. While `buttondown` is true, rolling into any header (its `over` frame) switches the drop-down. Nothing closes a drop-down on rollout.
4. Click an enabled item: `SetMenu` updates the panel line and shows the dialog (the drop-down is replaced; slot depth 10 holds one thing). `buttondown` **stays true**, so hovering a header while the dialog is up replaces the dialog with that drop-down.
5. Click Ok or Cancel: `gotoAndPlay(1)` back to rest, `buttondown=false`. The selection was already applied in step 4. Ok and Cancel behave identically.

## Text

All text fields are **dynamic HTML device-font fields** (no embedded glyphs, `useOutlines=false`). Render with web fonts / system fonts. JPEXS SVGs contain *no* text for them.

| id | where | initial text | font | size | colour | align | other |
|---|---|---|---|---|---|---|---|
| 6 | panel | **Select your Menu** (bold `<b>`) | Garamond | 30 | `#000000` | center | field 419.95 x 47, leading 4, multiline, wordWrap |
| 8 | panel, var `menuMeat` | Meat | Garamond | 30 | `#000000` | center | same box |
| 9 | panel, var `menuPotatoe` | Potatoes | Garamond | 30 | `#000000` | center | |
| 10 | panel, var `menuVegetable` | Vegetables | Garamond | 30 | `#000000` | center | |
| 11 | panel, var `menuDessert` | Dessert | Garamond | 30 | `#000000` | center | |
| 12 | panel | Use the dropdown menu's above to | Garamond | 18 | `#000000` | center | field 419.95 x 25, leading 4 |
| 13 | panel | This demo shows slick-disabled menu items. | Garamond | 18 | `#000000` | center | field 419.95 x 65, leading −1 |
| 16 | sprite 17 label (headers, items, Ok/Cancel), var `menutext` = parent instance name | e.g. "Meat", "Potatoe", "Vegetable", "Dessert", "Chicken", "Ok", "Cancel" | Helvetica 65 Medium | 15 | `#000000` (displayed via INVERT blend) | left | field (−2,−2)–(150.25,20) at (2,2) in sprite 17. Single line, no wrap |
| 25 | disabled item, var `menutext` | "<Name> (sold out)  " | Helvetica 65 Medium | 15 | `#bbbbbb` | left | field (−2,−2)–(160,18.05) at (10,4). **wordWrap + multiline on**, height ≈ 20 |
| 22 | dialog, var `okmenutext` | "you selected: <Item>" | Helvetica 65 Medium | 15 | `#000000` | center | field (−2,−2)–(199.95,38.1), single line |

Font notes:
- Fonts are "Garamond" (bold for text 6) and "Helvetica 65 Medium" (Linotype Neue Helvetica naming). Use e.g. `Garamond, "EB Garamond", serif` and `"Helvetica Neue", Helvetica, Arial, sans-serif` at weight 500.
- **Text scaling (uncertain):** label fields sit inside instances with non-uniform x-scale (headers 0.5616, items 1.2346, Ok/Cancel 0.549). The original thumbnail (`dl/ex/menu.jpg`) shows header and item labels at normal proportions, not condensed or stretched. Device-font text in Flash does not distort, so render labels **unscaled at 15 px**, with their left edge at item-left + 10·sx (2 px gutter + 8 px offset, scaled) and top ≈ item-top + 4.55.
- Long disabled labels such as "CucumberSalad (sold out)" (and probably "GreenTeaCake (sold out)" / "DameBlanche (sold out)") are wider than the 162 px field. With wordWrap they would wrap, and the second line would be clipped by the ~20 px field height. The thumbnail shows "CucumberSal…" cut by the crop, so this is not confirmed. Recommended: single line, clipped to the item.

## Assets — `/public/demos/menu/`

| file | source | intrinsic size | registration offset (tx,ty) | use |
|---|---|---|---|---|
| `menu-box-gradient.svg` | shape 3 | 90 x 90 | (0, 0) | every box. Draw scaled per the tables, with the stated colour transforms (white = solid `#fff`; highlight = gradient·0.25; panel = alpha 0.6406; dialog = +100 brightness; Terminator = untouched) |

Everything else is toolkit art (hidden) or text.

## Unusual / notes

- **INVERT blend** on labels (blend mode 10) is how hovered items get light text on dark. Simplest port: black text normally, and `#bfbfbf`→`#d9d9d9` (or flat ≈ `#ccc`) text while the highlight is at rest. During the 3-frame fade the text colour is `255 − highlightColour`.
- The **Gutter exists only during frames 6–13** of the over state: 8 frames ≈ 0.32 s after each rollin. It is a brief snap to the row's centre line, not a permanent groove.
- Header click turns the header white again at `up` (highlight removed at frame 23) even though the cursor is still over it.
- No demo sounds (`sounds/-1.wav` is an empty header). Toolkit sounds referenced: `crackle` (headers/items rollover), `nerve.wav` (Gutter), `tickle` (Slick).
- `trace("menu:" ...)` in `SetMenu` is debug output only.
- `rolloverCursorStyle="Null"` (capital N) is passed to Gutter/Slick/Target. `PC_Object` compares against lower-case `"null"`, so it will call `setCursorStyle("Null")`. Engine semantics decide what that does.
- Exported `bol (MC)` (114 px radial white→black ball, `numSpeed = 1.1`) is a template leftover and unused.

## Verification

1. A 600x400 `#333` stage with a translucent grey panel at (110,36)–(470,306) carrying a soft dark glow. Four white headers along its top read Meat / Potatoe / Vegetable / Dessert. The panel text is centred around x ≈ 292, with "Select your Menu" in bold Garamond.
2. Hovering a header (before any click) darkens it and turns its text light. Nothing opens.
3. Clicking "Vegetable" opens a 10-row drop-down at x 287. CucumberSalad / Sprouts / Broccoli show grey "(sold out)" text. Moving the cursor vertically across them, it slips and accelerates (low grip). Horizontally it doesn't.
4. With a menu open, sliding along the header row swaps the open drop-down.
5. Moving down onto the grey bar at the bottom of a drop-down stops the cursor. Moving back up is free.
6. Entering an enabled row gives a brief tug to the row's vertical centre (≈0.3 s), then nothing.
7. Clicking "Chicken" changes the panel line "Meat" to " Chicken " and shows a white dialog "you selected: Chicken". The cursor is pulled toward Ok. Clicking Ok or Cancel closes it.
