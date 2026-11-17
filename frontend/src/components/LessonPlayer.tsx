"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, CircleCheckBig, Lock } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { lessonKey, refreshSession, useSession } from "@/lib/progress";
import { api, type AnswerResult } from "@/lib/api";
import type { PublicLesson, PublicModule } from "@/content/types";
import { LoginPrompt } from "./LoginPrompt";
import { QuestionCard } from "./QuestionCard";
import { SourceLink } from "./SourceLink";
import { Button, ButtonLink, EmptyState, Skeleton } from "./kit";

type Step = 0 | 1 | 2; // tushunchalar → mashq → natija (video — modul sahifasida, butun holda)

export function LessonPlayer({ m, lesson, lang }: { m: PublicModule; lesson: PublicLesson; lang: Locale }) {
  const session = useSession();
  const progress = session.progress;
  const already = !!progress.lessons[lessonKey(m.slug, lesson.slug)]?.done;
  const idx = m.lessons.findIndex((l) => l.slug === lesson.slug);
  const videoSeen = progress.videos.includes(m.slug);
  const prevDone = idx === 0 ? videoSeen : !!progress.lessons[lessonKey(m.slug, m.lessons[idx - 1].slug)]?.done;
  const nextLesson = m.lessons[idx + 1];

  const [step, setStep] = useState<Step>(0);
  const [unlocked, setUnlocked] = useState<Step>(0);
  const [result, setResult] = useState<{ firstTry: number; total: number; xp: number } | null>(null);

  const reach = (s: Step) => {
    setUnlocked((u) => (s > u ? s : u));
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const steps = [UI.stepConcepts, UI.stepPractice, UI.stepDone];
  const maxStep: Step = already ? 2 : unlocked;

  if (session.status === "loading") return <Skeleton />;
  if (!session.user) return <LoginPrompt lang={lang} />;

  if (!prevDone && !already) {
    return (
      <EmptyState
        icon={<Lock />}
        title={idx === 0 ? t(UI.videoFirst, lang) : t(UI.locked, lang)}
        action={
          <ButtonLink href={`/${lang}/modul/${m.slug}`} variant="secondary">
            {t(UI.toModule, lang)}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div>
      {/* qadamlar */}
      <ol className="mb-8 flex border-b border-line" aria-label="steps">
        {steps.map((s, i) => {
          const active = i === step;
          const open = i <= maxStep;
          const passed = i < maxStep || (i === 2 && already);
          return (
            <li key={i} className="flex-1">
              <button
                type="button"
                disabled={!open}
                onClick={() => setStep(i as Step)}
                aria-current={active ? "step" : undefined}
                className={`relative flex w-full items-center gap-2 px-1 pb-3 pt-1 text-left text-[0.9rem] font-medium transition-colors disabled:cursor-not-allowed ${
                  active ? "text-ink" : open ? "text-ink-2 hover:text-ink" : "text-muted"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.72rem] font-semibold ${
                    passed && !active ? "border-ok bg-ok text-white" : active ? "border-primary bg-primary text-primary-ink" : "border-line-strong text-muted"
                  }`}
                >
                  {passed && !active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="truncate">{t(s, lang)}</span>
                {active && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-primary" />}
              </button>
            </li>
          );
        })}
      </ol>

      {step === 0 && <Concepts lesson={lesson} lang={lang} free={already} onDone={() => reach(1)} />}

      {step === 1 && (
        <Practice
          key={lesson.slug}
          moduleSlug={m.slug}
          lesson={lesson}
          lang={lang}
          onDone={(r) => {
            setResult({ firstTry: r.first_try, total: r.total, xp: r.xp_gained });
            reach(2);
            void refreshSession();
          }}
        />
      )}

      {step === 2 && (
        <section className="overflow-hidden rounded-md border border-line bg-surface anim-rise">
          <div className="flex items-start gap-4 border-b border-line bg-ok-soft px-6 py-6">
            <CircleCheckBig className="mt-0.5 h-8 w-8 shrink-0 text-ok" />
            <div>
              <h2 className="text-[1.45rem] font-bold leading-tight text-ink">{t(UI.lessonDone, lang)}</h2>
              <p className="mt-1 text-ink-2">{t(UI.lessonDoneText, lang)}</p>
            </div>
          </div>
          {result && (
            <dl className="grid grid-cols-2 divide-x divide-line border-b border-line">
              <div className="px-6 py-4">
                <dt className="text-[0.8rem] text-muted">{t(UI.firstTry, lang)}</dt>
                <dd className="mt-1 text-[1.6rem] font-semibold tabular-nums text-ink">
                  {result.firstTry}/{result.total}
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-[0.8rem] text-muted">
                  {t(UI.earned, lang)} ({t(UI.xp, lang)})
                </dt>
                <dd className="mt-1 text-[1.6rem] font-semibold tabular-nums text-ink">+{result.xp}</dd>
              </div>
            </dl>
          )}
          <div className="flex flex-wrap justify-end gap-3 px-6 py-4">
            <ButtonLink href={`/${lang}/modul/${m.slug}`} variant="secondary">
              {t(UI.toModule, lang)}
            </ButtonLink>
            {nextLesson ? (
              <ButtonLink href={`/${lang}/modul/${m.slug}/dars/${nextLesson.slug}`}>
                {t(UI.nextLesson, lang)}: {t(nextLesson.title, lang)}
              </ButtonLink>
            ) : (
              <ButtonLink href={`/${lang}/modul/${m.slug}/test`}>{t(UI.toFinal, lang)}</ButtonLink>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asosiy tushunchalar: har bir kartochka o'qilishi kerak (minimal vaqt)
// ---------------------------------------------------------------------------
function Concepts({ lesson, lang, free, onDone }: { lesson: PublicLesson; lang: Locale; free: boolean; onDone: () => void }) {
  const [i, setI] = useState(0);
  // nechta kartochka to'liq o'qilgan (o'qish vaqti tugagan)
  const [read, setRead] = useState(free ? lesson.concepts.length : 0);
  const lastCard = i === lesson.concepts.length - 1;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4 text-[0.82rem] text-muted">
        <span className="tabular-nums">
          {i + 1} / {lesson.concepts.length} {t(UI.cardOf, lang)}
        </span>
        <span className="flex gap-1">
          {lesson.concepts.map((_, k) => (
            <button
              key={k}
              type="button"
              disabled={k > read}
              onClick={() => setI(k)}
              aria-label={`${k + 1}`}
              className={`h-1.5 w-7 rounded-full transition-colors ${k === i ? "bg-primary" : k < read ? "bg-primary/35" : "bg-line"}`}
            />
          ))}
        </span>
      </div>
      <ConceptCard
        key={i}
        concept={lesson.concepts[i]}
        lang={lang}
        mustWait={i >= read}
        isFirst={i === 0}
        isLast={lastCard}
        onRead={() => setRead((r) => Math.max(r, i + 1))}
        onBack={() => setI(Math.max(0, i - 1))}
        onNext={() => (lastCard ? onDone() : setI(i + 1))}
      />
    </section>
  );
}

function ConceptCard({
  concept: c,
  lang,
  mustWait,
  isFirst,
  isLast,
  onRead,
  onBack,
  onNext,
}: {
  concept: PublicLesson["concepts"][number];
  lang: Locale;
  mustWait: boolean;
  isFirst: boolean;
  isLast: boolean;
  onRead: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const text = t(c.body, lang) + (c.points ?? []).map((p) => t(p, lang)).join(" ");
  const need = Math.min(8000, Math.max(3000, text.length * 25));
  const [left, setLeft] = useState(mustWait ? need : 0);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => {
      const next = Math.max(0, left - 250);
      setLeft(next);
      if (next === 0) onRead();
    }, 250);
    return () => clearTimeout(id);
  }, [left, onRead]);

  return (
    <>
      <article className="rounded-md border border-line bg-surface anim-rise">
        <div className="px-6 pb-6 pt-6 sm:px-8 sm:pt-7">
          <h2 className="text-[1.45rem] font-bold leading-snug text-ink">{t(c.title, lang)}</h2>
          <p className="mt-3 max-w-[65ch] text-[1.03rem] leading-[1.7] text-ink-2">{t(c.body, lang)}</p>
          {c.points && (
            <ol className="mt-5 divide-y divide-line border-y border-line">
              {c.points.map((p, k) => (
                <li key={k} className="flex gap-4 py-3">
                  <span className="w-5 shrink-0 pt-px font-mono text-[0.85rem] text-primary">{k + 1}.</span>
                  <span className="font-medium text-ink">{t(p, lang)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="border-t border-line bg-surface-2/60 px-6 py-3 sm:px-8">
          <SourceLink source={c.source} lang={lang} />
        </div>
      </article>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={onBack} disabled={isFirst}>
          <ChevronLeft className="h-4 w-4" />
          {t(UI.back, lang)}
        </Button>
        <Button onClick={onNext} disabled={left > 0} size="lg" className="relative min-w-[11rem] overflow-hidden disabled:cursor-wait disabled:opacity-100">
          {left > 0 && (
            <>
              <span aria-hidden="true" className="absolute inset-0 bg-primary/55" />
              <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200" style={{ width: `${100 - (left / need) * 100}%` }} />
            </>
          )}
          <span className="relative tabular-nums">
            {left > 0 ? `${t(UI.readFirst, lang)} ${Math.ceil(left / 1000)}` : isLast ? t(UI.toPractice, lang) : t(UI.understood, lang)}
          </span>
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mashq: xato javob navbat oxiriga qaytadi; hamma savol to'g'ri bo'lmaguncha tugamaydi
// ---------------------------------------------------------------------------
function Practice({
  moduleSlug,
  lesson,
  lang,
  onDone,
}: {
  moduleSlug: string;
  lesson: PublicLesson;
  lang: Locale;
  onDone: (r: AnswerResult) => void;
}) {
  const total = lesson.questions.length;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<number[]>(() => lesson.questions.map((_, i) => i));
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [round, setRound] = useState(0);

  // Har safar yangi mashq sessiyasi serverda ochiladi; javoblar shu sessiyaga yoziladi
  useEffect(() => {
    let alive = true;
    api<{ session_id: string }>("/practice/sessions", { body: { module_slug: moduleSlug, lesson_slug: lesson.slug } })
      .then((r) => alive && setSessionId(r.session_id))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [moduleSlug, lesson.slug]);

  const mastered = total - queue.length;
  const current = queue[0];

  const handle = (r: AnswerResult | null) => {
    if (!r) return;
    if (r.lesson_completed) return onDone(r);
    setAttempts({ ...attempts, [current]: (attempts[current] ?? 0) + 1 });
    const rest = queue.slice(1);
    setQueue(r.correct ? rest : [...rest, current]);
    setRound((x) => x + 1);
  };

  if (error) return <p className="border-l-4 border-bad bg-bad-soft px-4 py-3 font-medium text-bad">{error}</p>;
  if (!sessionId || current === undefined) return <Skeleton />;
  const q = lesson.questions[current];
  const tries = attempts[current] ?? 0;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4 text-[0.82rem]">
        <span className="text-ink-2">
          <span className="font-semibold tabular-nums text-ink">
            {mastered}/{total}
          </span>{" "}
          {t(UI.mastered, lang)}
        </span>
        <span className="text-muted">{t(UI.practiceIntro, lang)}</span>
      </div>
      <div className="mb-6 flex gap-1" aria-hidden="true">
        {lesson.questions.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${!queue.includes(i) ? "bg-ok" : i === current ? "bg-primary" : (attempts[i] ?? 0) > 0 ? "bg-bad/50" : "bg-line"}`}
          />
        ))}
      </div>
      <div className="rounded-md border border-line bg-surface p-5 sm:p-7">
        <QuestionCard
          key={`${current}-${round}`}
          q={q}
          lang={lang}
          mode="practice"
          onCheck={(answer, confidence) =>
            api<AnswerResult>(`/practice/sessions/${sessionId}/answer`, { body: { question_id: q.id, answer, confidence } })
          }
          onDone={handle}
          attemptNote={tries > 0 ? t({ uz: `${tries + 1}-urinish`, ru: `попытка ${tries + 1}` }, lang) : undefined}
        />
      </div>
    </section>
  );
}
