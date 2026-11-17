"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { api, type ModuleMastery } from "@/lib/api";
import { useSession } from "@/lib/progress";
import { SectionTitle, Skeleton } from "./kit";
import { sectionLabel } from "./SourceLink";

// 0..4 — Khan Academy uslubidagi kvadratchalar: bo'sh → urinib ko'rdi → tanish → mohir → o'zlashtirdi
const SQUARE = [
  "border-line-strong border-dashed bg-surface",
  "border-accent bg-accent-soft",
  "border-primary/50 bg-[linear-gradient(to_top,var(--primary)_45%,var(--primary-soft)_45%)]",
  "border-primary bg-primary/75",
  "border-primary-strong bg-primary-strong",
];

function Square({ level, risky, title }: { level: number; risky?: boolean; title?: string }) {
  return (
    <span title={title} className={`relative inline-block h-7 w-7 rounded-sm border ${SQUARE[level]}`}>
      {risky && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-bad" />}
    </span>
  );
}

/** Protokol bo'limlari bo'yicha o'zlashtirish (Khan Academy uslubi, daraja tushishi bilan). */
export function MasteryView({ lang }: { lang: Locale }) {
  const { user, progress } = useSession();
  const [data, setData] = useState<ModuleMastery[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api<ModuleMastery[]>("/progress/mastery")
      .then(setData)
      .catch(() => setData([]));
    // xp o'zgarsa (yangi javoblar) — qayta yuklash
  }, [user, progress.xp]);

  const risky = (data ?? []).flatMap((m) => m.sections.filter((s) => s.risky).map((s) => ({ m, s })));

  return (
    <section>
      <SectionTitle
        title={t(UI.masteryTitle, lang)}
        lead={t(UI.masteryText, lang)}
      />

      {/* legenda */}
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.8rem] text-ink-2">
        {UI.masteryLevels.map((lv, i) => (
          <li key={i} className="flex items-center gap-2">
            <Square level={i} />
            {t(lv, lang)}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-bad" />
          {t(UI.masteryRisky, lang)}
        </li>
      </ul>

      {data === null ? (
        <Skeleton className="h-40" />
      ) : data.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong bg-surface px-5 py-6 text-center text-ink-2">{t(UI.noProgress, lang)}</p>
      ) : (
        <div className="divide-y divide-line rounded-md border border-line bg-surface">
          {data.map((m) => {
            const mastered = m.sections.filter((s) => s.level >= 3).length;
            return (
              <div key={m.slug} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,280px)_1fr] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-ink">{t(m.title, lang)}</p>
                  <p className="text-[0.78rem] text-muted">
                    <span className="font-mono">№{m.protocol_id}</span> · <span className="tabular-nums">{mastered}/{m.sections.length}</span>{" "}
                    {t(UI.masteryLevels[3], lang).toLowerCase()}+
                  </p>
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label={t(m.title, lang)}>
                  {m.sections.map((s) => (
                    <li key={s.section}>
                      <Square
                        level={s.level}
                        risky={s.risky}
                        title={`${sectionLabel(s.section, lang)} · ${t(s.lesson_title, lang)} — ${t(UI.masteryLevels[s.level], lang)} (${s.correct}/${s.questions})`}
                      />
                      <span className="sr-only">
                        {sectionLabel(s.section, lang)}: {t(UI.masteryLevels[s.level], lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* ishonch bilan xato qilingan bo'limlar — birinchi navbatda */}
      {risky.length > 0 && (
        <div className="mt-4 rounded-md border border-bad/30 bg-surface">
          <p className="flex items-center gap-2 border-b border-bad/20 bg-bad-soft px-5 py-2.5 text-[0.88rem] font-semibold text-bad">
            <AlertTriangle className="h-4 w-4" />
            {t(UI.confWrongTitle, lang)}
          </p>
          <ul className="divide-y divide-line">
            {risky.slice(0, 6).map(({ m, s }) => (
              <li key={`${m.slug}-${s.section}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-5 py-2.5 text-[0.88rem]">
                <span className="text-ink">
                  <span className="font-mono text-ink-2">№{m.protocol_id}</span> · {sectionLabel(s.section, lang)} — {t(s.lesson_title, lang)}
                </span>
                <span className="text-[0.8rem] text-muted">{t(UI.masteryLevels[s.level], lang)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
