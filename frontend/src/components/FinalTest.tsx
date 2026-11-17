"use client";

import { useState } from "react";
import { AlertTriangle, Award, ClipboardCheck, Lock, RotateCcw, TrendingUp } from "lucide-react";
import { formatDate, t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { api, type Confidence, type TestKind, type TestResult, type TestStart } from "@/lib/api";
import { lessonKey, refreshSession, useSession } from "@/lib/progress";
import { FINAL_TEST_SIZE, PASS_PERCENT, type PublicModule } from "@/content/types";
import { QuestionCard, answerText } from "./QuestionCard";
import { SourceLink } from "./SourceLink";
import { Logo } from "./Logo";
import { LoginPrompt } from "./LoginPrompt";
import { Button, ButtonLink, EmptyState, Panel, Progress, Skeleton } from "./kit";

const PRE_TEST_SIZE = 10;
type Given = { question_id: string; answer: number[]; confidence: Confidence | null };

/**
 * Savollar serverda tanlanadi va baholanadi — brauzerda to'g'ri javoblar yo'q.
 * kind="pre": boshlang'ich test (bir marta, baholanmaydi, darslardan oldin) — bilim o'sishini o'lchash uchun.
 */
export function FinalTest({ m, lang, kind = "final" }: { m: PublicModule; lang: Locale; kind?: TestKind }) {
  const session = useSession();
  const [test, setTest] = useState<TestStart | null>(null);
  const [answers, setAnswers] = useState<Given[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.status === "loading") return <Skeleton />;
  if (!session.user) return <LoginPrompt lang={lang} />;

  const isPre = kind === "pre";
  const allDone = m.lessons.every((l) => session.progress.lessons[lessonKey(m.slug, l.slug)]?.done);
  const preScore = session.progress.pretests[m.slug];
  const back = (
    <ButtonLink href={`/${lang}/modul/${m.slug}`} variant="secondary">
      {t(UI.toModule, lang)}
    </ButtonLink>
  );

  if (isPre && preScore !== undefined && !result) {
    return (
      <EmptyState icon={<ClipboardCheck />} title={`${t(UI.preTestDone, lang)}: ${preScore}%`} action={back}>
        {t(UI.preTestResultText, lang)}
      </EmptyState>
    );
  }
  if (!isPre && !allDone) {
    return <EmptyState icon={<Lock />} title={t(UI.finalTestLocked, lang)} action={back} />;
  }

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      setTest(await api<TestStart>(`/tests/${m.slug}/start${isPre ? "?kind=pre" : ""}`, { method: "POST" }));
      setAnswers([]);
      setResult(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (all: typeof answers) => {
    if (!test) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api<TestResult>(`/tests/attempts/${test.attempt_id}/submit`, { body: { answers: all } }));
      void refreshSession();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const errorBox = error && <p className="mt-4 border-l-4 border-bad bg-bad-soft px-4 py-3 font-medium text-bad">{error}</p>;

  // --- boshlash ekrani ---
  if (!test) {
    const rules = isPre
      ? [`${PRE_TEST_SIZE} ${t(UI.preTestShort, lang)}`, t(UI.preTestText, lang)]
      : [`${FINAL_TEST_SIZE} ${t(UI.testIntro, lang)} ${PASS_PERCENT}%`, t(UI.dontKnowHint, lang)];
    return (
      <Panel>
        <div className="flex items-start gap-4 border-b border-line px-6 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            {isPre ? <ClipboardCheck className="h-5 w-5" /> : <Award className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="text-[1.2rem] font-bold text-ink">{t(m.title, lang)}</h2>
            <ul className="mt-2 space-y-1 text-[0.92rem] text-ink-2">
              {rules.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3 px-6 py-4">
          {back}
          <Button onClick={start} disabled={busy}>
            {t(UI.testStart, lang)}
          </Button>
        </div>
        {errorBox && <div className="px-6 pb-5">{errorBox}</div>}
      </Panel>
    );
  }

  // --- savollar ---
  if (!result) {
    const i = answers.length;
    const q = test.questions[Math.min(i, test.questions.length - 1)];
    return (
      <div>
        <div className="mb-2 flex items-center justify-between text-[0.85rem] text-ink-2">
          <span>
            {t(UI.testQuestion, lang)}{" "}
            <span className="font-semibold tabular-nums text-ink">
              {Math.min(i + 1, test.questions.length)} / {test.questions.length}
            </span>
          </span>
        </div>
        <Progress value={(i / test.questions.length) * 100} className="mb-6" />
        <div className="rounded-md border border-line bg-surface p-5 sm:p-7">
          {i < test.questions.length ? (
            <QuestionCard
              key={q.id}
              q={q}
              lang={lang}
              mode="test"
              onDone={(_, answer, confidence) => {
                const next = [...answers, { question_id: q.id, answer, confidence }];
                setAnswers(next);
                if (next.length === test.questions.length) void submit(next);
              }}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
          {errorBox}
        </div>
      </div>
    );
  }

  // --- boshlang'ich test natijasi ---
  if (result.kind === "pre") {
    return (
      <Panel className="anim-rise">
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="sm:border-r sm:border-line sm:pr-8">
            <p className="text-[0.8rem] text-muted">{t(UI.preTestDone, lang)}</p>
            <p className="mt-1 text-[2.6rem] font-semibold leading-none tabular-nums text-ink">{result.score_pct}%</p>
            <p className="mt-1 text-[0.85rem] tabular-nums text-muted">
              {result.correct} / {result.total}
            </p>
          </div>
          <p className="text-[0.95rem] text-ink-2">{t(UI.preTestResultText, lang)}</p>
        </div>
        <div className="flex justify-end border-t border-line px-6 py-4">
          <ButtonLink href={`/${lang}/modul/${m.slug}`}>{t(UI.toModule, lang)}</ButtonLink>
        </div>
      </Panel>
    );
  }

  // --- yakuniy test natijasi ---
  const passed = result.passed;
  const gain = result.pre_score != null ? result.score_pct - result.pre_score : null;
  const date = formatDate(new Date(), lang, true);

  return (
    <div className="space-y-6 anim-rise">
      <Panel className="overflow-hidden">
        <div className={`h-1.5 ${passed ? "bg-ok" : "bg-bad"}`} />
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[auto_1fr]">
          <div className="sm:border-r sm:border-line sm:pr-8">
            <p className="text-[0.8rem] text-muted">{t(UI.finalTest, lang)}</p>
            <p className={`mt-1 text-[2.8rem] font-semibold leading-none tabular-nums ${passed ? "text-ok" : "text-bad"}`}>{result.score_pct}%</p>
            <p className="mt-1 text-[0.85rem] tabular-nums text-muted">
              {result.correct} / {result.total} · {t(UI.testIntro, lang).split("·").pop()?.trim()} {PASS_PERCENT}%
            </p>
          </div>
          <div>
            <h2 className="text-[1.3rem] font-bold text-ink">{passed ? t(UI.testPassed, lang) : t(UI.testFailed, lang)}</h2>
            {!passed && <p className="mt-1 text-[0.92rem] text-ink-2">{t(UI.testFailedText, lang)}</p>}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.88rem] text-ink-2">
              {gain !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-muted" />
                  {t(UI.gain, lang)}: <span className="tabular-nums">{result.pre_score}% → {result.score_pct}%</span>
                  <span className={`font-semibold tabular-nums ${gain >= 0 ? "text-ok" : "text-bad"}`}>
                    ({gain >= 0 ? "+" : ""}
                    {gain})
                  </span>
                </span>
              )}
              {result.xp_gained > 0 && (
                <span className="tabular-nums">
                  +{result.xp_gained} {t(UI.xp, lang)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">
          {back}
          <Button variant={passed ? "secondary" : "primary"} onClick={start} disabled={busy}>
            <RotateCcw className="h-4 w-4" />
            {t(UI.retry, lang)}
          </Button>
        </div>
        {errorBox && <div className="px-6 pb-5">{errorBox}</div>}
      </Panel>

      {passed && (
        <div className="rounded-md border border-line-strong bg-surface p-2">
          <div className="border border-line px-6 py-8 text-center sm:px-12 sm:py-10">
            <div className="flex items-center justify-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="font-semibold text-ink">{t(UI.brand, lang)}</span>
            </div>
            <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-muted">{t(UI.certificate, lang)}</p>
            <p className="mt-4 text-[1.6rem] font-bold text-ink">{session.user.full_name}</p>
            {session.user.institution && <p className="text-[0.85rem] text-muted">{session.user.institution.name}</p>}
            <p className="mt-4 text-ink-2">{t(UI.certText, lang)}:</p>
            <p className="mx-auto mt-1 max-w-lg text-[1.2rem] font-semibold text-primary-strong">«{t(m.title, lang)}»</p>
            <div className="mx-auto mt-6 flex max-w-md justify-between border-t border-line pt-3 text-[0.8rem] text-muted">
              <span className="font-mono">№{m.protocolId}</span>
              <span className="tabular-nums">{result.score_pct}%</span>
              <span>{date}</span>
            </div>
          </div>
        </div>
      )}

      {result.mistakes.length > 0 && (
        <section>
          <h2 className="mb-3 text-[1.2rem] font-bold text-ink">{t(UI.reviewMistakes, lang)}</h2>
          <ul className="divide-y divide-line rounded-md border border-line bg-surface">
            {result.mistakes.map(({ question: q, your_answer, correct_answer, explanation, source, option_notes, confidently_wrong }) => (
              <li key={q.id} className="px-5 py-4">
                {confidently_wrong && (
                  <p className="mb-1.5 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-bad">
                    <AlertTriangle className="h-3.5 w-3.5" /> {t(UI.confWrongTitle, lang)}
                  </p>
                )}
                <p className="font-semibold text-ink">{t(q.prompt, lang)}</p>
                <dl className="mt-2 grid gap-1 text-[0.88rem] sm:grid-cols-[10rem_1fr]">
                  <dt className="text-muted">{t(UI.yourAnswer, lang)}</dt>
                  <dd className="text-bad">{your_answer.length ? answerText(q, your_answer, lang) : "—"}</dd>
                  <dt className="text-muted">{t(UI.rightAnswer, lang)}</dt>
                  <dd className="text-ok">{answerText(q, correct_answer, lang)}</dd>
                </dl>
                {your_answer
                  .filter((i) => !correct_answer.includes(i) && option_notes?.[i])
                  .map((i) => (
                    <p key={i} className="mt-2 border-l-2 border-bad/60 pl-3 text-[0.86rem] text-ink-2">
                      <span className="font-semibold text-bad">{t(UI.whyWrong, lang)}. </span>
                      {t(option_notes![i]!, lang)}
                    </p>
                  ))}
                <p className="mt-2 text-[0.88rem] text-ink-2">{t(explanation, lang)}</p>
                <div className="mt-2">
                  <SourceLink source={source} lang={lang} compact />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
