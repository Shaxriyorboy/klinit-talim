import type { L } from "@/lib/i18n";
import type { PersonaId, Source } from "@/content/types";

/** Personaj holati (qo'llar) */
export type Pose = "idle" | "explain" | "point" | "hold" | "clipboard" | "bag" | "compress" | "wave" | "listen";

export type CastMember = {
  id: PersonaId;
  /** markaz X, 0..1920 */
  x: number;
  pose?: Pose;
  /** 1 = o'ngga qaragan, -1 = chapga */
  facing?: 1 | -1;
  scale?: number;
  /** karavotda o'tirgan (pastki qismi ko'rpa bilan yopilgan) */
  inBed?: boolean;
  /** karavotda: rasmni qancha px pastga tushirish (tug'ruqdan keyin — qorin ko'rpa ostida qolsin) */
  sink?: number;
};

export type SceneId = "delivery" | "nicu" | "ward" | "studio";

export type Graphic =
  | { kind: "bigStat"; value: L; caption: L; tone?: "primary" | "bad" | "ok" }
  | { kind: "list"; title: L; items: L[]; critical?: number[]; numbered?: boolean }
  | { kind: "cycle"; title: L; steps: L[] }
  | { kind: "thresholds"; title: L; rows: { label: L; value: L; bad?: boolean }[] }
  | {
      kind: "monitor";
      title: L;
      unit: string;
      from: number;
      to: number;
      /** me'yor oralig'i */
      low: number;
      high: number;
      wave?: "ecg" | "fhr" | "pleth";
      note?: L;
    }
  | { kind: "timeline"; title: L; points: { at: number; label: L; sub?: L; color?: string }[]; max: number; unit: L }
  | { kind: "bars"; title: L; bars: { label: L; value: number; text: string }[] }
  | { kind: "countdown"; title: L; seconds: number; items: L[] }
  | { kind: "chart"; title: L; xLabel: L; yLabel: L; points: { x: number; y: number; label?: string }[]; xMax: number; yMin: number; yMax: number }
  | { kind: "branches"; title: L; root: L; branches: { when: L; then: L; tone: "ok" | "warn" | "bad" }[] }
  | { kind: "compare"; title: L; left: { title: L; items: L[] }; right: { title: L; items: L[] } }
  | { kind: "rhythm"; title: L; pattern: L[]; caption: L }
  | { kind: "uterus"; title: L; marks: { day: L; level: number; label: L }[] }
  | { kind: "cervix"; title: L; cm: number; caption: L }
  | { kind: "contractions"; title: L; count: number; caption: L }
  | { kind: "partogram"; title: L; caption: L };

export type Shot = {
  scene: SceneId;
  cast?: CastMember[];
  /** kamera: [zoom, markazX, markazY] boshlanish → oxir */
  cam?: { from: [number, number, number]; to: [number, number, number] };
  graphic?: Graphic;
  /** Chaqaloq (reanimatsiya stolida): 0 = rangpar/harakatsiz, 1 = pushti/nafas oladi */
  baby?: { from: number; to: number };
};

export type Beat = {
  speaker?: PersonaId;
  line: L;
  /** Ovoz yozish uchun o'qiladigan matn (raqam va qisqartmalar so'z bilan); subtitrda `line` ko'rsatiladi */
  say?: L;
  shot: Shot;
  source?: Source;
  /** soniya; berilmasa matn uzunligidan hisoblanadi */
  dur?: number;
  /** gapiruvchining rasmi bo'lmasa (masalan, bemor) — muqobil gapiruvchi va qator */
  fallback?: { speaker: PersonaId; line: L };
};

export type VideoScript = {
  slug: string;
  title: L;
  subtitle: L;
  protocolId: number;
  beats: Beat[];
};
