// ==UserScript==
// @name         PowerCursor: the cursor scrolls with the page
// @namespace    https://github.com/joshuahhh/powercursor
// @version      0.1
// @description  ⌘⌥⇧S (Ctrl+Alt+Shift+S elsewhere) swaps your cursor for a simulated one that scrolls with the page, and stops the page scrolling where it would leave the screen. Esc gives it back.
// @match        *://*/*
// @grant        none
// @noframes
// @run-at       document-idle
// ==/UserScript==

/*
 * A minimal extract of the PowerCursor DOM prototype. Under pointer lock the
 * real cursor is hidden and we draw our own, feeding the page synthetic mouse
 * and pointer events at its position. When the page scrolls, the cursor moves
 * with the content; a scroll that would carry it (any part of it) off screen
 * stops at the edge.
 *
 * Synthetic events are untrusted, so :hover/:active styles don't apply and some
 * things (native text selection, drag and drop, scrollbars) don't work.
 */
(() => {
  "use strict";
  if (window.__pcScrollWithPage) return;
  window.__pcScrollWithPage = true;

  // --- cursor icons, drawn as inline SVG (data: images can be blocked by a page's CSP) ---
  // Each: canvas size (w, h), hotspot (hx, hy), and SVG body.
  const ink = (d, extra = "") => `<path d="${d}" fill="#000" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" ${extra}/>`;
  const paper = (d) => `<path d="${d}" fill="#fff" stroke="#000" stroke-linejoin="round"/>`;
  const strokes = (d, w = 1, color = "#000") =>
    `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w + 2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const ARROW = paper("M1 1v16l4-4 3 7 3-1.3-3-6.7h5.5z");
  const badge = (inner) => `${ARROW}<circle cx="14.5" cy="16.5" r="5" fill="#fff" stroke="#000"/>${inner}`;
  const spinner = (cx, cy, r) =>
    `<g><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="1s" repeatCount="indefinite"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="${r * 1.6} ${r * 0.5}"/></g>`;
  const resize = (deg) => ({ w: 22, h: 22, hx: 11, hy: 11, body: `<g transform="rotate(${deg} 11 11)">${ink("M2 11l5-5v3.5h8V6l5 5-5 5v-3.5H7V16z")}</g>` });
  const magnifier = (plus) => ({
    w: 20,
    h: 20,
    hx: 8,
    hy: 8,
    body: `<path d="M12.5 12.5l6 6" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M12.5 12.5l6 6" stroke="#000" stroke-width="3" stroke-linecap="round"/><circle cx="8" cy="8" r="6" fill="#fff" stroke="#000" stroke-width="1.5"/><path d="M5 8h6${plus ? "M8 5v6" : ""}" stroke="#000" stroke-width="1.5"/>`,
  });
  const HAND_FINGERS = "M9.2 10v3.5M12.4 10v3.5M15.6 11v3";
  const SHAPES = {
    default: { w: 15, h: 22, hx: 1, hy: 1, body: ARROW },
    pointer: {
      w: 21,
      h: 25,
      hx: 7,
      hy: 1.5,
      body:
        paper(
          "M7 1.5c1 0 1.8.8 1.8 1.8V10h.4V8.6c0-1 .8-1.6 1.7-1.6s1.7.6 1.7 1.6V10h.4V9.4c0-.9.8-1.5 1.6-1.5s1.6.6 1.6 1.5V11h.3v-.6c0-.8.7-1.4 1.5-1.4s1.5.6 1.5 1.4v6.4c0 3.6-2.6 6.2-6.2 6.2h-1.6c-2.2 0-3.6-.8-4.9-2.4L1.8 15.6c-.6-.8-.5-1.9.3-2.4.8-.6 1.8-.4 2.4.3l.7.9V3.3c0-1 .8-1.8 1.8-1.8z",
        ) + `<path d="${HAND_FINGERS}" stroke="#000" stroke-width=".8" stroke-linecap="round"/>`,
    },
    grab: {
      w: 20,
      h: 20,
      hx: 10,
      hy: 10,
      body:
        '<g fill="#fff" stroke="#000"><rect x="4.5" y="3" width="2.8" height="9" rx="1.4"/><rect x="7.3" y="1.5" width="2.8" height="10" rx="1.4"/><rect x="10.1" y="2" width="2.8" height="10" rx="1.4"/><rect x="12.9" y="3.5" width="2.8" height="9" rx="1.4"/></g>' +
        paper("M2.5 9.5c.8-.6 2-.3 2.5.6l.6 1V8.5h10.1v4.5c0 3.5-2 5.5-5.2 5.5H9c-2 0-3.2-.9-4.3-2.6L2.2 11.8c-.5-.8-.4-1.7.3-2.3z"),
    },
    grabbing: {
      w: 20,
      h: 20,
      hx: 10,
      hy: 10,
      body:
        '<g fill="#fff" stroke="#000"><rect x="4.5" y="6" width="2.8" height="6" rx="1.4"/><rect x="7.3" y="5" width="2.8" height="7" rx="1.4"/><rect x="10.1" y="5" width="2.8" height="7" rx="1.4"/><rect x="12.9" y="6" width="2.8" height="6" rx="1.4"/></g>' +
        paper("M3.5 10.5c.8-.6 2-.3 2.5.6V9.5h9.7v3.5c0 3.5-2 5.5-5.2 5.5H9c-2 0-3.2-.9-4.3-2.6L3.2 12.8c-.5-.8-.4-1.7.3-2.3z"),
    },
    text: { w: 9, h: 18, hx: 4.5, hy: 9, body: strokes("M1 1h7M4.5 1v16M1 17h7") },
    "vertical-text": { w: 18, h: 9, hx: 9, hy: 4.5, body: strokes("M1 1v7M1 4.5h16M17 1v7") },
    crosshair: { w: 19, h: 19, hx: 9.5, hy: 9.5, body: strokes("M9.5 1v17M1 9.5h17") },
    cell: { w: 19, h: 19, hx: 9.5, hy: 9.5, body: paper("M7 1h5v6h6v5h-6v6H7v-6H1V7h6z") },
    move: { w: 21, h: 21, hx: 10.5, hy: 10.5, body: ink("M10.5 1l3.5 4h-2.3v4.3H16V7l4 3.5-4 3.5v-2.3h-4.3V16H14l-3.5 4L7 16h2.3v-4.3H5V14l-4-3.5L5 7v2.3h4.3V5H7z") },
    "ew-resize": resize(0),
    "ns-resize": resize(90),
    "nwse-resize": resize(45),
    "nesw-resize": resize(-45),
    "not-allowed": {
      w: 18,
      h: 18,
      hx: 9,
      hy: 9,
      body: strokes("M4 14L14 4", 2, "#d00") + '<circle cx="9" cy="9" r="7" fill="none" stroke="#fff" stroke-width="4"/><circle cx="9" cy="9" r="7" fill="none" stroke="#d00" stroke-width="2"/>',
    },
    wait: { w: 18, h: 18, hx: 9, hy: 9, body: spinner(9, 9, 6.5) },
    progress: { w: 24, h: 24, hx: 1, hy: 1, body: ARROW + spinner(17, 17, 4.5) },
    help: { w: 20, h: 22, hx: 1, hy: 1, body: badge('<text x="14.5" y="19.5" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">?</text>') },
    copy: { w: 20, h: 22, hx: 1, hy: 1, body: badge('<path d="M14.5 14v5M12 16.5h5" stroke="#090" stroke-width="1.6"/>') },
    alias: { w: 20, h: 22, hx: 1, hy: 1, body: badge('<path d="M12.5 18.5l4-4M14 14.5h2.5V17" fill="none" stroke="#000" stroke-width="1.2"/>') },
    "zoom-in": magnifier(true),
    "zoom-out": magnifier(false),
    none: { w: 0, h: 0, hx: 0, hy: 0, body: "" },
  };
  const ALIASES = {
    auto: "default",
    "context-menu": "default",
    "e-resize": "ew-resize",
    "w-resize": "ew-resize",
    "col-resize": "ew-resize",
    "n-resize": "ns-resize",
    "s-resize": "ns-resize",
    "row-resize": "ns-resize",
    "ne-resize": "nesw-resize",
    "sw-resize": "nesw-resize",
    "nw-resize": "nwse-resize",
    "se-resize": "nwse-resize",
    "all-scroll": "move",
    "no-drop": "not-allowed",
  };

  // Pages with Trusted Types enforcement refuse plain strings for innerHTML.
  let policy = null;
  try {
    policy = window.trustedTypes?.createPolicy("powercursor-userscript", { createHTML: (h) => h });
  } catch {}
  const html = (h) => (policy ? policy.createHTML(h) : h);

  // --- state ---
  let active = false;
  let x = 0;
  let y = 0;
  let pending = { x: 0, y: 0 };
  let hoverChain = [];
  let pressTarget = null;
  let clicks = 0;
  let lastPress = { t: -Infinity, x: 0, y: 0 };
  /** The current icon: { key, hx, hy, box: () => drawn area in icon px }. */
  let icon = null;
  let pageScroll = { x: scrollX, y: scrollY };
  let topLayerCount = -1;

  // --- elements: the pointer-lock target, the cursor, the dialog ---
  const lockEl = document.createElement("div");
  lockEl.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";

  // Popovers, so they sit in the top layer above the page's own modals.
  const cursorEl = document.createElement("div");
  cursorEl.popover = "manual";
  cursorEl.style.cssText =
    "position:fixed;inset:auto;left:0;top:0;width:1px;height:1px;margin:0;padding:0;border:0;background:none;overflow:visible;pointer-events:none;z-index:2147483647;";
  const iconHolder = cursorEl.attachShadow({ mode: "open" }).appendChild(document.createElement("div"));
  iconHolder.style.cssText = "position:absolute;left:0;top:0;";

  const dialogEl = document.createElement("div");
  dialogEl.popover = "manual";
  dialogEl.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:visible;z-index:2147483647;";
  dialogEl.attachShadow({ mode: "open" }).innerHTML = html(`
    <style>
      .backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,.4); font: 14px/1.4 system-ui, sans-serif; }
      .card { display: grid; gap: 10px; justify-items: center; padding: 20px 26px; border-radius: 12px; background: #1d1d1f; color: #ddd; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,.5); border: 2px solid #c62828; }
      button { font: inherit; font-size: 16px; font-weight: 600; padding: 10px 18px; border: 0; border-radius: 8px; background: #c62828; color: #fff; cursor: pointer; }
      small { color: #999; }
    </style>
    <div class="backdrop">
      <div class="card">
        <strong style="color:#fff;font-size:17px">The cursor scrolls with the page</strong>
        <button>Click to take the cursor</button>
        <small>Esc gives it back. Esc or click outside to cancel.</small>
      </div>
    </div>`);
  const dialogButton = dialogEl.shadowRoot.querySelector("button");

  document.documentElement.append(lockEl, cursorEl, dialogEl);

  const boxes = new Map(); // drawn area per SVG icon, measured once it's rendered

  /** Show a drawn icon by name. */
  function setShape(name) {
    if (icon?.key === name) return;
    const sh = SHAPES[name];
    iconHolder.innerHTML = html(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${sh.w}" height="${sh.h}" viewBox="0 0 ${sh.w} ${sh.h}" style="position:absolute;left:${-sh.hx}px;top:${-sh.hy}px;overflow:visible">${sh.body}</svg>`,
    );
    const svg = iconHolder.firstElementChild;
    icon = {
      key: name,
      hx: sh.hx,
      hy: sh.hy,
      box() {
        if (boxes.has(name)) return boxes.get(name);
        const b = svg.getBBox(); // the drawn geometry; +1.5 for strokes
        if (!b.width && !b.height) return { left: 0, top: 0, right: sh.w, bottom: sh.h }; // not rendered yet
        const box = { left: b.x - 1.5, top: b.y - 1.5, right: b.x + b.width + 1.5, bottom: b.y + b.height + 1.5 };
        boxes.set(name, box);
        return box;
      },
    };
  }

  /** Show a page's own url() cursor image (already loaded). */
  function setImage(url, hx, hy, w, h) {
    const key = `${url} ${hx} ${hy}`;
    if (icon?.key === key) return;
    iconHolder.textContent = "";
    const img = iconHolder.appendChild(document.createElement("img"));
    img.src = url;
    img.style.cssText = `position:absolute;left:${-hx}px;top:${-hy}px;max-width:none;`;
    icon = { key, hx, hy, box: () => ({ left: 0, top: 0, right: w, bottom: h }) };
  }
  setShape("default");

  // url() cursor images: loading state per URL.
  const images = new Map();
  function imageReady(url) {
    const st = images.get(url);
    if (st) return st === "loading" || st === "error" ? null : st;
    images.set(url, "loading");
    const im = new Image();
    im.onload = () => images.set(url, im.naturalWidth && im.naturalWidth <= 128 && im.naturalHeight <= 128 ? { w: im.naturalWidth, h: im.naturalHeight } : "error");
    im.onerror = () => images.set(url, "error");
    im.src = url;
    return null;
  }

  /** Split a computed `cursor` value at its top-level commas. */
  function cursorList(value) {
    const out = [];
    let depth = 0;
    let quote = "";
    let cur = "";
    for (const ch of value) {
      if (quote) {
        if (ch === quote) quote = "";
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 0) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // --- the dialog ---
  function openDialog() {
    if (active || dialogEl.matches(":popover-open")) return;
    dialogEl.showPopover();
  }
  function closeDialog() {
    if (dialogEl.matches(":popover-open")) dialogEl.hidePopover();
  }
  dialogButton.addEventListener("click", (e) => {
    x = e.clientX;
    y = e.clientY;
    closeDialog();
    const p = lockEl.requestPointerLock();
    if (p && p.catch) p.catch(() => {});
  });
  dialogEl.shadowRoot.querySelector(".backdrop").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDialog();
  });

  // --- synthetic events ---
  function fire(target, Ctor, type, extra = {}) {
    const ev = new Ctor(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      ...extra,
    });
    // Under pointer lock, Firefox reports the lock point as every mouse event's
    // coordinates, even synthetic ones: pin the real ones as own properties.
    const r = target.getBoundingClientRect();
    const coords = { clientX: x, clientY: y, x, y, pageX: x + scrollX, pageY: y + scrollY, offsetX: x - r.left, offsetY: y - r.top };
    for (const [k, v] of Object.entries(coords)) Object.defineProperty(ev, k, { value: v });
    return target.dispatchEvent(ev);
  }

  function elementAt() {
    for (const el of document.elementsFromPoint(x, y)) if (el !== lockEl && el !== cursorEl && el !== dialogEl) return el;
    return null;
  }

  /** Is the cursor over a character of text (where browsers show an I-beam for `cursor: auto`)? */
  function overText() {
    const c = document.caretPositionFromPoint?.(x, y);
    const node = c ? c.offsetNode : document.caretRangeFromPoint?.(x, y)?.startContainer;
    const offset = c ? c.offset : document.caretRangeFromPoint?.(x, y)?.startOffset;
    if (!node || node.nodeType !== Node.TEXT_NODE) return false;
    const r = document.createRange();
    for (const o of [offset - 1, offset]) {
      if (o < 0 || o >= node.length || /\s/.test(node.data[o])) continue;
      r.setStart(node, o);
      r.setEnd(node, o + 1);
      for (const b of r.getClientRects()) if (x >= b.left - 1 && x <= b.right + 1 && y >= b.top && y <= b.bottom) return true;
    }
    return false;
  }

  /** Show the cursor the page asks for over `el` (its CSS `cursor`). */
  function showCursorFor(el) {
    for (const item of cursorList(getComputedStyle(el).cursor)) {
      const url = /^url\((['"]?)(.*?)\1\)\s*(?:(-?[\d.]+)\s+(-?[\d.]+))?$/.exec(item);
      if (url) {
        const im = imageReady(url[2]);
        if (im) return setImage(url[2], +(url[3] ?? 0), +(url[4] ?? 0), im.w, im.h);
        continue; // not loaded (yet): fall back
      }
      if (item === "auto") {
        const textInput =
          el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !["button", "submit", "reset", "checkbox", "radio", "range", "color", "file", "image"].includes(el.type));
        const link = el.closest("a[href]");
        return setShape(link ? "pointer" : textInput || el.isContentEditable || overText() ? "text" : "default");
      }
      const name = ALIASES[item] ?? item;
      if (SHAPES[name]) return setShape(name);
    }
    setShape("default");
  }

  function updateHover(target, moved) {
    const chain = [];
    for (let e = target; e; e = e.parentElement) chain.push(e);
    const prevTarget = hoverChain[0] || null;
    if (target !== prevTarget) {
      if (prevTarget) {
        fire(prevTarget, PointerEvent, "pointerout", { relatedTarget: target });
        fire(prevTarget, MouseEvent, "mouseout", { relatedTarget: target });
      }
      for (const e of hoverChain) {
        if (chain.includes(e)) continue;
        fire(e, PointerEvent, "pointerleave", { bubbles: false, relatedTarget: target });
        fire(e, MouseEvent, "mouseleave", { bubbles: false, relatedTarget: target });
      }
      if (target) {
        fire(target, PointerEvent, "pointerover", { relatedTarget: prevTarget });
        fire(target, MouseEvent, "mouseover", { relatedTarget: prevTarget });
      }
      for (const e of [...chain].reverse()) {
        if (hoverChain.includes(e)) continue;
        fire(e, PointerEvent, "pointerenter", { bubbles: false, relatedTarget: prevTarget });
        fire(e, MouseEvent, "mouseenter", { bubbles: false, relatedTarget: prevTarget });
      }
      hoverChain = chain;
    }
    if (target) showCursorFor(target);
    if (moved && target) {
      fire(target, PointerEvent, "pointermove");
      fire(target, MouseEvent, "mousemove");
    }
  }

  function press(e) {
    const target = hoverChain[0];
    if (!target) return;
    pressTarget = target;
    const now = performance.now();
    clicks = now - lastPress.t < 500 && Math.hypot(x - lastPress.x, y - lastPress.y) < 5 ? (clicks % 3) + 1 : 1;
    lastPress = { t: now, x, y };
    const mods = { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey };
    fire(target, PointerEvent, "pointerdown", { button: 0, buttons: 1, detail: clicks, ...mods });
    if (fire(target, MouseEvent, "mousedown", { button: 0, buttons: 1, detail: clicks, ...mods })) {
      const focusable = target.closest("input, textarea, select, button, a[href], [tabindex], [contenteditable]");
      if (focusable) focusable.focus();
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
  }

  function release(e) {
    const target = hoverChain[0];
    const down = pressTarget;
    pressTarget = null;
    if (!target) return;
    const mods = { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey };
    fire(target, PointerEvent, "pointerup", { button: 0, buttons: 0, detail: clicks, ...mods });
    fire(target, MouseEvent, "mouseup", { button: 0, buttons: 0, detail: clicks, ...mods });
    if (!down) return;
    // Click goes to the nearest common ancestor of the press and release targets.
    let common = target;
    while (common && !common.contains(down)) common = common.parentElement;
    if (!common) return;
    if (common instanceof HTMLSelectElement) {
      try {
        common.showPicker();
      } catch {}
    }
    fire(common, MouseEvent, "click", { button: 0, detail: clicks, ...mods });
    if (clicks === 2) fire(common, MouseEvent, "dblclick", { button: 0, detail: 2, ...mods });
  }

  // --- scrolling with the page ---
  /** How far content may scroll (dx, dy) carrying the cursor: never taking any of it further off screen. */
  function clampCarry(dx, dy) {
    const b = icon.box();
    const minX = Math.max(0, icon.hx - b.left);
    const maxX = innerWidth - Math.max(1, b.right - icon.hx);
    const minY = Math.max(0, icon.hy - b.top);
    const maxY = innerHeight - Math.max(1, b.bottom - icon.hy);
    return [Math.max(Math.min(0, x - maxX), Math.min(Math.max(0, x - minX), dx)), Math.max(Math.min(0, y - maxY), Math.min(Math.max(0, y - minY), dy))];
  }

  function scrollAtCursor(dx, dy) {
    [dx, dy] = clampCarry(dx, dy);
    let scroller = null;
    for (let el = hoverChain[0] || null; el && el !== document.documentElement && el !== document.body; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
        scroller = el;
        break;
      }
    }
    const pos = () => (scroller ? { x: scroller.scrollLeft, y: scroller.scrollTop } : { x: scrollX, y: scrollY });
    const before = pos();
    (scroller || window).scrollBy({ left: dx, top: dy, behavior: "instant" });
    const after = pos();
    x -= after.x - before.x;
    y -= after.y - before.y;
    if (!scroller) pageScroll = after;
  }

  // Other page scrolls (scripts, anchors): carry the cursor, and scroll back to where it'd stop.
  addEventListener("scroll", () => {
    const dx = scrollX - pageScroll.x;
    const dy = scrollY - pageScroll.y;
    pageScroll = { x: scrollX, y: scrollY };
    if (!active || (!dx && !dy)) return;
    const [ax, ay] = clampCarry(dx, dy);
    x -= ax;
    y -= ay;
    if (ax !== dx || ay !== dy) {
      scrollBy({ left: ax - dx, top: ay - dy, behavior: "instant" });
      pageScroll = { x: scrollX, y: scrollY };
    }
  });

  // --- input ---
  const capture = { capture: true, passive: false };

  addEventListener(
    "keydown",
    (e) => {
      if (!e.isTrusted) return;
      // The hotkey: ⌘⌥⇧S (Ctrl+Alt+Shift+S). e.code, since Option changes e.key on a Mac.
      if (e.code === "KeyS" && e.altKey && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openDialog();
        return;
      }
      if (e.key === "Escape" && dialogEl.matches(":popover-open")) {
        closeDialog();
        return;
      }
      // Scroll keys, handled here so they stop at the edge (the browser animates its own).
      if (!active || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof Element && (t.closest("input, textarea, select, [contenteditable]") || (e.key === " " && t.closest("button, a[href], summary")))) return;
      const page = innerHeight * 0.875;
      const d = {
        PageDown: [0, page],
        PageUp: [0, -page],
        " ": [0, e.shiftKey ? -page : page],
        ArrowDown: [0, 40],
        ArrowUp: [0, -40],
        ArrowRight: [40, 0],
        ArrowLeft: [-40, 0],
        Home: [0, -Infinity],
        End: [0, Infinity],
      }[e.key];
      if (!d) return;
      e.preventDefault();
      scrollAtCursor(...d);
    },
    capture,
  );

  document.addEventListener("pointerlockchange", () => {
    const locked = document.pointerLockElement === lockEl;
    if (locked === active) return;
    active = locked;
    pending = { x: 0, y: 0 };
    pageScroll = { x: scrollX, y: scrollY };
    topLayerCount = -1;
    if (active) {
      cursorEl.showPopover();
      cursorEl.style.transform = `translate(${x}px,${y}px)`;
      updateHover(elementAt(), false);
    } else {
      updateHover(null, false);
      pressTarget = null;
      if (cursorEl.matches(":popover-open")) cursorEl.hidePopover();
    }
  });

  // Real input, while active: movement from pointermove; presses, clicks and wheels
  // caught at the window and replayed at the simulated cursor.
  addEventListener(
    "pointermove",
    (e) => {
      if (!active || !e.isTrusted) return;
      e.stopImmediatePropagation();
      if (!e.isPrimary || Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      pending.x += e.movementX;
      pending.y += e.movementY;
    },
    capture,
  );
  const swallow = (e) => {
    if (!active || !e.isTrusted) return false;
    e.preventDefault();
    e.stopImmediatePropagation();
    return true;
  };
  addEventListener("mousedown", (e) => swallow(e) && e.button === 0 && press(e), capture);
  addEventListener("mouseup", (e) => swallow(e) && e.button === 0 && release(e), capture);
  addEventListener("wheel", (e) => {
    if (!swallow(e)) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight * 0.9 : 1; // Firefox: lines
    scrollAtCursor(e.deltaX * unit, e.deltaY * unit);
  }, capture);
  for (const type of ["click", "dblclick", "auxclick", "contextmenu", "mousemove", "pointerdown", "pointerup", "pointerover", "pointerout"])
    addEventListener(
      type,
      (e) => {
        if (!active || !e.isTrusted) return;
        // preventDefault on pointerdown would also suppress the mousedown/mouseup we rely on.
        if (!type.startsWith("pointer")) e.preventDefault();
        e.stopImmediatePropagation();
      },
      capture,
    );

  // --- frame loop ---
  function frame() {
    requestAnimationFrame(frame);
    if (!active) return;
    // Keep the cursor above modals and popovers that open later.
    const n = document.querySelectorAll(":modal, :popover-open").length;
    if (n !== topLayerCount) {
      if (cursorEl.matches(":popover-open")) cursorEl.hidePopover();
      cursorEl.showPopover();
      topLayerCount = document.querySelectorAll(":modal, :popover-open").length;
    }
    const before = { x, y };
    x = Math.min(innerWidth - 1, Math.max(0, x + pending.x));
    y = Math.min(innerHeight - 1, Math.max(0, y + pending.y));
    pending = { x: 0, y: 0 };
    cursorEl.style.transform = `translate(${x}px,${y}px)`;
    updateHover(elementAt(), x !== before.x || y !== before.y);
  }
  requestAnimationFrame(frame);
})();
