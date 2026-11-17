"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Award, Check, ChevronRight, ClipboardCheck, Lock, PlayCircle } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { lessonKey, useProgress, useSession } from "@/lib/progress";
import { FINAL_TEST_SIZE, PASS_PERCENT, type PublicModule } from "@/content/types";
import { Tag } from "./kit";

type State = "done" | "current" | "open" | "locked";

/** O'quv rejasi qatori: chapda holat belgisi (vertikal chiziq bilan ulangan), o'ngda mazmun. */
function Row({
  state,
  marker,
  title,
  sub,
  right,
  href,
  last = false,
}: {
  state: State;
  marker: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  href?: string;
  last?: boolean;
}) {
  const dot = {
    done: "border-ok bg-ok text-white",
    current: "border-primary bg-primary text-primary-ink",
    open: "border-line-strong bg-surface text-ink-2",
    locked: "border-line bg-surface-2 text-muted",
  }[state];
  const body = (
    <>
      <div className="relative flex w-9 shrink-0 justify-center self-stretch">
        {!last && <span aria-hidden="true" className={`absolute top-9 bottom-[-20px] w-px ${state === "done" ? "bg-ok/50" : "bg-line"}`} />}
        <span className={`relative grid h-9 w-9 place-items-center rounded-full border text-[0.85rem] font-semibold [&>svg]:h-4 [&>svg]:w-4 ${dot}`}>{marker}</span>
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className={`font-semibold leading-snug ${state === "locked" ? "text-muted" : "text-ink"} ${href ? "group-hover:text-primary-strong group-hover:underline group-hover:underline-offset-4" : ""}`}>
          {title}
        </p>
        {sub && <p className="mt-0.5 text-[0.84rem] text-muted">{sub}</p>}
        {right && <div className="mt-1.5 text-[0.82rem] sm:hidden">{right}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-3 pt-1 text-[0.82rem]">
        {right && <span className="hidden sm:contents">{right}</span>}
        {href && <ChevronRight className="h-5 w-5 text-line-strong group-hover:text-primary" aria-hidden="true" />}
      </div>
    </>
  );
  const cls = `group flex gap-4 px-4 py-4 sm:px-5 ${state === "current" ? "bg-primary-soft/60" : ""}`;
  return <li>{href ? <Link href={href} className={`${cls} hover:bg-surface-2/70`}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
}

/**
 * Modulning o'quv rejasi: boshlang'ich test → mavzu videosi → darslar (ketma-ket ochiladi) → yakuniy test.
 */
export function LessonList({ m, lang }: { m: PublicModule; lang: Locale }) {
  const { user } = useSession();
  const p = useProgress();
  const doneFlags = m.lessons.map((l) => !!p.lessons[lessonKey(m.slug, l.slug)]?.done);
  const videoSeen = p.videos.includes(m.slug);
  const started = doneFlags.some(Boolean);
  const preScore = p.pretests[m.slug];
  const preOk = preScore !== undefined || started; // modulni avval boshlaganlar uchun majburiy emas
  const firstOpen = doneFlags.findIndex((d) => !d);
  const allDone = firstOpen === -1;
  const test = p.tests[m.slug];

  const preState: State = preOk ? "done" : user ? "current" : "open";
  const videoState: State = videoSeen ? "done" : preOk && user ? "current" : "open";

  return (
    <ol className="divide-y divide-line rounded-md border border-line bg-surface">
      {/* boshlang'ich test */}
      <Row
        state={preState}
        marker={preState === "done" ? <Check strokeWidth={3} /> : <ClipboardCheck />}
        title={t(UI.preTest, lang)}
        sub={`10 ${t(UI.preTestShort, lang)}`}
        href={!preOk ? `/${lang}/modul/${m.slug}/boshlangich` : undefined}
        right={
          preScore !== undefined ? (
            <span className="tabular-nums text-ink-2">
              {t(UI.preTestDone, lang)}: <span className="font-semibold text-ink">{preScore}%</span>
            </span>
          ) : started ? null : (
            <span className="font-semibold text-primary">{t(UI.testStart, lang)}</span>
          )
        }
      />

      {/* mavzu videosi */}
      <Row
        state={videoState}
        marker={videoSeen ? <Check strokeWidth={3} /> : <PlayCircle />}
        title={t(UI.videoTitle, lang)}
        sub={t(UI.videoText, lang)}
        href={`#video`}
        right={videoSeen ? <Tag tone="ok">{t(UI.videoWatched, lang)}</Tag> : null}
      />

      {/* darslar */}
      {m.lessons.map((l, i) => {
        const done = doneFlags[i];
        const locked = !done && (i > (firstOpen === -1 ? m.lessons.length : firstOpen) || (i === 0 && (!videoSeen || !preOk)));
        const current = i === firstOpen && !locked;
        const lp = p.lessons[lessonKey(m.slug, l.slug)];
        const state: State = done ? "done" : current ? "current" : locked ? "locked" : "open";
        return (
          <Row
            key={l.slug}
            state={state}
            marker={done ? <Check strokeWidth={3} /> : locked ? <Lock /> : i + 1}
            title={t(l.title, lang)}
            sub={`${t(l.summary, lang)} · ${l.minutes} ${t(UI.minutesN, lang)} · ${l.questions.length} ${t(UI.questionsN, lang)}`}
            href={locked ? undefined : `/${lang}/modul/${m.slug}/dars/${l.slug}`}
            right={
              done ? (
                <span className="tabular-nums text-muted" title={t(UI.firstTry, lang)}>
                  {lp?.firstTry}/{lp?.total}
                </span>
              ) : locked ? (
                <span className="text-muted">{i === 0 && !preOk ? t(UI.preTestFirst, lang) : t(UI.locked, lang)}</span>
              ) : current ? (
                <span className="font-semibold text-primary">{t(UI.start, lang)}</span>
              ) : null
            }
          />
        );
      })}

      {/* yakuniy test */}
      <Row
        last
        state={test?.passed ? "done" : allDone ? "current" : "locked"}
        marker={test?.passed ? <Check strokeWidth={3} /> : allDone ? <Award /> : <Lock />}
        title={t(UI.finalTest, lang)}
        sub={allDone ? `${FINAL_TEST_SIZE} ${t(UI.testIntro, lang)} ${PASS_PERCENT}%` : t(UI.finalTestLocked, lang)}
        href={allDone ? `/${lang}/modul/${m.slug}/test` : undefined}
        right={
          test ? (
            <span className="tabular-nums text-ink-2">
              <span className={`font-semibold ${test.passed ? "text-ok" : "text-ink"}`}>{test.best}%</span>
            </span>
          ) : allDone ? (
            <span className="font-semibold text-primary">{t(UI.testStart, lang)}</span>
          ) : null
        }
      />
    </ol>
  );
}
