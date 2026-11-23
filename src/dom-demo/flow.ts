import { rails, type PowerCursor } from "../dom";

/*
 * A nodes-and-wires editor (just the UI: nothing is computed). Nodes drag by
 * their title bars and snap to the grid. Wires are rails: get close and you
 * snap on, travel along them by pushing roughly their way, push across to leave.
 */

interface NodeSpec {
  id: string;
  title: string;
  x: number;
  y: number;
  ins: string[];
  outs: string[];
  body?: string;
}

const NODES: NodeSpec[] = [
  { id: "slider", title: "Slider", x: 20, y: 30, ins: [], outs: ["value"], body: '<div class="fake-slider"><span></span></div>' },
  { id: "number", title: "Number", x: 20, y: 170, ins: [], outs: ["value"], body: '<div class="fake-number">3.0</div>' },
  { id: "time", title: "Time", x: 20, y: 270, ins: [], outs: ["t"] },
  { id: "add", title: "Add", x: 220, y: 60, ins: ["a", "b"], outs: ["sum"] },
  { id: "sine", title: "Sine", x: 220, y: 220, ins: ["x"], outs: ["y"] },
  { id: "mul", title: "Multiply", x: 420, y: 130, ins: ["a", "b"], outs: ["product"] },
  { id: "display", title: "Display", x: 620, y: 60, ins: ["value"], outs: [], body: '<div class="fake-display">4.21</div>' },
  { id: "plot", title: "Plot", x: 620, y: 210, ins: ["y"], outs: [], body: '<svg viewBox="0 0 80 30"><path d="M0 15 Q10 0 20 15 T40 15 T60 15 T80 15" /></svg>' },
];

const WIRES: [string, string][] = [
  ["slider.value", "add.a"],
  ["number.value", "add.b"],
  ["number.value", "sine.x"],
  ["time.t", "mul.b"],
  ["add.sum", "mul.a"],
  ["sine.y", "plot.y"],
  ["mul.product", "display.value"],
];

interface Port {
  el: HTMLElement;
}

interface Wire {
  from: Port;
  to: Port;
  path: SVGPathElement;
}

const NS = "http://www.w3.org/2000/svg";
/** Grid spacing, px (matches the canvas's dotted background). */
const GRID = 20;
/** How strongly dragging favours grid points: 1 = no snapping, higher = stickier. */
const SNAP_K = 8;

/**
 * Soft rounding: continuous and monotonic, through every grid point, but flat
 * near them and steep in between, so a dragged node mostly sits on the grid and
 * flicks across to the next point.
 */
function softSnap(v: number): number {
  const n = Math.floor(v / GRID);
  const t = v / GRID - n;
  const a = t ** SNAP_K;
  return (n + a / (a + (1 - t) ** SNAP_K)) * GRID;
}

export function setupFlow(pc: PowerCursor, root: HTMLElement) {
  const svg = root.appendChild(document.createElementNS(NS, "svg"));
  const ports = new Map<string, Port>();

  // --- nodes ---
  let dragging: {
    node: HTMLElement;
    /** Grab point within the node. */
    ox: number;
    oy: number;
    /** Dragged by the simulated cursor (which we can move), not the real pointer. */
    simulated: boolean;
    /** Where the simulated cursor would be without snapping (viewport px). */
    raw: { x: number; y: number };
  } | null = null;
  // Spread the layout (designed for ~770px) across the canvas's actual width.
  const maxX = Math.max(...NODES.map((n) => n.x));
  const sx = Math.max(0.6, (root.clientWidth - 150 - 20) / (maxX - 20));
  for (const spec of NODES) {
    const node = root.appendChild(document.createElement("div"));
    node.className = "node";
    const snap = (v: number) => Math.round(v / GRID) * GRID;
    node.style.left = `${snap(20 + (spec.x - 20) * sx)}px`;
    node.style.top = `${snap(spec.y)}px`;
    const row = (name: string, dir: "in" | "out") => `<div class="row ${dir}"><span class="port ${dir}" data-port="${spec.id}.${name}"></span>${name}</div>`;
    node.innerHTML = `<div class="title">${spec.title}</div>${spec.body ?? ""}<div class="rows"><div>${spec.ins.map((n) => row(n, "in")).join("")}</div><div>${spec.outs.map((n) => row(n, "out")).join("")}</div></div>`;
    for (const el of node.querySelectorAll<HTMLElement>(".port"))
      ports.set(el.dataset.port!, { el });

    // Drag by the title bar. Plain pointer events: the simulated cursor sends them too.
    const title = node.querySelector<HTMLElement>(".title")!;
    title.addEventListener("pointerdown", (e) => {
      const r = node.getBoundingClientRect();
      dragging = { node, ox: e.clientX - r.left, oy: e.clientY - r.top, simulated: !e.isTrusted, raw: { x: e.clientX, y: e.clientY } };
      node.parentElement!.appendChild(node); // to the front
      node.classList.add("dragging");
    });
  }
  // Whole grid cells, so every edge of a node lines up with the dots.
  for (const node of root.querySelectorAll<HTMLElement>(".node")) {
    node.style.width = `${Math.ceil(node.offsetWidth / GRID) * GRID}px`;
    node.style.height = `${Math.ceil(node.offsetHeight / GRID) * GRID}px`;
  }

  /** Where a node goes for an unsnapped top-left position: soft-snapped, kept inside the canvas. */
  const place = (node: HTMLElement, x: number, y: number) => {
    const r = root.getBoundingClientRect();
    const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));
    return {
      x: clamp(softSnap(clamp(x, r.width - node.offsetWidth)), r.width - node.offsetWidth),
      y: clamp(softSnap(clamp(y, r.height - node.offsetHeight)), r.height - node.offsetHeight),
    };
  };

  // Dragging with the simulated cursor: the cursor itself is snapped, by the same
  // function as the node, so it stays on the same spot of the node. The mouse
  // moves a hidden unsnapped position; the cursor shows its snapped version.
  pc.attach(root, {
    kind: "drag-snap",
    warp(_el, from, to) {
      if (!dragging?.simulated) return;
      const d = dragging;
      const r = root.getBoundingClientRect();
      d.raw.x += to.x - from.x;
      d.raw.y += to.y - from.y;
      // Don't let the hidden position run off past the canvas edges.
      d.raw.x = r.left + d.ox + Math.max(0, Math.min(r.width - d.node.offsetWidth, d.raw.x - r.left - d.ox));
      d.raw.y = r.top + d.oy + Math.max(0, Math.min(r.height - d.node.offsetHeight, d.raw.y - r.top - d.oy));
      const p = place(d.node, d.raw.x - r.left - d.ox, d.raw.y - r.top - d.oy);
      return { x: r.left + p.x + d.ox, y: r.top + p.y + d.oy, vx: 0, vy: 0 };
    },
  });

  document.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const r = root.getBoundingClientRect();
    const { node } = dragging;
    const x = e.clientX - r.left - dragging.ox;
    const y = e.clientY - r.top - dragging.oy;
    // The simulated cursor arrives already snapped (above); the real pointer can't be, so snap the node alone.
    const p = dragging.simulated ? { x, y } : place(node, x, y);
    node.style.left = `${p.x}px`;
    node.style.top = `${p.y}px`;
    layoutWires();
  });
  document.addEventListener("pointerup", () => {
    if (!dragging) return;
    const { node, simulated } = dragging;
    dragging = null;
    node.classList.remove("dragging");
    // Settle exactly onto the nearest grid point (it's nearly there already), and
    // move the simulated cursor with it.
    const r = root.getBoundingClientRect();
    const snapTo = (v: number, max: number) => Math.max(0, Math.min(Math.floor(max / GRID) * GRID, Math.round(v / GRID) * GRID));
    const x = snapTo(node.offsetLeft, r.width - node.offsetWidth);
    const y = snapTo(node.offsetTop, r.height - node.offsetHeight);
    if (simulated) pc.moveTo(pc.x + x - node.offsetLeft, pc.y + y - node.offsetTop);
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    layoutWires();
  });

  // --- wires ---
  const wires: Wire[] = WIRES.map(([a, b]) => ({
    from: ports.get(a)!,
    to: ports.get(b)!,
    path: svg.appendChild(document.createElementNS(NS, "path")),
  }));
  const centre = (el: Element) => {
    const r = el.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    return { x: r.left + r.width / 2 - rr.left, y: r.top + r.height / 2 - rr.top };
  };
  function layoutWires() {
    for (const w of wires) {
      const a = centre(w.from.el);
      const b = centre(w.to.el);
      const k = Math.max(40, Math.abs(b.x - a.x) / 2);
      const d = `M${a.x},${a.y} C${a.x + k},${a.y} ${b.x - k},${b.y} ${b.x},${b.y}`;
      w.path.setAttribute("d", d);
    }
  }
  layoutWires();
  new ResizeObserver(layoutWires).observe(root);

  // --- wires as rails (off over nodes, so you can leave a wire into its node, and while dragging) ---
  const overNode = (x: number, y: number) =>
    [...root.querySelectorAll(".node")].some((n) => {
      const b = n.getBoundingClientRect();
      return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    });
  pc.attach(
    root,
    rails(() => wires.map((w) => w.path), { off: (x, y) => !!dragging || overNode(x, y) }),
  );
}
