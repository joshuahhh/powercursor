// Copy the self-hosted Ruffle build into public/ so the original SWFs can be
// shown side by side with the port.
import { cpSync, rmSync, existsSync } from "node:fs";
const src = "node_modules/@ruffle-rs/ruffle";
if (existsSync(src)) {
  rmSync("public/ruffle", { recursive: true, force: true });
  cpSync(src, "public/ruffle", { recursive: true });
}
