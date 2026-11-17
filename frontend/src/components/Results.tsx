"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Baby, ChevronRight, Footprints, Gem, HeartHandshake, LineChart } from "lucide-react";
import { t, type L, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { LEVEL_XP, lessonKey, levelOf, useSession, type Progress as P } from "@/lib/progress";
import type { PublicModule } from "@/content/types";
import { LoginPrompt } from "./LoginPrompt";
import { MasteryView } from "./MasteryView";
import { Panel, Progress, SectionTitle, Skeleton, Stat } from "./kit";

const l = (uz: string, ru: string): L => ({ uz, ru });

const BADGES: { id: string; title: L; desc: L; Icon: LucideIcon; test: (p: P) => boolean }[] = [
  { id: "first", title: l("Birinchi qadam", "Первый шаг"), desc: l("Birinchi darsni o'zlashtirdi", "Освоен первый урок"), Icon: Footprints, test: (p) => Object.values(p.lessons).some((x) => x.done) },
  { id: "flawless", title: l("Xatosiz", "Без ошибок"), desc: l("Darsdagi barcha savollarga birinchi urinishda to'g'ri", "Все вопросы урока верно с первой попытки"), Icon: Gem, test: (p) => Object.values(p.lessons).some((x) => x.done && x.firstTry === x.total) },
  { id: "parto", title: l("Partogramma ustasi", "Мастер партограммы"), desc: l("Partogramma yakuniy testi", "Итоговый тест по партограмме"), Icon: LineChart, test: (p) => !!p.tests["partogramma"]?.passed },
  { id: "golden", title: l("Oltin daqiqa", "Золотая минута"), desc: l("Chaqaloq reanimatsiyasi yakuniy testi", "Итоговый тест по реанимации"), Icon: Baby, test: (p) => !!p.tests["chaqaloq-reanimatsiyasi"]?.passed },
  { id: "care", title: l("G'amxo'r parvarish", "Заботливый уход"), desc: l("Tug'ruqdan keyingi davr yakuniy testi", "Итоговый тест по послеродовому периоду"), Icon: HeartHandshake, test: (p) => !!p.tests["tugruqdan-keyingi-davr"]?.passed },
];

export function Results({ lang, modules }: { lang: Locale; modules: PublicModule[] }) {
  const session = useSession();
  const p = session.progress;
  const { level, next, pct } = levelOf(p.xp);
  if (session.status === "loading") return <Skeleton />;
  if (!session.user) return <LoginPrompt lang={lang} />;

  const lessonsDone = Object.values(p.lessons).filter((x) => x.done).length;
  const testsPassed = Object.values(p.tests).filter((x) => x.passed).length;

  return (
    <div className="space-y-12">
      {/* profil va daraja */}
      <Panel>
        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-[1.2rem] font-bold text-ink">{session.user.full_name}</p>
            <p className="truncate text-[0.88rem] text-muted">
              {[session.user.position, session.user.institution?.name].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[0.88rem] text-ink-2">
                {t(UI.level, lang)} {level + 1}: <span className="font-semibold text-ink">{t(UI.levels[level], lang)}</span>
              </p>
              <p className="text-[0.82rem] tabular-nums text-muted">
                {p.xp}
                {next ? ` / ${next}` : ""} {t(UI.xp, lang)}
              </p>
            </div>
            <Progress value={pct} className="mt-2" />
            <ol className="mt-2 grid grid-cols-4 text-[0.72rem] text-muted">
              {UI.levels.map((lv, i) => (
                <li key={i} className={i <= level ? "font-semibold text-ink-2" : ""}>
                  {t(lv, lang)}
                  <span className="block tabular-nums font-normal">{LEVEL_XP[i]}+</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <dl className="grid grid-cols-2 divide-line border-t border-line sm:grid-cols-3 sm:divide-x">
          {[
            { v: lessonsDone, l: t(UI.tLessons, lang) },
            { v: testsPassed, l: t(UI.tPassed, lang) },
            { v: Object.keys(p.pretests).length, l: t(UI.preTest, lang) },
          ].map((x, i) => (
            <div key={i} className="px-6 py-4">
              <Stat value={x.v} label={x.l} />
            </div>
          ))}
        </dl>
      </Panel>

      <MasteryView lang={lang} />

      {/* modullar bo'yicha */}
      <section>
        <SectionTitle title={t(UI.progressBy, lang)} />
        <ul className="divide-y divide-line rounded-md border border-line bg-surface">
          {modules.map((m) => {
            const done = m.lessons.filter((x) => p.lessons[lessonKey(m.slug, x.slug)]?.done).length;
            const test = p.tests[m.slug];
            const pre = p.pretests[m.slug];
            return (
              <li key={m.slug}>
                <Link href={`/${lang}/modul/${m.slug}`} className="group grid gap-3 px-5 py-4 hover:bg-surface-2/70 sm:grid-cols-[1fr_200px_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink group-hover:text-primary-strong group-hover:underline group-hover:underline-offset-4">{t(m.title, lang)}</p>
                    <p className="mt-0.5 text-[0.8rem] tabular-nums text-muted">
                      {pre !== undefined && (
                        <>
                          {t(UI.rPre, lang)} {pre}% ·{" "}
                        </>
                      )}
                      {t(UI.finalTest, lang)}: {test ? <span className={test.passed ? "font-semibold text-ok" : "text-ink-2"}>{test.best}%</span> : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(done / m.lessons.length) * 100} tone={test?.passed ? "ok" : "primary"} className="flex-1" />
                    <span className="w-10 text-right text-[0.8rem] tabular-nums text-muted">
                      {done}/{m.lessons.length}
                    </span>
                  </div>
                  <ChevronRight className="hidden h-5 w-5 text-line-strong group-hover:text-primary sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* nishonlar */}
      <section>
        <SectionTitle title={t(UI.badges, lang)} />
        <ul className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {BADGES.map((b) => {
            const on = b.test(p);
            return (
              <li key={b.id} className={`flex gap-3 bg-surface px-4 py-4 ${on ? "" : "opacity-60"}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${on ? "border-accent/40 bg-accent-soft text-accent" : "border-line bg-surface-2 text-muted"}`}>
                  <b.Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className={`text-[0.9rem] font-semibold ${on ? "text-ink" : "text-ink-2"}`}>{t(b.title, lang)}</p>
                  <p className="text-[0.76rem] leading-snug text-muted">{t(b.desc, lang)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
