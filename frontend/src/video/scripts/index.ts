import type { VideoScript } from "../types";
import { partogrammaVideo } from "./partogramma";
import { reanimatsiyaVideo } from "./reanimatsiya";
import { tugruqdanKeyinVideo } from "./tugruqdan-keyin";
import { resolveScript } from "../sprites";

// Rasmi tayyor bo'lmagan personajlar avtomatik mavjudlari bilan almashtiriladi (sprites.ts)
export const VIDEOS: Record<string, VideoScript> = Object.fromEntries(
  [partogrammaVideo, reanimatsiyaVideo, tugruqdanKeyinVideo].map((s) => [s.slug, resolveScript(s)]),
);
