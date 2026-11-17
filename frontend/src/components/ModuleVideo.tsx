"use client";

import { useRef, useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { api } from "@/lib/api";
import { refreshSession, useSession } from "@/lib/progress";
import { Tag } from "./kit";

/**
 * Mavzu videosi (~2 daqiqa, subtitr bilan). Oldinga o'tkazib bo'lmaydi;
 * oxirigacha ko'rilganda serverga yoziladi va birinchi dars ochiladi.
 */
export function ModuleVideo({ slug, lang }: { slug: string; lang: Locale }) {
  const session = useSession();
  const seen = session.progress.videos.includes(slug);
  const ref = useRef<HTMLVideoElement>(null);
  const maxRef = useRef(0);
  const [missing, setMissing] = useState(false);
  const [warn, setWarn] = useState(false);
  const [saving, setSaving] = useState(false);

  const onTime = () => {
    const v = ref.current;
    if (!v || v.seeking) return;
    if (v.currentTime > maxRef.current) maxRef.current = v.currentTime;
  };
  const onSeeking = () => {
    const v = ref.current;
    if (!v || seen) return;
    if (v.currentTime > maxRef.current + 0.5) {
      v.currentTime = maxRef.current;
      setWarn(true);
    }
  };
  const onEnded = async () => {
    if (seen || !session.user) return;
    setSaving(true);
    try {
      await api(`/progress/videos/${slug}`, { method: "POST" });
      await refreshSession();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[1.3rem] font-bold leading-tight text-ink">{t(UI.videoTitle, lang)}</h2>
          <p className="mt-1 text-[0.92rem] text-ink-2">{t(UI.videoText, lang)}</p>
        </div>
        {seen && <Tag tone="ok">{t(UI.videoWatched, lang)}</Tag>}
      </div>

      {missing ? (
        <div className="grid aspect-video place-items-center rounded-md border border-dashed border-line-strong bg-surface text-ink-2">{t(UI.videoMissing, lang)}</div>
      ) : (
        <video
          ref={ref}
          key={`${slug}-${lang}`}
          className="aspect-video w-full rounded-md bg-black"
          src={`/videos/${slug}.${lang}.mp4`}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onTimeUpdate={onTime}
          onSeeking={onSeeking}
          onEnded={onEnded}
          onError={() => setMissing(true)}
        />
      )}

      <p className="mt-2 text-[0.8rem] text-muted">
        {!seen && t(UI.videoNoSkip, lang)}
        {!session.user && session.status !== "loading" ? ` ${t(UI.videoLogin, lang)}` : ""}
        {saving ? " …" : ""}
      </p>
    </div>
  );
}
