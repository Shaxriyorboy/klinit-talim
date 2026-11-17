"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CircleCheckBig, RefreshCw } from "lucide-react";
import { formatDate, t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { api, type ReviewAnswer, type ReviewBatch } from "@/lib/api";
import { refreshSession, useSession } from "@/lib/progress";
import { QuestionCard } from "./QuestionCard";
import { LoginPrompt } from "./LoginPrompt";
import { Button, ButtonLink, EmptyState, Panel, Progress, Skeleton } from "./kit";

const fmtDate = (iso: string, lang: Locale) => formatDate(iso, lang);

function daysFrom(iso: string) {
  return Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Takrorlash (FSRS): vaqti kelgan savollar — xavfli mavzulardan boshlab. */
export function ReviewSession({ lang }: { lang: Locale }) {
  const session = useSession();
  const [batch, setBatch] = useState<ReviewBatch | null>(null);
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(0);
  const [xp, setXp] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<ReviewBatch>("/review")
      .then((b) => {
        setError(null);
        setBatch(b);
        setLeft(b.due);
        setIdx(0);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (session.user) load();
  }, [session.user, load]);

  if (session.status === "loading") return <Skeleton />;
  if (!session.user) return <LoginPrompt lang={lang} />;
  if (error) return <p className="border-l-4 border-bad bg-bad-soft px-4 py-3 font-medium text-bad">{error}</p>;
  if (!batch) return <Skeleton />;

  const finished = running && idx >= batch.questions.length;
  const coursesBtn = (
    <ButtonLink href={`/${lang}/kurs`} variant="secondary">
      {t(UI.navCourses, lang)}
    </ButtonLink>
  );

  // hozir takrorlash kerak emas
  if (batch.questions.length === 0 || (finished && left === 0)) {
    return (
      <EmptyState
        icon={finished ? <CircleCheckBig /> : <CalendarClock />}
        title={finished ? t(UI.reviewDone, lang) : t(UI.reviewNone, lang)}
        action={coursesBtn}
      >
        {finished && xp > 0 && (
          <p className="tabular-nums">
            +{xp} {t(UI.xp, lang)}
          </p>
        )}
        {batch.next_due ? (
          <p>
            {t(UI.reviewNext, lang)}: <span className="font-semibold text-ink">{fmtDate(batch.next_due, lang)}</span>
          </p>
        ) : (
          !finished && <p>{t(UI.reviewEmpty, lang)}</p>
        )}
      </EmptyState>
    );
  }

  // boshlash yoki navbatdagi to'plam
  if (!running || finished) {
    return (
      <Panel>
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="sm:border-r sm:border-line sm:pr-8">
            <p className="text-[0.8rem] text-muted">{t(UI.reviewDueLabel, lang)}</p>
            <p className="mt-1 text-[2.6rem] font-semibold leading-none tabular-nums text-ink">{finished ? left : batch.due}</p>
          </div>
          <div className="text-[0.92rem] text-ink-2">
            {finished ? (
              <p className="flex items-center gap-2 font-semibold text-ok">
                <CircleCheckBig className="h-5 w-5" /> {t(UI.reviewDone, lang)}
                {xp > 0 && <span className="font-normal tabular-nums text-ink-2">· +{xp} {t(UI.xp, lang)}</span>}
              </p>
            ) : (
              <p>{t(UI.dontKnowHint, lang)}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t border-line px-6 py-4">
          <Button
            onClick={() => {
              if (finished) {
                setRunning(false);
                load();
              } else setRunning(true);
            }}
          >
            <RefreshCw className="h-4 w-4" />
            {finished ? t(UI.reviewMore, lang) : t(UI.reviewStart, lang)}
          </Button>
        </div>
      </Panel>
    );
  }

  const q = batch.questions[idx];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[0.85rem] text-ink-2">
        <span className="font-semibold tabular-nums text-ink">
          {idx + 1} / {batch.questions.length}
        </span>
        <span className="tabular-nums text-muted">
          {left} {t(UI.reviewDue, lang)}
        </span>
      </div>
      <Progress value={(idx / batch.questions.length) * 100} className="mb-6" />
      <div className="rounded-md border border-line bg-surface p-5 sm:p-7">
        <QuestionCard<ReviewAnswer>
          key={q.id}
          q={q}
          lang={lang}
          mode="practice"
          wrongNote={null}
          onCheck={(answer, confidence) => api<ReviewAnswer>("/review/answer", { body: { question_id: q.id, answer, confidence } })}
          extra={(r) => (
            <p className="text-[0.86rem] text-ink-2">
              <CalendarClock className="mr-1.5 inline-block h-4 w-4 align-[-3px] text-muted" />
              {t(UI.reviewNextIn, lang)}: <span className="whitespace-nowrap font-semibold text-ink">{fmtDate(r.next_review, lang)}</span>{" "}
              <span className="whitespace-nowrap tabular-nums text-muted">
                (~{daysFrom(r.next_review)} {lang === "ru" ? "дн." : "kun"})
              </span>
            </p>
          )}
          onDone={(r) => {
            if (r) {
              setLeft(r.due_left);
              setXp((x) => x + r.xp_gained);
            }
            const next = idx + 1;
            setIdx(next);
            if (next >= batch.questions.length) void refreshSession();
          }}
        />
      </div>
    </div>
  );
}
