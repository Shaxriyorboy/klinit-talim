import { t, type Locale } from "@/lib/i18n";
import { PERSONAS } from "@/content/personas";
import type { Beat, VideoScript } from "./types";

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const INTRO = 4.5; // sarlavha kartochkasi
export const OUTRO = 5; // yakuniy kartochka
export const XFADE = 0.45; // sahnalar orasidagi o'tish

/** Matn uzunligiga qarab o'qish vaqti (o'zbek matni bo'yicha). */
export function beatDuration(b: Beat): number {
  if (b.dur) return b.dur;
  const len = b.line.uz.length;
  return Math.min(13, Math.max(5, len / 13.5 + 1.4));
}

export type Timed = { beat: Beat; start: number; end: number; index: number; voiceAt: number | null };

/** Ovoz yozuvlari: har bir sahna (beat) uchun audio davomiyligi, soniya (yo'q bo'lsa null). */
export type Voice = (number | null)[];
/** Ovoz sahna boshlanishidan shuncha keyin boshlanadi (o'tish tugashi uchun) */
export const VOICE_LEAD = 0.5;
/** Ovoz tugagach sahna yana shuncha davom etadi */
export const VOICE_TAIL = 0.7;

export function layout(script: VideoScript, voice?: Voice | null) {
  let t0 = INTRO;
  const timed: Timed[] = script.beats.map((beat, index) => {
    const v = voice?.[index] ?? null;
    const d = v ? Math.max(3, VOICE_LEAD + v + VOICE_TAIL) : beatDuration(beat);
    const item = { beat, start: t0, end: t0 + d, index, voiceAt: v ? t0 + VOICE_LEAD : null };
    t0 += d;
    return item;
  });
  return { timed, total: t0 + OUTRO };
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** start dan boshlab dur davomida 0→1 */
export const appear = (time: number, start: number, dur = 0.5) => ease((time - start) / dur);

function vttTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${sec}`;
}

/** WebVTT subtitr (ovoz qo'shilganda shu vaqtlarga moslanadi). */
export function toVtt(script: VideoScript, lang: Locale, voice?: Voice | null) {
  const { timed } = layout(script, voice);
  const cues = timed.map(({ beat, start, end, voiceAt }, i) => {
    const who = beat.speaker ? `<v ${t(PERSONAS[beat.speaker].name, lang)}>` : "";
    const from = voiceAt ?? start;
    const to = voiceAt !== null ? Math.min(end, voiceAt + (voice?.[i] ?? 0) + 0.2) : end;
    return `${i + 1}\n${vttTime(from)} --> ${vttTime(to)}\n${who}${t(beat.line, lang)}`;
  });
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}
