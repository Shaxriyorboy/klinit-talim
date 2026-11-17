"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Building2, Info } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { api, type Institution, type Report } from "@/lib/api";
import { useSession } from "@/lib/progress";
import { LoginPrompt } from "./LoginPrompt";
import { SourceLink, sectionLabel } from "./SourceLink";
import { Panel, SectionTitle, Skeleton, Stat } from "./kit";

function pct(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

/** Bitta seriyali gorizontal chiziq: qiymat matni har doim yonida (rang yagona ma'lumot emas). */
function Bar({ value, max = 100, label, title, tone = "primary" }: { value: number; max?: number; label: string; title: string; tone?: "primary" | "bad" }) {
  const w = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5" title={title}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${tone === "bad" ? "bg-bad" : "bg-primary"}`} style={{ width: `${w}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-[0.82rem] font-medium tabular-nums text-ink">{label}</span>
    </div>
  );
}

/** Jadval: sarlavha qatori kulrang, qatorlar ingichka chiziq bilan ajratilgan. */
function Table({ head, children, minW = 720 }: { head: { label: ReactNode; className?: string }[]; children: ReactNode; minW?: number }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className="w-full text-left text-[0.88rem]" style={{ minWidth: minW }}>
        <thead className="border-b border-line bg-surface-2 text-[0.74rem] font-semibold uppercase tracking-wider text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className={`px-4 py-2.5 font-semibold ${h.className ?? ""}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function InspectorReport({ lang }: { lang: Locale }) {
  const session = useSession();
  const allowed = session.user?.role === "inspector" || session.user?.role === "admin";
  const [report, setReport] = useState<Report | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [inst, setInst] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    api<Report>(`/reports/overview${inst ? `?institution_id=${inst}` : ""}`)
      .then((r) => alive && setReport(r))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [allowed, inst]);

  useEffect(() => {
    if (!allowed) return;
    api<Institution[]>("/institutions")
      .then(setInstitutions)
      .catch(() => undefined);
  }, [allowed]);

  if (session.status === "loading") return <Skeleton />;
  if (!session.user) return <LoginPrompt lang={lang} />;
  if (!allowed) return <p className="border-l-4 border-accent bg-surface px-4 py-3 text-ink-2">{t(UI.reportForbidden, lang)}</p>;
  if (error) return <p className="border-l-4 border-bad bg-bad-soft px-4 py-3 font-medium text-bad">{error}</p>;
  if (!report) return <Skeleton />;

  const { totals } = report;
  const showDemo = institutions.some((i) => i.name.startsWith("Demo"));

  return (
    <div className="space-y-12">
      {/* filtr */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block text-[0.85rem] font-semibold text-ink" htmlFor="inst">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted" />
            {t(UI.institution, lang)}
          </span>
          <select
            id="inst"
            value={inst}
            onChange={(e) => {
              setReport(null);
              setInst(e.target.value);
            }}
            className="mt-1.5 h-11 w-[min(28rem,90vw)] rounded-md border border-line-strong bg-surface px-3 text-[0.92rem] font-normal text-ink focus:border-ink focus:shadow-[0_0_0_3px_#f2b705] focus:outline-none"
          >
            <option value="">{t(UI.allInstitutions, lang)}</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        {showDemo && (
          <p className="flex items-center gap-1.5 text-[0.8rem] text-muted">
            <Info className="h-4 w-4" />
            {t(UI.demoData, lang)}
          </p>
        )}
      </div>

      {/* asosiy ko'rsatkichlar */}
      <Panel>
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
          <div className="px-5 py-4">
            <Stat value={totals.learners} label={t(UI.tLearners, lang)} />
          </div>
          <div className="px-5 py-4">
            <Stat value={totals.active_learners} label={t(UI.tActive, lang)} sub={`${pct(totals.active_learners, totals.learners)}%`} />
          </div>
          <div className="px-5 py-4">
            <Stat value={totals.lessons_completed} label={t(UI.tLessons, lang)} />
          </div>
          <div className="px-5 py-4">
            <Stat value={totals.tests_passed} label={t(UI.tPassed, lang)} />
          </div>
          <div className="col-span-2 border-t border-line bg-bad-soft/50 px-5 py-4 sm:col-span-1 sm:border-t-0">
            <Stat
              value={totals.confident_wrong_pct != null ? `${totals.confident_wrong_pct}%` : "—"}
              label={
                <span className="inline-flex items-center gap-1 text-bad">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t(UI.tConfWrong, lang)}
                </span>
              }
              sub={t(UI.tConfWrongSub, lang)}
              tone="bad"
            />
          </div>
        </dl>
      </Panel>

      {/* protokollar bo'yicha */}
      <section>
        <SectionTitle title={t(UI.rModules, lang)} lead={t(UI.rGainNote, lang)} />
        <Table
          minW={860}
          head={[
            { label: t(UI.protocol, lang) },
            { label: t(UI.rStarted, lang), className: "w-[15%]" },
            { label: t(UI.rCompleted, lang), className: "w-[15%]" },
            { label: t(UI.rPassed, lang), className: "w-[15%]" },
            { label: t(UI.rPre, lang), className: "text-right" },
            { label: t(UI.rAvg, lang), className: "text-right" },
            { label: t(UI.rGain, lang), className: "text-right" },
          ]}
        >
          {report.modules.map((m) => (
            <tr key={m.slug} className="align-middle">
              <td className="px-4 py-3">
                <p className="font-semibold text-ink">{t(m.title, lang)}</p>
                <p className="text-[0.76rem] text-muted">
                  <span className="font-mono">№{m.protocol_id}</span> · {m.lessons} {t(UI.lessonsN, lang)}
                </p>
              </td>
              <td className="px-4 py-3">
                <Bar value={m.learners_started} max={totals.learners} label={`${m.learners_started}`} title={`${m.learners_started} / ${totals.learners}`} />
              </td>
              <td className="px-4 py-3">
                <Bar value={m.learners_completed_lessons} max={totals.learners} label={`${m.learners_completed_lessons}`} title={`${m.learners_completed_lessons} / ${totals.learners}`} />
              </td>
              <td className="px-4 py-3">
                <Bar value={m.learners_passed} max={totals.learners} label={`${m.learners_passed}`} title={`${m.learners_passed} / ${totals.learners}`} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink-2">{m.avg_pre_score != null ? `${m.avg_pre_score}%` : "—"}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{m.avg_best_score != null ? `${m.avg_best_score}%` : "—"}</td>
              <td className={`px-4 py-3 text-right font-semibold tabular-nums ${m.avg_gain == null ? "text-muted" : m.avg_gain >= 0 ? "text-ok" : "text-bad"}`}>
                {m.avg_gain != null ? `${m.avg_gain >= 0 ? "+" : ""}${m.avg_gain}` : "—"}
              </td>
            </tr>
          ))}
        </Table>
      </section>

      {/* zaif protokol bo'limlari */}
      {report.weak_sections.length > 0 && (
        <section>
          <SectionTitle title={t(UI.rWeak, lang)} lead={t(UI.rWeakText, lang)} />
          <Table
            head={[
              { label: t(UI.section, lang) },
              { label: t(UI.rErrors, lang), className: "w-[24%]" },
              { label: t(UI.tConfWrong, lang), className: "w-[24%]" },
              { label: t(UI.rAttempts, lang), className: "text-right" },
            ]}
          >
            {report.weak_sections.map((w) => (
              <tr key={`${w.module_slug}-${w.section}-${t(w.lesson_title, lang)}`}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">
                    <span className="font-mono font-medium text-ink-2">№{w.protocol_id}</span> · {sectionLabel(w.section, lang)}
                  </p>
                  <p className="text-[0.76rem] text-muted">
                    {t(w.module_title, lang)} · {t(w.lesson_title, lang)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Bar value={w.error_rate} label={`${w.error_rate}%`} title={`${w.error_rate}%`} />
                </td>
                <td className="px-4 py-3">
                  <Bar
                    tone="bad"
                    value={w.confident_wrong_rate ?? 0}
                    label={w.confident_wrong_rate != null ? `${w.confident_wrong_rate}%` : "—"}
                    title={t(UI.tConfWrong, lang)}
                  />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-2">{w.attempts}</td>
              </tr>
            ))}
          </Table>
        </section>
      )}

      {/* muassasalar kesimida */}
      <section>
        <SectionTitle title={t(UI.rInstitutions, lang)} />
        <Table
          head={[
            { label: t(UI.institution, lang) },
            { label: t(UI.tLearners, lang), className: "text-right" },
            { label: t(UI.tActive, lang), className: "w-[20%]" },
            { label: t(UI.tLessons, lang), className: "text-right" },
            { label: t(UI.rPassed, lang), className: "text-right" },
            { label: t(UI.rAvg, lang), className: "text-right" },
            { label: t(UI.tConfWrong, lang), className: "text-right" },
          ]}
        >
          {report.institutions.map((i) => (
            <tr key={i.id ?? "none"}>
              <td className="px-4 py-3">
                <p className="font-semibold text-ink">{i.name}</p>
                <p className="text-[0.76rem] text-muted">{i.region}</p>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{i.learners}</td>
              <td className="px-4 py-3">
                <Bar value={pct(i.active_learners, i.learners)} label={`${pct(i.active_learners, i.learners)}%`} title={`${i.active_learners} / ${i.learners}`} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{i.lessons_completed}</td>
              <td className="px-4 py-3 text-right tabular-nums">{i.tests_passed}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{i.avg_best_score != null ? `${i.avg_best_score}%` : "—"}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-bad">{i.confident_wrong_pct != null ? `${i.confident_wrong_pct}%` : "—"}</td>
            </tr>
          ))}
        </Table>
      </section>

      {/* eng qiyin savollar */}
      <section>
        <SectionTitle title={t(UI.rHardest, lang)} lead={t(UI.rHardestText, lang)} />
        <ol className="divide-y divide-line rounded-md border border-line bg-surface">
          {report.hardest_questions.map((q, i) => (
            <li key={q.id} className="flex gap-4 px-5 py-4">
              <span className="w-6 shrink-0 pt-0.5 font-mono text-[0.85rem] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                {q.case && <p className="mb-1 text-[0.85rem] text-ink-2">{t(q.case, lang)}</p>}
                <p className="font-semibold text-ink">{t(q.prompt, lang)}</p>
                <div className="mt-1.5">
                  <SourceLink source={q.source} lang={lang} compact />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[1.35rem] font-semibold leading-none tabular-nums text-ink">{q.error_rate}%</p>
                <p className="mt-1 text-[0.74rem] text-muted">
                  {t(UI.rErrors, lang)} · {q.attempts} {t(UI.rAttempts, lang)}
                </p>
                {q.confident_wrong_rate != null && q.confident_wrong_rate > 0 && (
                  <p className="text-[0.74rem] font-semibold text-bad">
                    {q.confident_wrong_rate}% {t(UI.rConfWrongShort, lang)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
