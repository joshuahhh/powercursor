import type { Demo } from "./types";

/** Every module in this folder whose default export is a Demo. */
const modules = import.meta.glob<{ default: Demo }>(["./*.ts", "!./index.ts", "!./types.ts"], { eager: true });

/** Site order: homepage first, then the examples page, then extras. */
const ORDER = ["home", "fan", "pocket", "menu", "ballgame", "cursorbug", "delete_button", "windowbuttons", "block", "maze", "switch", "basics"];

export const demos: Demo[] = Object.values(modules)
  .map((m) => m.default)
  .filter((d): d is Demo => !!d && typeof d.build === "function")
  .sort((a, b) => rank(a.id) - rank(b.id));

function rank(id: string) {
  const i = ORDER.indexOf(id);
  return i < 0 ? ORDER.length : i;
}
