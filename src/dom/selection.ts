/*
 * Text selection for the simulated cursor. Synthetic mousedowns don't start a
 * native selection, so we do it ourselves: press to place the caret, drag to
 * extend, double-press for a word, triple-press for a line/block, shift-press to
 * extend. Works in text inputs/textareas (via setSelectionRange) and in page text
 * (via the document Selection).
 *
 * Caret lookup uses document.caretPositionFromPoint, which reports offsets inside
 * text controls (Chromium 128+, Firefox). Safari only has caretRangeFromPoint, so
 * there page text works but text controls only get focus.
 */

export interface Caret {
  node: Node;
  offset: number;
}

export type CaretAt = (x: number, y: number) => Caret | null;

const TEXT_INPUT_TYPES = new Set(["text", "search", "url", "tel", "email", "password", "number", ""]);

export function isTextControl(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(el.getAttribute("type")?.toLowerCase() ?? "");
}

type Anchor =
  | { kind: "control"; el: HTMLInputElement | HTMLTextAreaElement; start: number; end: number }
  | { kind: "doc"; range: Range }
  | null;

export class TextSelector {
  private anchor: Anchor = null;

  constructor(private caretAt: CaretAt) {}

  /** A (non-cancelled) press at x,y on `target`. `count` is the click count (1, 2, 3). */
  press(x: number, y: number, target: Element, count: number, shift: boolean) {
    this.anchor = null;
    const control = target.closest("input, textarea");
    if (isTextControl(control)) {
      if (control.disabled) return;
      this.pressControl(control, x, y, count, shift);
      return;
    }
    // Presses on controls don't start a selection (or drop the existing one).
    if (target.closest("button, select, a[href], input, [draggable=true]")) return;
    if (getComputedStyle(target).userSelect === "none") return;
    this.pressDoc(x, y, count, shift);
  }

  /** The cursor moved with the button held. */
  drag(x: number, y: number) {
    const a = this.anchor;
    if (!a) return;
    if (a.kind === "control") {
      const o = this.controlOffset(a.el, x, y);
      if (o == null) return;
      if (o < a.start) a.el.setSelectionRange(o, a.end, "backward");
      else a.el.setSelectionRange(a.start, Math.max(a.end, o), "forward");
      return;
    }
    const c = this.caretAt(x, y);
    if (!c || c.node.nodeType === Node.DOCUMENT_NODE) return;
    const sel = getSelection();
    if (!sel) return;
    let before: boolean;
    try {
      before = a.range.comparePoint(c.node, c.offset) < 0;
    } catch {
      return; // different tree (e.g. shadow DOM)
    }
    if (before) sel.setBaseAndExtent(a.range.endContainer, a.range.endOffset, c.node, c.offset);
    else sel.setBaseAndExtent(a.range.startContainer, a.range.startOffset, c.node, c.offset);
  }

  release() {
    this.anchor = null;
  }

  // ---------------------------------------------------------------------------

  private pressControl(el: HTMLInputElement | HTMLTextAreaElement, x: number, y: number, count: number, shift: boolean) {
    const o = this.controlOffset(el, x, y);
    if (o == null) return; // e.g. Safari: focus only
    const v = el.value;
    let start = o;
    let end = o;
    if (count === 2) [start, end] = wordAt(v, o);
    else if (count >= 3) {
      if (el instanceof HTMLTextAreaElement) {
        start = v.lastIndexOf("\n", o - 1) + 1;
        const nl = v.indexOf("\n", o);
        end = nl < 0 ? v.length : nl;
      } else [start, end] = [0, v.length];
    } else if (shift) {
      // Extend from the existing selection's anchor end.
      const s = el.selectionStart ?? o;
      const e = el.selectionEnd ?? o;
      const fixed = el.selectionDirection === "backward" ? e : s;
      start = end = fixed;
      if (o < fixed) el.setSelectionRange(o, fixed, "backward");
      else el.setSelectionRange(fixed, o, "forward");
      this.anchor = { kind: "control", el, start, end };
      return;
    }
    el.setSelectionRange(start, end);
    this.anchor = { kind: "control", el, start, end };
  }

  /** Caret offset in a text control's value, clamping the point into its box. */
  private controlOffset(el: HTMLInputElement | HTMLTextAreaElement, x: number, y: number): number | null {
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const l = b.left + parseFloat(cs.borderLeftWidth) + 1;
    const r = b.right - parseFloat(cs.borderRightWidth) - 1;
    const t = b.top + parseFloat(cs.borderTopWidth) + 1;
    const btm = b.bottom - parseFloat(cs.borderBottomWidth) - 1;
    const at = (px: number, py: number) => {
      const c = this.caretAt(Math.min(r, Math.max(l, px)), Math.min(btm, Math.max(t, py)));
      return c && c.node === el ? c.offset : null;
    };
    if (el instanceof HTMLInputElement) {
      // Dragging off the left/right of a single-line input: step one character past
      // the visible edge each frame, so setSelectionRange scrolls it along.
      const mid = (t + btm) / 2;
      if (x < l) {
        const o = at(l, mid);
        return o == null ? null : Math.max(0, o - 1);
      }
      if (x > r) {
        const o = at(r, mid);
        return o == null ? null : Math.min(el.value.length, o + 1);
      }
    } else {
      if (y < t) return 0;
      if (y > btm) return el.value.length;
    }
    return at(x, y);
  }

  private pressDoc(x: number, y: number, count: number, shift: boolean) {
    const sel = getSelection();
    if (!sel) return;
    const c = this.caretAt(x, y);
    if (!c || c.node.nodeType === Node.DOCUMENT_NODE) {
      sel.removeAllRanges();
      return;
    }
    if (shift && sel.rangeCount && count === 1) {
      const range = document.createRange();
      range.setStart(sel.anchorNode!, sel.anchorOffset);
      sel.extend(c.node, c.offset);
      this.anchor = { kind: "doc", range };
      return;
    }
    const range = document.createRange();
    range.setStart(c.node, c.offset);
    if (count === 2 && c.node.nodeType === Node.TEXT_NODE) {
      const [s, e] = wordAt((c.node as Text).data, c.offset);
      range.setStart(c.node, s);
      range.setEnd(c.node, e);
    } else if (count >= 3) {
      const block = blockOf(c.node);
      if (block) range.selectNodeContents(block);
    }
    sel.removeAllRanges();
    sel.addRange(range.cloneRange());
    this.anchor = { kind: "doc", range };
  }
}

/** Word boundaries around offset `o`, like a double-click. */
function wordAt(text: string, o: number): [number, number] {
  const seg = new Intl.Segmenter(undefined, { granularity: "word" });
  let fallback: [number, number] = [o, o];
  for (const s of seg.segment(text)) {
    const end = s.index + s.segment.length;
    if (o >= s.index && o < end) return [s.index, end];
    if (o === end) fallback = [s.index, end]; // caret at the very end
  }
  return fallback;
}

function blockOf(node: Node): Element | null {
  for (let e = node instanceof Element ? node : node.parentElement; e; e = e.parentElement) {
    const d = getComputedStyle(e).display;
    if (!d.startsWith("inline") && d !== "contents") return e;
  }
  return null;
}
