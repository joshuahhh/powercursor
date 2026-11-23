import "./style.css";
import { Engine, ForceGrid, Stage, asset, setMuted, type InputMode } from "./pc";
import { demos } from "./demos";
import type { Demo } from "./demos/types";

/** Where this port's source lives (shown in the banner). */
const REPO_URL = "https://github.com/joshuahhh/powercursor";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="banner">
    This is an unsanctioned, vibe-coded TypeScript port of
    <a href="https://www.powercursor.com/" target="_blank" rel="noreferrer">PowerCursor</a> by Koert van Mensvoort.
    ${REPO_URL ? `<a href="${REPO_URL}" target="_blank" rel="noreferrer">Source on GitHub</a>.` : ""}
  </div>
  <header class="top">
    <a class="brand" href="#home"><img src="${asset("lib/logo.png")}" alt="PowerCursor" /><em>design interfaces you can touch</em></a>
    <nav class="demos"></nav>
    <a class="next-api" href="dom.html" title="A prototype of an idiomatic, DOM-first PowerCursor API">DOM API →</a>
  </header>
  <main>
    <section class="player">
      <div class="panes">
        <figure class="pane port">
          <figcaption>TypeScript port</figcaption>
          <div class="stage-wrap"><div class="esc-button">Esc</div><div class="lock-hint"><div class="lock-card"><img src="${asset("lib/cursor/Finger.svg")}" alt="" /><strong>Click to take the cursor</strong><span>The page will capture your mouse so forces can push it around.<br />Press <kbd>Esc</kbd> to let go.</span></div></div></div>
        </figure>
        <figure class="pane original" hidden>
          <figcaption>Original Flash (via <a href="https://ruffle.rs" target="_blank" rel="noreferrer">Ruffle</a>)</figcaption>
          <div class="ruffle-wrap"></div>
        </figure>
      </div>
    </section>
    <aside class="info">
      <h1 class="title"></h1>
      <p class="desc"></p>
      <div class="controls">
        <label>Cursor
          <select name="input">
            <option value="lock">Pointer lock</option>
            <option value="free">Hidden system cursor (like Flash)</option>
          </select>
        </label>
        <label><input type="checkbox" name="forces" /> Show forces <kbd>F</kbd></label>
        <label><input type="checkbox" name="hide" /> Hide force objects</label>
        <label><input type="checkbox" name="sound" checked /> Sound</label>
        <label><input type="checkbox" name="compare" /> Compare with original</label>
        <button name="restart">Restart</button>
      </div>
      <p class="hint"></p>
    </aside>
  </main>`;

const nav = app.querySelector<HTMLElement>("nav.demos")!;
const wrap = app.querySelector<HTMLElement>(".stage-wrap")!;
const title = app.querySelector<HTMLElement>(".title")!;
const desc = app.querySelector<HTMLElement>(".desc")!;
const hint = app.querySelector<HTMLElement>(".hint")!;
const ctl = (name: string) => app.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
const originalPane = app.querySelector<HTMLElement>(".pane.original")!;
const ruffleWrap = app.querySelector<HTMLElement>(".ruffle-wrap")!;

const prefs = {
  get input(): InputMode {
    return (localStorage.getItem("pc.input") as InputMode) || "lock";
  },
  set input(v: InputMode) {
    localStorage.setItem("pc.input", v);
  },
};

for (const d of demos) {
  const a = document.createElement("a");
  a.href = `#${d.id}`;
  a.title = d.title;
  a.dataset.id = d.id;
  a.innerHTML = d.icon ? `<img src="${asset(`icons/${d.icon}`)}" alt="" />` : `<span>${d.title}</span>`;
  nav.appendChild(a);
}

let current: { demo: Demo; engine: Engine; stage: Stage; grid: ForceGrid | null; cleanup?: () => void } | null = null;
let loadSeq = 0;

async function load(demo: Demo) {
  const seq = ++loadSeq;
  unload();
  for (const a of nav.querySelectorAll("a")) a.classList.toggle("active", a.dataset.id === demo.id);
  title.textContent = demo.title;
  desc.textContent = demo.description;
  document.title = `${demo.title} — PowerCursor`;

  const stage = new Stage(demo.width, demo.height, demo.background);
  wrap.prepend(stage.el);
  const engine = new Engine(stage, { fps: demo.fps, ...demo.engine, input: prefs.input });
  engine.configure({ hideAllObjects: ctl("hide").checked || demo.engine?.hideAllObjects });
  current = { demo, engine, stage, grid: null };
  const cleanup = await demo.build({ stage, engine });
  if (seq !== loadSeq) {
    engine.destroy();
    return;
  }
  current.cleanup = cleanup || undefined;
  stage.on("lockchange", updateHint);
  stage.el.appendChild(escButton); // inside the stage, under the simulated cursor
  engine.onFrame(() => escButton.classList.toggle("hot", engine.locked && cursorOnEsc(engine)));
  setForces(ctl("forces").checked);
  engine.start();
  updateHint();
  if (ctl("compare").checked) showOriginal(demo);
}

function unload() {
  if (!current) return;
  current.cleanup?.();
  current.engine.destroy();
  current.stage.el.remove();
  current = null;
}

function setForces(on: boolean) {
  if (!current) return;
  current.grid?.remove();
  current.grid = null;
  if (on) current.grid = current.stage.addChild(new ForceGrid(current.engine));
}

// --- in-stage Esc button (pointer lock): click it with the simulated cursor to let go ---

const escButton = app.querySelector<HTMLElement>(".esc-button")!;

/** Is a mouse-linked cursor over the Esc button? (Stage coordinates.) */
function cursorOnEsc(engine: Engine): boolean {
  const s = current?.stage;
  if (!s) return false;
  const b = escButton.getBoundingClientRect();
  const r = s.el.getBoundingClientRect();
  const k = s.displayScale;
  return engine.cursors.some((c) => {
    if (!c.mouseLink) return false;
    const x = r.left + c.x * k;
    const y = r.top + c.y * k;
    // The hit area runs out to the stage's top-right corner (the cursor is clamped
    // there), so slamming the mouse into the corner always lands on it.
    return x >= b.left && x <= r.right + 1 && y >= r.top - 1 && y <= b.bottom;
  });
}

// Capture phase, so the click never reaches the demo.
wrap.addEventListener(
  "mousedown",
  (e) => {
    const engine = current?.engine;
    if (engine?.locked && cursorOnEsc(engine)) {
      e.stopPropagation();
      e.preventDefault();
      document.exitPointerLock();
    }
  },
  true,
);

function updateHint() {
  const e = current?.engine;
  if (!e) return;
  wrap.classList.toggle("locked", e.locked);
  wrap.classList.toggle("lock-mode", e.input === "lock");
  // Only the Flash-style mode needs explaining (the lock overlay covers the other).
  hint.textContent =
    e.input === "free" ? "Your real cursor is hidden over the stage; forces make the mock cursor drift from it. They re-sync when you leave and re-enter the stage, as in the original." : "";
}

// --- original via Ruffle ------------------------------------------------------

let rufflePromise: Promise<any> | null = null;
function ruffle(): Promise<any> {
  if (!rufflePromise) {
    rufflePromise = new Promise((resolve, reject) => {
      (window as any).RufflePlayer = (window as any).RufflePlayer || {};
      (window as any).RufflePlayer.config = { publicPath: asset("ruffle/"), polyfills: false, autoplay: "on", unmuteOverlay: "hidden", splashScreen: false, letterbox: "off", contextMenu: "off" };
      const s = document.createElement("script");
      s.src = asset("ruffle/ruffle.js");
      s.onload = () => resolve((window as any).RufflePlayer.newest());
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return rufflePromise;
}

async function showOriginal(demo: Demo) {
  ruffleWrap.replaceChildren();
  originalPane.hidden = !demo.original;
  if (!demo.original) return;
  const r = await ruffle();
  const player = r.createPlayer();
  player.style.width = `${demo.width}px`;
  player.style.height = `${demo.height}px`;
  ruffleWrap.replaceChildren(player);
  player.load({ url: asset(`original/${demo.original}`), allowScriptAccess: false, backgroundColor: demo.background, base: asset("original/") });
}

function hideOriginal() {
  ruffleWrap.replaceChildren();
  originalPane.hidden = true;
}

// --- controls -------------------------------------------------------------------

ctl("input").value = prefs.input;
ctl("input").addEventListener("change", () => {
  prefs.input = ctl("input").value as InputMode;
  current?.engine.setInputMode(prefs.input);
  updateHint();
});
ctl("forces").addEventListener("change", () => setForces(ctl("forces").checked));
ctl("hide").addEventListener("change", () => current?.engine.configure({ hideAllObjects: ctl("hide").checked }));
ctl("sound").addEventListener("change", () => setMuted(!ctl("sound").checked));
ctl("compare").addEventListener("change", () => (ctl("compare").checked && current ? showOriginal(current.demo) : hideOriginal()));
app.querySelector('[name="restart"]')!.addEventListener("click", () => current && load(current.demo));
document.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") {
    ctl("forces").checked = !ctl("forces").checked;
    setForces(ctl("forces").checked);
  }
});

function route() {
  const id = location.hash.slice(1) || demos[0].id;
  const demo = demos.find((d) => d.id === id) ?? demos[0];
  if (current?.demo !== demo) void load(demo);
}
window.addEventListener("hashchange", route);
route();
