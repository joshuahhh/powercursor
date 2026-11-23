import { asset } from "./art";

let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let muted = false;

/**
 * The shared AudioContext. Everything audible should route through it (demos with
 * their own graphs too), so muting — which suspends it — silences everything.
 */
export function audio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    if (muted) void ctx.suspend();
  }
  return ctx;
}

/** Browsers only allow audio after a user gesture; call from one. */
export function unlockAudio() {
  const c = audio();
  if (c.state === "suspended" && !muted) void c.resume();
}

export function setMuted(m: boolean) {
  muted = m;
  if (ctx) void (m ? ctx.suspend() : ctx.resume());
}
export const isMuted = () => muted;

/**
 * Resolve a Flash library linkage name ("pop", "scratch", ...) or a path to a
 * sound URL. Library sounds live in /lib/sounds.
 */
function soundUrl(name: string): string {
  return asset(name.includes("/") ? name : `lib/sounds/${name}.mp3`);
}

export function loadSound(name: string): Promise<AudioBuffer | null> {
  const url = soundUrl(name);
  let p = buffers.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((b) => audio().decodeAudioData(b))
      .catch((e) => {
        console.warn("[powercursor] sound failed", name, e);
        return null;
      });
    buffers.set(url, p);
  }
  return p;
}

/** Fire-and-forget one-shot sound. */
export async function playSound(name: string, volume = 1) {
  if (muted) return;
  const buf = await loadSound(name);
  if (!buf) return;
  const c = audio();
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = volume;
  src.buffer = buf;
  src.connect(g).connect(c.destination);
  src.start();
}

/**
 * The AS2 cursor sound: a looping sample tied to the object the cursor is on,
 * whose volume follows the cursor's displacement relative to the object size.
 */
export class CursorSound {
  private name = "";
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  /** Diagonal of the current object in px (AS2: sqrt(_width² + _height²)). */
  objectDiagonal = 0;
  /** Engine-supplied ratio of the current frame to the reference frame. */
  frameScale = 1;

  /** AS2 setCursorSound(name, sender). "Null" / "" stops. */
  set(name: string, initialVolume = 50, objectDiagonal = 0) {
    this.objectDiagonal = objectDiagonal;
    if (name === this.name) return;
    this.name = name;
    this.stop();
    if (!name || name === "Null" || name === "null") return;
    void loadSound(name).then((buf) => {
      if (!buf || this.name !== name || muted) return;
      const c = audio();
      this.src = c.createBufferSource();
      this.src.buffer = buf;
      this.src.loop = true;
      this.gain = c.createGain();
      this.setVolume(initialVolume);
      this.src.connect(this.gain).connect(c.destination);
      this.src.start();
    });
  }

  /** 0..100 like Flash Sound.setVolume. */
  setVolume(v: number) {
    if (!this.gain) return;
    const vol = Math.max(0, Math.min(100, v)) / 100;
    this.gain.gain.setTargetAtTime(vol, audio().currentTime, 0.02);
  }

  onDisplace(dx: number, dy: number) {
    if (!this.name || !this.objectDiagonal) return;
    const dist = Math.hypot(dx, dy) / this.frameScale;
    const v = Math.trunc((dist / this.objectDiagonal) * 1000);
    this.setVolume(Number.isFinite(v) ? v : 0);
  }

  stop() {
    try {
      this.src?.stop();
    } catch {
      /* already stopped */
    }
    this.src?.disconnect();
    this.src = null;
    this.gain = null;
  }
}
