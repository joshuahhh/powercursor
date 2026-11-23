// Installs or updates scroll-with-page.user.js in Tampermonkey, via the TamperDAV
// sync folder of ~/Documents/coding/userscripts (see tamperdav.md there; this
// follows its session-bridge/deploy.mjs). Finds the installed copy by @name; if
// there isn't one, creates a new script. Override the folder with PC_SYNC_DIR.

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SOURCE = new URL("./scroll-with-page.user.js", import.meta.url).pathname;
const SYNC_DIR = process.env.PC_SYNC_DIR ?? join(homedir(), "Documents/coding/userscripts/tamperdav/dav/Tampermonkey/sync");

const nameOf = (text) => /^\/\/\s*@name\s+(.+?)\s*$/m.exec(text)?.[1];
const source = readFileSync(SOURCE, "utf8");
const NAME = nameOf(source);
if (!NAME) throw new Error(`no @name in ${SOURCE}`);
if (!existsSync(SYNC_DIR)) throw new Error(`no TamperDAV sync folder at ${SYNC_DIR}`);

// The source with the build time appended to @version, to tell builds apart in the dashboard.
const d = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const build = source.replace(/^(\/\/\s*@version\s+)(\S+)$/m, (_, prefix, version) => `${prefix}${version}.${stamp}`);

// Installed copies: matching @name, not deleted in Tampermonkey (a tombstone .meta.json has options.removed).
const installed = readdirSync(SYNC_DIR)
  .filter((f) => f.endsWith(".user.js"))
  .map((f) => join(SYNC_DIR, f))
  .filter((path) => {
    const meta = path.replace(/\.user\.js$/, ".meta.json");
    const removed = existsSync(meta) && JSON.parse(readFileSync(meta, "utf8")).options?.removed;
    return !removed && nameOf(readFileSync(path, "utf8")) === NAME;
  });

if (installed.length > 1) {
  throw new Error(`more than one "${NAME}" installed; delete the extras in Tampermonkey:\n${installed.join("\n")}`);
} else if (installed.length === 1) {
  writeFileSync(installed[0], build);
  // Tampermonkey only re-downloads when the .meta.json is newer than its copy: bump it.
  const meta = installed[0].replace(/\.user\.js$/, ".meta.json");
  if (existsSync(meta)) writeFileSync(meta, readFileSync(meta));
  console.log(`[deploy] updated ${installed[0]}`);
} else {
  // A new script: the source first, then the .meta.json that announces it.
  const uuid = randomUUID();
  writeFileSync(join(SYNC_DIR, `${uuid}.user.js`), build);
  writeFileSync(join(SYNC_DIR, `${uuid}.meta.json`), JSON.stringify({ uuid, name: NAME, options: {}, lastModified: Date.now() }));
  console.log(`[deploy] created ${join(SYNC_DIR, uuid)}.user.js`);
}
