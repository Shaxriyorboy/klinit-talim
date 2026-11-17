"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import type { Locale } from "@/lib/i18n";
import { VIDEOS } from "./scripts";
import { Composition } from "./Composition";
import { layout, type Voice } from "./timeline";
import { SPRITES } from "./sprites";

declare global {
  interface Window {
    __seek?: (t: number) => Promise<void>;
    __duration?: number;
    __ready?: boolean;
    /** ovozli sahnalar: [fayl URL, boshlanish soniyasi] — render skripti audio aralashtirish uchun oladi */
    __voice?: { src: string; at: number }[];
  }
}

export type VoiceManifest = { files: (string | null)[]; durations: Voice };

/** public/voice/<slug>/<lang>/manifest.json (scripts/voice-manifest.mjs yaratadi); yo'q bo'lsa — ovozsiz */
async function loadVoice(slug: string, lang: Locale): Promise<VoiceManifest | null> {
  try {
    const r = await fetch(`/voice/${slug}/${lang}/manifest.json`, { cache: "no-store" });
    return r.ok ? ((await r.json()) as VoiceManifest) : null;
  } catch {
    return null;
  }
}

/** Render skripti window.__seek(t) bilan kadrni tanlaydi; brauzerda esa ?play bilan (ovozi bilan) ko'rish mumkin. */
export function StudioPlayer({ slug, lang }: { slug: string; lang: Locale }) {
  const script = VIDEOS[slug];
  const [time, setTime] = useState(() => (typeof window === "undefined" ? 0 : Number(new URLSearchParams(location.search).get("t") ?? 0)));
  const [voice, setVoice] = useState<VoiceManifest | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void loadVoice(slug, lang).then((v) => alive && setVoice(v));
    return () => {
      alive = false;
    };
  }, [slug, lang]);

  useEffect(() => {
    if (voice === undefined) return; // manifest hali yuklanmagan
    const { timed, total } = layout(script, voice?.durations);
    const clips = timed.flatMap((x) =>
      x.voiceAt !== null && voice?.files[x.index] ? [{ src: `/voice/${slug}/${lang}/${voice.files[x.index]}`, at: x.voiceAt }] : [],
    );
    window.__duration = total;
    window.__voice = clips;
    window.__seek = (t: number) =>
      new Promise((resolve) => {
        flushSync(() => setTime(t));
        requestAnimationFrame(() => resolve());
      });
    const images = Object.values(SPRITES).map(
      (s) =>
        new Promise<void>((res) => {
          const img = new Image();
          img.onload = img.onerror = () => res();
          img.src = s!.src;
        }),
    );
    Promise.all([document.fonts.ready, ...images]).then(() => {
      window.__ready = true;
    });
    const params = new URLSearchParams(location.search);
    if (!params.has("play")) return;

    // Ko'rish rejimi: kadrlar va ovoz bir vaqtda
    const from = Number(params.get("t") ?? 0);
    const t0 = performance.now() - from * 1000;
    const audios = clips.map((c) => ({ ...c, el: new Audio(c.src), started: false }));
    let raf = 0;
    const tick = () => {
      const now = (performance.now() - t0) / 1000;
      setTime(now);
      for (const a of audios) {
        if (!a.started && now >= a.at) {
          a.started = true;
          a.el.currentTime = Math.max(0, now - a.at);
          void a.el.play().catch(() => undefined);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      audios.forEach((a) => a.el.pause());
    };
  }, [script, voice, slug, lang]);

  if (voice === undefined) return null;
  return <Composition script={script} time={time} lang={lang} voice={voice?.durations} />;
}
