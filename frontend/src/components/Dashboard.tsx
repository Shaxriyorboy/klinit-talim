"use client";

import Link from "next/link";
import { ArrowRight, Award, BookOpen, ChevronRight, ClipboardCheck, PartyPopper, PlayCircle, Star } from "lucide-react";
import type { ReactNode } from "react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { levelOf, useSession } from "@/lib/progress";
import { continueTarget, moduleState, type StepKind } from "@/lib/next-step";
import type { PublicModule } from "@/content/types";
import { LoginPrompt } from "./LoginPrompt";
import { ButtonLink, Panel, Progress, Skeleton, Tag } from "./kit";

const STEP_ICON: Record<StepKind, ReactNode> = {
  pre: <ClipboardCheck />,
  video: <PlayCircle />,
  lesson: <BookOpen />,
  final: <Award />,
  done: <Award />,
};

/** Bosh sahifa (kabinet): qayerda to'xtaganingiz, bir bosishda davom ettirish va kurslar bo'yicha holat. */
export function Dashboard({ lang, modules }: { lang: Locale; modules: PublicModule[] }) {
  const session = useSession();
  if (session.status === "loading") return <Skeleton className="h-96" />;
  if (!session.user) return <LoginPrompt lang={lang} />;

  const p = session.progress;
  const states = modules.map((m) => ({ m, s: moduleState(m, p, lang) }));
  const target = continueTarget(modules, p, lang);
  const nothingStarted = states.every((x) => !x.s.started);
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const lessonsDone = states.reduce((n, x) => n + x.s.lessonsDone, 0);
  const passed = states.filter((x) => x.s.passed).length;
  const { level, pct: levelPct } = levelOf(p.xp);

  const ts = target ? target.s : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[1.7rem] font-bold leading-tight text-ink">
          {t(UI.hello, lang)}, {session.user.full_name}
        </h1>
        <p className="mt-1 text-ink-2">{t(UI.dashLead, lang)}</p>
      </div>

      {/* davom ettirish */}
      {target && ts ? (
        <Panel className="overflow-hidden border-primary/30">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="text-[0.8rem] font-semibold uppercase tracking-wider text-primary">
                {nothingStarted ? t(UI.startLearning, lang) : t(UI.continueTitle, lang)}
              </p>
              <h2 className="mt-1 text-[1.35rem] font-bold leading-snug text-ink">{t(target.m.title, lang)}</h2>
              {nothingStarted && <p className="mt-1 text-[0.92rem] text-ink-2">{t(UI.startFromBeginning, lang)}</p>}
              <div className="mt-4 flex items-center gap-3 rounded-md border border-line bg-surface-2/60 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-ink [&>svg]:h-[18px] [&>svg]:w-[18px]">
                  {STEP_ICON[ts.next.kind]}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.75rem] text-muted">{t(UI.nextStep, lang)}</span>
                  <span className="block truncate font-semibold text-ink">
                    {ts.next.lessonIndex !== undefined && `${ts.next.lessonIndex + 1}-${t(UI.lessonN, lang)}: `}
                    {t(ts.next.title, lang)}
                  </span>
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Progress value={ts.pct} className="flex-1" />
                <span className="text-[0.85rem] font-semibold tabular-nums text-ink-2">{ts.pct}%</span>
              </div>
            </div>
            <ButtonLink href={ts.next.href} size="lg" className="w-full md:w-auto">
              {nothingStarted ? t(UI.startLearning, lang) : t(UI.continueTitle, lang)}
              <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </Panel>
      ) : (
        <Panel className="flex items-center gap-4 p-6">
          <PartyPopper className="h-8 w-8 shrink-0 text-ok" />
          <div>
            <h2 className="text-[1.2rem] font-bold text-ink">{t(UI.allFinished, lang)}</h2>
            <p className="text-ink-2">{t(UI.allFinishedText, lang)}</p>
          </div>
        </Panel>
      )}

      {/* ko'rsatkichlar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<BookOpen />} label={t(UI.lessonsDoneLbl, lang)} value={`${lessonsDone} / ${totalLessons}`}>
          <Progress value={totalLessons ? (lessonsDone / totalLessons) * 100 : 0} tone="ok" />
        </StatCard>
        <StatCard icon={<Award />} label={t(UI.testsPassedLbl, lang)} value={`${passed} / ${modules.length}`}>
          <Progress value={modules.length ? (passed / modules.length) * 100 : 0} tone="ok" />
        </StatCard>
        <StatCard icon={<Star />} label={`${t(UI.level, lang)}: ${t(UI.levels[level], lang)}`} value={`${p.xp} ${t(UI.xp, lang)}`}>
          <Progress value={levelPct} />
        </StatCard>
      </div>

      {/* kurslar */}
      <section aria-labelledby="my-courses">
        <h2 id="my-courses" className="mb-3 text-[1.2rem] font-bold text-ink">
          {t(UI.myCourses, lang)}
        </h2>
        <ul className="divide-y divide-line rounded-md border border-line bg-surface">
          {states.map(({ m, s }) => {
            const tag = s.passed ? (
              <Tag tone="ok">{t(UI.completed, lang)}</Tag>
            ) : s.started ? (
              <Tag tone="primary">{t(UI.inProgress, lang)}</Tag>
            ) : (
              <Tag>{t(UI.notStarted, lang)}</Tag>
            );
            const test = p.tests[m.slug];
            const pre = p.pretests[m.slug];
            return (
              <li key={m.slug}>
                <Link href={s.passed ? `/${lang}/modul/${m.slug}` : s.next.href} className="group flex items-center gap-4 px-5 py-4 hover:bg-surface-2/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink group-hover:text-primary-strong">{t(m.title, lang)}</p>
                      {tag}
                    </div>
                    <p className="mt-0.5 text-[0.84rem] text-muted">
                      {s.lessonsDone}/{m.lessons.length} {t(UI.lessonsN, lang)}
                      {pre !== undefined && ` · ${t(UI.preTestDone, lang)}: ${pre}%`}
                      {test && ` · ${t(UI.finalTest, lang)}: ${test.best}%`}
                      {!s.passed && ` · ${t(UI.nextStep, lang)}: ${t(s.next.title, lang)}`}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={s.pct} tone={s.passed ? "ok" : "primary"} className="max-w-md flex-1" />
                      <span className="text-[0.78rem] tabular-nums text-muted">{s.pct}%</span>
                    </div>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-[0.88rem] font-semibold text-primary sm:inline-flex">
                    {s.passed ? t(UI.openModule, lang) : s.started ? t(UI.continueTitle, lang) : t(UI.start, lang)}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-line-strong sm:hidden" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, children }: { icon: ReactNode; label: string; value: string; children?: ReactNode }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2 text-[0.82rem] text-muted [&>svg]:h-4 [&>svg]:w-4">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-[1.5rem] font-semibold leading-none tabular-nums text-ink">{value}</p>
      {children && <div className="mt-3">{children}</div>}
    </Panel>
  );
}
