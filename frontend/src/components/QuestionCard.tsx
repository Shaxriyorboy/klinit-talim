"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, CheckCircle2, ChevronDown, Stethoscope, X, XCircle } from "lucide-react";
import { t, type L, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import type { PublicQuestion } from "@/content/types";
import type { Confidence, Feedback } from "@/lib/api";

/** "Tanlash" → ishonch belgilanmaydi (null); "Bilmayman" → bo'sh javob, xato hisoblanadi */
type Conf = Confidence | null;
import { SourceLink } from "./SourceLink";
import { Button } from "./kit";

const LETTERS = "ABCDEFGHIJ";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function answerText(q: PublicQuestion, answer: number[], lang: Locale) {
  return answer.map((i) => t(q.options[i], lang)).join(q.type === "order" ? " → " : "; ");
}

/**
 * Savol (AMBOSS / UWorld andozasi): harfli variantlar, tekshiruvdan keyin har variant holati va izohi.
 * mode="practice": javob serverda tekshiriladi (onCheck) → izoh va manba → davom etish (onDone).
 * mode="test": javob tanlanadi va keyingisiga o'tiladi; baholash test yakunida serverda.
 * Javob "Qanchalik ishonasiz?" tugmalaridan biri bilan yuboriladi (Area9 / Knowledge+ uslubi).
 */
export function QuestionCard<R extends Feedback>({
  q,
  lang,
  mode,
  onCheck,
  onDone,
  attemptNote,
  wrongNote = UI.willReturn,
  extra,
}: {
  q: PublicQuestion;
  lang: Locale;
  mode: "practice" | "test";
  onCheck?: (answer: number[], confidence: Conf) => Promise<R>;
  onDone: (result: R | null, answer: number[], confidence: Conf) => void;
  attemptNote?: string;
  /** Xato javobdan keyingi eslatma (mashqda: "savol qaytadi") */
  wrongNote?: L | null;
  /** Natija panelida qo'shimcha qator (masalan, keyingi takrorlash sanasi) */
  extra?: (r: R) => ReactNode;
}) {
  // Variantlar tartibi har safar aralashtiriladi — joyini yodlab olmaslik uchun
  const [display] = useState(() => {
    if (q.type !== "order") return shuffle(q.options.map((_, i) => i));
    let s = shuffle(q.options.map((_, i) => i));
    for (let k = 0; k < 5 && s.every((v, i) => v === i); k++) s = shuffle(s);
    return s;
  });
  const [selected, setSelected] = useState<number[]>(q.type === "order" ? display : []);
  const [result, setResult] = useState<R | null>(null);
  const [confidence, setConfidence] = useState<Conf>(null);
  const [given, setGiven] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checked: null | boolean = result ? result.correct : null;
  const correctSet = result?.correct_answer ?? [];

  const toggle = (i: number) => {
    if (checked !== null) return;
    if (q.type === "single") setSelected([i]);
    else setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };
  const move = (pos: number, dir: -1 | 1) => {
    if (checked !== null) return;
    setSelected((s) => {
      const n = [...s];
      const to = pos + dir;
      if (to < 0 || to >= n.length) return s;
      [n[pos], n[to]] = [n[to], n[pos]];
      return n;
    });
  };

  const canSubmit = !busy && (q.type === "order" || selected.length > 0);
  const submit = async (conf: Conf, answer: number[] = selected) => {
    setConfidence(conf);
    setGiven(answer);
    if (mode === "test" || !onCheck) return onDone(null, answer, conf);
    setBusy(true);
    setError(null);
    try {
      setResult(await onCheck(answer, conf));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const hint = q.type === "single" ? UI.chooseOne : q.type === "multi" ? UI.chooseMany : UI.orderHint;
  const notes = result?.option_notes ?? null;
  const hasNotes = !!notes && notes.some(Boolean);

  return (
    <div className="anim-rise">
      {q.case && (
        <div className="mb-5 flex gap-3 rounded-md border border-line bg-surface-2/70 px-4 py-3">
          <Stethoscope className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted">{t(UI.caseLabel, lang)}</p>
            <p className="mt-0.5 text-ink">{t(q.case, lang)}</p>
          </div>
        </div>
      )}
      <h3 className="text-[1.18rem] font-semibold leading-snug text-ink">{t(q.prompt, lang)}</h3>
      <p className="mt-1 text-[0.82rem] text-muted">
        {t(hint, lang)}
        {attemptNote ? ` · ${attemptNote}` : ""}
      </p>

      {q.type !== "order" ? (
        <ul className="mt-4 space-y-2" role={q.type === "single" ? "radiogroup" : "group"}>
          {display.map((i, pos) => {
            const on = selected.includes(i);
            const isRight = correctSet.includes(i);
            let row = on ? "border-primary bg-primary-soft/70 ring-1 ring-primary" : "border-line bg-surface hover:border-line-strong hover:bg-surface-2/60";
            let box = on ? "border-primary bg-primary text-primary-ink" : "border-line-strong bg-surface text-ink-2";
            let mark: ReactNode = LETTERS[pos];
            if (checked !== null) {
              if (isRight) {
                row = "border-ok bg-ok-soft ring-1 ring-ok";
                box = "border-ok bg-ok text-white";
                mark = <Check className="h-3.5 w-3.5" strokeWidth={3} />;
              } else if (on) {
                row = "border-bad bg-bad-soft ring-1 ring-bad";
                box = "border-bad bg-bad text-white";
                mark = <X className="h-3.5 w-3.5" strokeWidth={3} />;
              } else {
                row = "border-line bg-surface";
                box = "border-line bg-surface-2 text-muted";
              }
            }
            const note = checked !== null ? notes?.[i] : null;
            return (
              <li key={i}>
                <button
                  type="button"
                  role={q.type === "single" ? "radio" : "checkbox"}
                  aria-checked={on}
                  onClick={() => toggle(i)}
                  disabled={checked !== null}
                  className={`flex w-full items-start gap-3 rounded-md border px-3.5 py-3 text-left transition-colors disabled:cursor-default ${row}`}
                >
                  <span
                    className={`mt-px grid h-6 w-6 shrink-0 place-items-center border text-[0.75rem] font-semibold ${q.type === "single" ? "rounded-full" : "rounded-sm"} ${box}`}
                  >
                    {mark}
                  </span>
                  <span className={`pt-px ${checked !== null && !isRight && !on ? "text-ink-2" : "text-ink"}`}>{t(q.options[i], lang)}</span>
                </button>
                {note && (on || showAll) && (
                  <p className={`ml-[2.6rem] mt-1.5 border-l-2 pl-3 text-[0.86rem] leading-snug text-ink-2 ${isRight ? "border-ok" : "border-bad/60"}`}>
                    {!isRight && <span className="font-semibold text-bad">{t(UI.whyWrong, lang)}. </span>}
                    {t(note, lang)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ol className="mt-4 space-y-2">
          {selected.map((optIdx, pos) => {
            let row = "border-line bg-surface";
            if (checked !== null) row = correctSet[pos] === optIdx ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft";
            return (
              <li key={optIdx} className={`flex items-center gap-3 rounded-md border px-3 py-2 ${row}`}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-ink text-[0.8rem] font-semibold tabular-nums text-white">{pos + 1}</span>
                <span className="flex-1 text-ink">{t(q.options[optIdx], lang)}</span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(pos, -1)}
                    disabled={pos === 0 || checked !== null}
                    aria-label="↑"
                    className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(pos, 1)}
                    disabled={pos === selected.length - 1 || checked !== null}
                    aria-label="↓"
                    className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {error && <p className="mt-4 border-l-4 border-bad bg-bad-soft px-4 py-3 text-[0.9rem] font-medium text-bad">{error}</p>}

      {result === null ? (
        <div className="mt-6 border-t border-line pt-5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[2fr_1fr]">
            <Button onClick={() => submit(null)} disabled={!canSubmit} className="h-12">
              {busy && given.length ? "…" : t(UI.pickAnswer, lang)}
            </Button>
            <Button variant="secondary" onClick={() => submit("guess", [])} disabled={busy} className="h-12">
              {busy && !given.length ? "…" : t(UI.confGuess, lang)}
            </Button>
          </div>
          <p className="mt-2 text-[0.78rem] text-muted">{t(UI.dontKnowHint, lang)}</p>
        </div>
      ) : (
        <div className={`mt-6 overflow-hidden rounded-md border anim-rise ${checked ? "border-ok/40" : "border-bad/40"}`} role="status">
          <div className={`flex items-center gap-2 px-4 py-2.5 font-semibold ${checked ? "bg-ok text-white" : "bg-bad text-white"}`}>
            {checked ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {checked ? t(UI.correct, lang) : t(UI.wrong, lang)}
          </div>
          <div className="space-y-3 bg-surface px-4 py-4">
            {!checked && q.type === "order" && (
              <p className="text-[0.92rem] text-ink">
                <span className="font-semibold">{t(UI.rightAnswer, lang)}:</span> {answerText(q, result.correct_answer, lang)}
              </p>
            )}
            <p className="text-[0.95rem] leading-relaxed text-ink">
              <span className="font-semibold">{t(UI.explanation, lang)}. </span>
              {t(result.explanation, lang)}
            </p>
            {result.confidently_wrong && (
              <div className="rounded-md border border-bad/40 bg-bad-soft px-3.5 py-3">
                <p className="flex items-center gap-2 font-semibold text-bad">
                  <AlertTriangle className="h-[18px] w-[18px]" /> {t(UI.confWrongTitle, lang)}
                </p>
                <p className="mt-1 text-[0.88rem] text-ink">{t(UI.confWrongText, lang)}</p>
              </div>
            )}
            {!checked && wrongNote && <p className="text-[0.86rem] text-muted">{t(wrongNote, lang)}</p>}
            {extra?.(result)}
            {hasNotes && q.type !== "order" && (
              <button type="button" onClick={() => setShowAll((x) => !x)} className="inline-flex items-center gap-1 text-[0.86rem] font-semibold text-primary hover:underline">
                <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
                {t(UI.allNotes, lang)}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/60 px-4 py-3">
            <SourceLink source={result.source} lang={lang} />
            <Button autoFocus onClick={() => onDone(result, given, confidence)}>
              {t(UI.continueBtn, lang)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
