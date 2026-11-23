/**
 * PowerCursor, DOM-first API (prototype).
 *
 *     const pc = new PowerCursor();
 *     takeButton.onclick = () => pc.engage();
 *     pc.attach(saveButton, target());
 *     pc.attach(disabledItem, slick());
 */
export { PowerCursor, type PowerCursorOptions, type AttachOptions, type InputMode } from "./powercursor";
export * from "./fields";
export type { ShapeKind, LocalPoint } from "./geometry";
export type { Caret, CaretAt } from "./selection";
export { rails, type RailsOptions } from "./rails";
