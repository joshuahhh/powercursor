import "./style.css";
import { setupFlow } from "./flow";
import { PowerCursor, hill, hole, rails, sand, slick, target, wall, wordSnap, type Field } from "../dom";

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

const free = new URLSearchParams(location.search).has("free");
$<HTMLInputElement>("#free").checked = free;
$("#free").addEventListener("change", () => {
  location.search = $<HTMLInputElement>("#free").checked ? "?free" : "";
});

const pc = new PowerCursor({ input: free ? "free" : "lock" });

// The cursor stays over the same content as the page scrolls (and stops the scroll at the screen edge).
const scrollWith = $<HTMLInputElement>("#scrollwith");
scrollWith.checked = pc.scrollWithPage = localStorage.getItem("pc.scrollWithPage") === "1";
scrollWith.addEventListener("change", () => {
  pc.scrollWithPage = scrollWith.checked;
  localStorage.setItem("pc.scrollWithPage", scrollWith.checked ? "1" : "0");
});
// Until the cursor is taken, the demos sit under a "click to take the cursor" overlay.
const lockHint = $("#lockhint");
const escBtn = $("#escbtn");
const syncLock = () => {
  const locked = document.pointerLockElement != null;
  lockHint.hidden = free || locked;
  escBtn.hidden = !locked;
};
document.addEventListener("pointerlockchange", syncLock);
syncLock();
lockHint.addEventListener("click", (e) => pc.engage({ x: e.clientX, y: e.clientY }));
// Corner button for letting go (clicked with the simulated cursor).
escBtn.addEventListener("click", () => pc.release());

// --- small targets ---------------------------------------------------------------
const log = $("#log");
for (const b of $$(".winbtn, .tool")) {
  pc.attach(b, target());
  b.addEventListener("click", () => (log.textContent = `Clicked “${b.title}”.`));
}

// --- menu: disabled items are slick ---------------------------------------------------
for (const item of $$("#menu .item")) {
  if (item.classList.contains("disabled")) pc.attach(item, slick());
  else item.addEventListener("click", () => (log.textContent = `Menu: ${item.textContent}`));
}

/** A custom field: accelerate (px/s²) from anywhere in `host` towards `goal`'s centre. */
function towards(host: Element, goal: Element, strength: number): Field {
  return {
    kind: "towards",
    sample({ p }, out) {
      // p is relative to the host's centre; put the goal in the same frame.
      const h = host.getBoundingClientRect();
      const g = goal.getBoundingClientRect();
      const dx = g.left + g.width / 2 - (h.left + h.width / 2) - p.dx;
      const dy = g.top + g.height / 2 - (h.top + h.height / 2) - p.dy;
      const d = Math.hypot(dx, dy);
      if (d < 4) return;
      out.ax += (strength * dx) / d;
      out.ay += (strength * dy) / d;
    },
  };
}

// --- form: steer towards what still needs doing ------------------------------------------
const form = $<HTMLFormElement>("#form");
const submit = $<HTMLButtonElement>("#form .primary");
const formOut = $("#formout");
const syncValidity = () => submit.classList.toggle("incomplete", !form.checkValidity());
form.addEventListener("input", syncValidity);
syncValidity();

// Sign up repels while the form is incomplete, and attracts once it's complete.
{
  const attract = target({ strength: 800 });
  const repel = hill({ strength: 700, plateau: 0 });
  pc.attach(submit, {
    kind: "submit",
    sample: (ctx, out) => (form.checkValidity() ? attract : repel).sample!(ctx, out),
    enter: () => attract.enter?.(),
    leave: () => attract.leave?.(),
  });
}

/**
 * A custom field: a spring from anywhere in `host` to `goal`'s centre. The pull
 * grows with distance (k px/s² per px, capped), so the cursor glides there in
 * roughly the same time from near or far, slowing as it arrives.
 */
function springTo(host: Element, goal: Element, k: number, opts: { zeta?: number; max?: number; onArrive?: () => void } = {}): Field {
  const max = opts.max ?? 40000;
  // Damping ratio: 1 = no overshoot, below 1 = a little bounce. The cursor's
  // friction (50 ms half-life: 13.9/s) already damps; add (or remove) the rest.
  const damping = 2 * (opts.zeta ?? 1) * Math.sqrt(k) - Math.LN2 / 0.05;
  return {
    kind: "spring",
    sample({ p, vx, vy }, out) {
      const h = host.getBoundingClientRect();
      const g = goal.getBoundingClientRect();
      const dx = g.left + g.width / 2 - (h.left + h.width / 2) - p.dx;
      const dy = g.top + g.height / 2 - (h.top + h.height / 2) - p.dy;
      const d = Math.hypot(dx, dy);
      if (d < 4 && Math.hypot(vx, vy) < 60) opts.onArrive?.();
      if (d < 1) return;
      const a = Math.min(max, k * d);
      out.ax += (a * dx) / d - damping * vx;
      out.ay += (a * dy) / d - damping * vy;
    },
  };
}

/**
 * Temporarily pull the cursor from anywhere in `host` to `goal`, until it settles
 * there (or `timeout` ms pass). `stopGuiding` stops it early.
 */
let stopGuiding: (() => void) | null = null;
function guide(host: Element, goal: Element, opts: { k?: number; zeta?: number; timeout?: number; onArrive?: () => void } = {}) {
  stopGuiding?.();
  const arrive = () => {
    stopGuiding?.();
    opts.onArrive?.();
  };
  const detach = pc.attach(host, springTo(host, goal, opts.k ?? 30, { zeta: opts.zeta, onArrive: arrive }));
  const timer = setTimeout(() => stopGuiding?.(), opts.timeout ?? 2500);
  stopGuiding = () => {
    detach();
    clearTimeout(timer);
    stopGuiding = null;
  };
}

// Clicking it anyway pulls the cursor to the first field that needs filling in.

form.noValidate = true;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const missing = form.querySelector<HTMLElement>(":invalid");
  if (missing) {
    formOut.textContent = `Fill in your ${(missing as HTMLInputElement).name} first.`;
    formOut.classList.add("warn");
    guide(form, missing, { onArrive: () => missing.focus() });
    return;
  }
  const f = new FormData(form);
  formOut.classList.remove("warn");
  formOut.textContent = `Signed up ${f.get("name")}${f.get("news") ? ", with newsletter" : ""}.`;
});

// --- persuasive dialog ------------------------------------------------------------------
const dialog = $<HTMLDialogElement>("#confirm");
// An invisible stand-in for "anywhere on screen", for fields that act page-wide.
const viewport = document.body.appendChild(document.createElement("div"));
viewport.style.cssText = "position:fixed;inset:0;pointer-events:none;visibility:hidden;";
pc.attach(dialog, towards(dialog, $("#no"), 900));
pc.attach($("#no"), target({ strength: 1200 }));
pc.attach($("#yes"), sand({ gain: 0.6, roughness: 2 }));
$("#delete").addEventListener("click", () => {
  dialog.showModal();
  // On opening, steer the cursor across the page to Cancel.
  guide(viewport, $("#no"), { k: 80, zeta: 0.8 });
});
dialog.addEventListener("close", () => stopGuiding?.());
$("#yes").addEventListener("click", () => {
  dialog.close();
  $("#deleteout").textContent = "Everything deleted. (Not really.)";
});
$("#no").addEventListener("click", () => {
  dialog.close();
  $("#deleteout").textContent = "Phew.";
});

// --- textures ---------------------------------------------------------------------------
pc.attach($(".swatch.sand"), sand());
pc.attach($(".swatch.ice"), slick({ gain: 3 }));
pc.attach($(".round.hill"), hill({ strength: 900 }));
pc.attach($(".round.hole"), hole({ strength: 900 }));
// A deep hole: steep walls (strong, constant pull) and a sandy floor. Creeping out
// doesn't work; a fast flick does, since forces switch off above the speed limit.
{
  const walls = hole({ strength: 4000, profile: "constant", plateau: 0.1 });
  pc.attach($(".round.deep"), {
    kind: "deep-hole",
    sample(ctx, out) {
      walls.sample!(ctx, out);
      if (ctx.p.r < 0.5) out.gain *= 0.5;
    },
  });
}

// --- maze -------------------------------------------------------------------------------
const MAZE = ["#########", "#   #   #", "# # # # #", "# #   # #", "# ##### #", "#     # #", "##### # #", "#       #", "#### ####"];
const maze = $("#maze");
maze.style.gridTemplateColumns = `repeat(${MAZE[0].length}, 1fr)`;
for (const row of MAZE) {
  for (const c of row) {
    const cell = maze.appendChild(document.createElement("div"));
    if (c === "#") {
      cell.className = "wall";
      pc.attach(cell, wall());
    }
  }
}

// --- word snapping ---------------------------------------------------------------------
{
  const text = $("#snaptext");
  let detach = pc.attach(text, wordSnap({ wrap: true }));
  $("#snapdrag").addEventListener("change", (e) => {
    detach();
    detach = pc.attach(text, wordSnap({ wrap: true, whileDragging: (e.target as HTMLInputElement).checked }));
  });
  document.addEventListener("selectionchange", () => {
    const sel = getSelection();
    const s = sel && text.contains(sel.anchorNode) ? sel.toString().trim() : "";
    $("#snapout").textContent = s ? `Selected: “${s}”` : "";
  });
}

// --- tubes: rooms joined by warping tubes ----------------------------------------------
{
  // # wall, S way in, * goal; each letter is a tube mouth, joined to the other mouth with the same letter.
  const MAP = [
    "##S##########",
    "#   #   #b  #",
    "#   #  e#   #",
    "#b a#   #  c#",
    "#############",
    "#f  # a #   #",
    "#   #  h#   #",
    "#  g#d  #  h#",
    "#############",
    "#  c#f  #g  #",
    "#   #   # * #",
    "#e  #  d#   #",
    "#############",
  ];
  const CELL = 26;
  const W = MAP[0].length;
  const box = $("#tubes");
  box.style.width = `${W * CELL}px`;
  box.style.height = `${MAP.length * CELL}px`;
  const at = (r: number, c: number) => MAP[r]?.[c] ?? "#";
  const place = (cls: string, r: number, c: number, w = 1, h = 1) => {
    const el = box.appendChild(document.createElement("div"));
    el.className = cls;
    Object.assign(el.style, { left: `${c * CELL}px`, top: `${r * CELL}px`, width: `${w * CELL}px`, height: `${h * CELL}px` });
    return el;
  };

  // Walls, merged into horizontal runs.
  MAP.forEach((row, r) => {
    for (let c = 0; c < W; ) {
      if (row[c] !== "#") {
        c++;
        continue;
      }
      let e = c;
      while (row[e] === "#") e++;
      pc.attach(place("twall", r, c, e - c), wall());
      c = e;
    }
  });

  // Mouths face away from the wall(s) they're against.
  interface Mouth {
    el: HTMLElement;
    id: string;
    cx: number;
    cy: number;
    nx: number;
    ny: number;
    partner?: Mouth;
    path?: SVGPathElement;
    reverse?: boolean;
    /** Off after you come out of it, until you've moved away (else it'd suck you straight back in). */
    armed: boolean;
  }
  const mouths: Mouth[] = [];
  MAP.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (!/[a-z]/.test(ch)) return;
      let nx = (at(r, c - 1) === "#" ? 1 : 0) - (at(r, c + 1) === "#" ? 1 : 0);
      let ny = (at(r - 1, c) === "#" ? 1 : 0) - (at(r + 1, c) === "#" ? 1 : 0);
      const n = Math.hypot(nx, ny) || 1;
      [nx, ny] = [nx / n, ny / n];
      mouths.push({ el: place("mouth", r, c), id: ch, cx: (c + 0.5) * CELL, cy: (r + 0.5) * CELL, nx, ny, armed: true });
    }),
  );

  // Tubes: curves that leave each mouth back through its wall, all the same colour (follow them by eye).
  const NS = "http://www.w3.org/2000/svg";
  const svg = box.appendChild(document.createElementNS(NS, "svg"));
  for (const a of mouths) {
    const b = mouths.find((m) => m !== a && m.id === a.id)!;
    a.partner = b;
    if (b.path) {
      a.path = b.path;
      a.reverse = true;
      continue;
    }
    const L = 3.5 * CELL;
    const path = svg.appendChild(document.createElementNS(NS, "path"));
    path.setAttribute("d", `M${a.cx},${a.cy} C${a.cx - a.nx * L},${a.cy - a.ny * L} ${b.cx - b.nx * L},${b.cy - b.ny * L} ${b.cx},${b.cy}`);
    a.path = path;
    a.reverse = false;
  }

  /** A blob running along a tube, so you can see where you went. */
  function blob(m: Mouth) {
    const dot = svg.appendChild(document.createElementNS(NS, "circle"));
    dot.setAttribute("r", "6");
    dot.classList.add("blob");
    const len = m.path!.getTotalLength();
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 350);
      const p = m.path!.getPointAtLength((m.reverse ? 1 - k : k) * len);
      dot.setAttribute("cx", `${p.x}`);
      dot.setAttribute("cy", `${p.y}`);
      if (k < 1) requestAnimationFrame(step);
      else dot.remove();
    };
    requestAnimationFrame(step);
  }

  const out = $("#tubesout");
  let taken = 0;
  const suck = hole({ strength: 1500, plateau: 0 });
  for (const m of mouths) {
    pc.attach(
      m.el,
      {
        kind: "tube",
        // Each mouth is a hole that pulls you in; reach its centre and you go through.
        sample: (ctx, out) => m.armed && suck.sample!(ctx, out),
        warp(el, from, to) {
          if (!m.armed) return;
          const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const catchR = CELL * 0.2;
        if (Math.hypot(to.x - cx, to.y - cy) > catchR || Math.hypot(from.x - cx, from.y - cy) <= catchR) return;
          // Out of the partner's lip, drifting gently into its room.
          const p = m.partner!;
          const pr = p.el.getBoundingClientRect();
          p.armed = false;
          p.el.classList.remove("pop");
          void p.el.offsetWidth; // restart the animation
          p.el.classList.add("pop");
          blob(m);
          out.textContent = `Tubes taken: ${++taken}`;
          const lip = CELL * 0.3;
          return { x: pr.left + CELL / 2 + p.nx * lip, y: pr.top + CELL / 2 + p.ny * lip, vx: p.nx * 60, vy: p.ny * 60 };
        },
      },
      { onLeave: () => (m.armed = true) },
    );
  }

  MAP.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === "S")
        pc.attach(place("entry", r, c), { kind: "sensor" }, { onEnter: () => ((taken = 0), (out.textContent = "Find the ★.")) });
      if (ch === "*") {
        const goal = place("goal", r, c);
        goal.textContent = "★";
        pc.attach(goal, target({ strength: 900 }), { onEnter: () => (out.textContent = `Made it, through ${taken} tube${taken === 1 ? "" : "s"}!`) });
      }
    }),
  );
}

// --- rings: circles as rails -------------------------------------------------------------
{
  const svg = $<SVGSVGElement>("#rings");
  // [cx, cy, r]: big and small, a couple overlapping, one nested.
  const RINGS = [
    [80, 85, 58],
    [150, 52, 26],
    [250, 100, 62],
    [250, 100, 24],
    [180, 190, 38],
    [60, 200, 28],
    [300, 215, 18],
    [115, 205, 12],
  ];
  const circles = RINGS.map(([cx, cy, r]) => {
    const c = svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle"));
    c.setAttribute("cx", `${cx}`);
    c.setAttribute("cy", `${cy}`);
    c.setAttribute("r", `${r}`);
    return c;
  });
  pc.attach(svg, rails(() => circles, { onRide: (on) => circles.forEach((c) => c.classList.toggle("riding", c === on)) }));
}

// --- dataflow ------------------------------------------------------------------------------
setupFlow(pc, $("#flow"));

// For poking at it from the console.
(window as unknown as { pc: PowerCursor }).pc = pc;
