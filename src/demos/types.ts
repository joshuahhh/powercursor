import type { Engine, EngineOptions, Stage } from "../pc";

export interface DemoContext {
  stage: Stage;
  engine: Engine;
}

export interface Demo {
  id: string;
  title: string;
  description: string;
  /** Thumbnail in /public/icons. */
  icon?: string;
  width: number;
  height: number;
  background: string;
  /** Frame rate of the original movie (dynamics are tuned to it). */
  fps: number;
  /** Original SWF in /public/original, for the side-by-side comparison. */
  original?: string;
  engine?: EngineOptions;
  /** Build the scene. May return a cleanup function. */
  build(ctx: DemoContext): Promise<void | (() => void)>;
}
