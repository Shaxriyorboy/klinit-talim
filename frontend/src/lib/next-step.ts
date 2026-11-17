import type { L } from "./i18n";
import { UI } from "./ui";
import { lessonKey, type Progress } from "./progress";
import type { PublicModule } from "@/content/types";

export type StepKind = "pre" | "video" | "lesson" | "final" | "done";

export type ModuleState = {
  /** Modul bo'yicha umumiy bajarilish (0–100): boshlang'ich test + video + darslar + yakuniy test */
  pct: number;
  lessonsDone: number;
  started: boolean;
  passed: boolean;
  next: { kind: StepKind; href: string; title: L; lessonIndex?: number };
};

/**
 * Modulda o'quvchi qayerda turganini aniqlaydi va keyingi qadamni qaytaradi.
 * Ketma-ketlik LessonList bilan bir xil: boshlang'ich test → video → darslar → yakuniy test.
 */
export function moduleState(m: PublicModule, p: Progress, lang: string): ModuleState {
  const base = `/${lang}/modul/${m.slug}`;
  const done = m.lessons.map((l) => !!p.lessons[lessonKey(m.slug, l.slug)]?.done);
  const lessonsDone = done.filter(Boolean).length;
  const anyLesson = lessonsDone > 0;
  const preOk = p.pretests[m.slug] !== undefined || anyLesson;
  const video = p.videos.includes(m.slug);
  const passed = !!p.tests[m.slug]?.passed;
  const firstOpen = done.findIndex((d) => !d);

  const units = m.lessons.length + 3;
  const got = (preOk ? 1 : 0) + (video ? 1 : 0) + lessonsDone + (passed ? 1 : 0);
  const pct = Math.round((got / units) * 100);
  const started = got > 0 || p.tests[m.slug] !== undefined;

  let next: ModuleState["next"];
  if (!preOk) next = { kind: "pre", href: `${base}/boshlangich`, title: UI.preTest };
  else if (!video) next = { kind: "video", href: `${base}#video`, title: UI.videoTitle };
  else if (firstOpen !== -1)
    next = { kind: "lesson", href: `${base}/dars/${m.lessons[firstOpen].slug}`, title: m.lessons[firstOpen].title, lessonIndex: firstOpen };
  else if (!passed) next = { kind: "final", href: `${base}/test`, title: UI.finalTest };
  else next = { kind: "done", href: base, title: m.title };

  return { pct, lessonsDone, started, passed, next };
}

/** Bosh sahifadagi "Davom ettirish": boshlangan, lekin tugamagan modul; bo'lmasa — birinchi boshlanmagan modul. */
export function continueTarget(modules: PublicModule[], p: Progress, lang: string) {
  const states = modules.map((m) => ({ m, s: moduleState(m, p, lang) }));
  return states.find((x) => x.s.started && !x.s.passed) ?? states.find((x) => !x.s.started) ?? null;
}
