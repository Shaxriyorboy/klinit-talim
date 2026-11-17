"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight, Clock, FileQuestion, Layers } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { lessonKey, useProgress } from "@/lib/progress";
import { moduleStats, protocolUrl, type PublicModule } from "@/content/types";
import { Avatar } from "./Avatar";
import { Meta, Progress, Tag } from "./kit";

export function useModuleProgress(m: PublicModule) {
  const p = useProgress();
  const done = m.lessons.filter((l) => p.lessons[lessonKey(m.slug, l.slug)]?.done).length;
  const test = p.tests[m.slug];
  return { done, total: m.lessons.length, test, pct: m.lessons.length ? Math.round((done / m.lessons.length) * 100) : 0 };
}

/** Modul qatori (kurs sahifasidagi ro'yxat ichida). */
export function ModuleCard({ m, lang }: { m: PublicModule; lang: Locale }) {
  const { done, total, test, pct } = useModuleProgress(m);

  if (m.status === "soon") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
        <p className="min-w-0 flex-1 text-[0.95rem] text-ink-2">{t(m.title, lang)}</p>
        <a
          href={protocolUrl(m.protocolId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[0.75rem] text-muted hover:text-primary"
        >
          №{m.protocolId}
          {m.standardId ? ` / №${m.standardId}` : ""}
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <Tag>{t(UI.soon, lang)}</Tag>
      </div>
    );
  }

  const st = moduleStats(m);
  const status = test?.passed ? (
    <Tag tone="ok">
      {t(UI.done, lang)} · {test.best}%
    </Tag>
  ) : done > 0 ? (
    <Tag tone="primary">{t(UI.inProgress, lang)}</Tag>
  ) : null;

  return (
    <Link href={`/${lang}/modul/${m.slug}`} className="group flex items-start gap-4 px-4 py-5 transition-colors hover:bg-surface-2/70 sm:px-5">
      <Avatar id={m.lead} size={44} className="mt-0.5 hidden shrink-0 sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[1.05rem] font-semibold leading-snug text-ink group-hover:text-primary-strong group-hover:underline group-hover:underline-offset-4">
            {t(m.title, lang)}
          </p>
          {status}
        </div>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-ink-2">{t(m.short, lang)}</p>
        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[0.8rem] text-muted">
          <Meta icon={<Layers />}>
            {st.lessons} {t(UI.lessonsN, lang)}
          </Meta>
          <Meta icon={<Clock />}>
            ~{st.minutes} {t(UI.minutesN, lang)}
          </Meta>
          <Meta icon={<FileQuestion />}>
            {st.questions} {t(UI.questionsN, lang)}
          </Meta>
          <span className="font-mono">№{m.protocolId}</span>
        </div>
        {done > 0 && (
          <div className="mt-3 flex max-w-md items-center gap-3">
            <Progress value={pct} tone={test?.passed ? "ok" : "primary"} className="flex-1" />
            <span className="text-[0.78rem] tabular-nums text-muted">
              {done}/{total}
            </span>
          </div>
        )}
      </div>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-line-strong transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
    </Link>
  );
}
