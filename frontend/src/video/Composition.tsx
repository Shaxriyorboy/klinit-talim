import { t as tr, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { PERSONAS } from "@/content/personas";
import type { VideoScript } from "./types";
import { Character } from "./Character";
import { SPRITES } from "./sprites";
import type { PersonaId } from "@/content/types";
import { GraphicView } from "./graphics";
import { SceneBack, SceneFront } from "./scenes";
import { H, INTRO, OUTRO, W, XFADE, appear, clamp, ease, layout, lerp, type Timed, type Voice } from "./timeline";

const T = (x: Parameters<typeof tr>[0], lang: Locale) => tr(x, lang).replace(/\{\{([^}]*)\}\}/g, "$1");

function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {/* sayt logotipi bilan bir xil: qalqon (inspeksiya) + tibbiy xoch */}
      <rect width="40" height="40" rx="7" fill="#0b5566" />
      <path d="M20 8l10 4v7c0 6.5-4.3 11.2-10 13-5.7-1.8-10-6.5-10-13v-7z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 15.5v9M15.5 20h9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** 3D rasmli personaj: nafas, yengil chayqalish, gapirganda tebranish (hammasi t ga bog'liq). */
function SpriteActor({
  id,
  x,
  t,
  speaking,
  scale = 1,
  baseY = 1110,
}: {
  id: PersonaId;
  x: number;
  t: number;
  speaking: boolean;
  scale?: number;
  /** pastki chegara: tik turganda — kadr tagidan pastda; karavotda — ko'rpa ortida */
  baseY?: number;
}) {
  const sp = SPRITES[id]!;
  const ph = id.length * 1.7;
  const k = (860 / sp.h) * scale;
  const breath = 1 + Math.sin(t * 1.4 + ph) * 0.006;
  const sway = Math.sin(t * 0.55 + ph) * 5;
  const bob = speaking ? -Math.abs(Math.sin(t * 5.2 + ph)) * 5 : Math.sin(t * 0.9 + ph) * 1.5;
  const rot = speaking ? Math.sin(t * 1.9 + ph) * 0.9 : Math.sin(t * 0.7 + ph) * 0.4;
  const w = sp.w * k;
  const h = sp.h * k;
  return (
    <g transform={`translate(${x + sway} ${baseY + bob}) rotate(${rot}) scale(1 ${breath})`}>
      {baseY > 1000 && <ellipse cx="0" cy="-6" rx={w * 0.42} ry="26" fill="rgba(10,40,50,.18)" />}
      <image href={sp.src} x={-w / 2} y={-h} width={w} height={h} preserveAspectRatio="xMidYMax meet" />
    </g>
  );
}

/** Sarlavha kartochkasidagi doira ichidagi portret */
function SpritePortrait({ id }: { id: PersonaId }) {
  const sp = SPRITES[id]!;
  const [cx, cy, size] = sp.head;
  const k = 400 / size;
  return <image href={sp.src} x={-(cx - size / 2) * k} y={-(cy - size / 2) * k - 30} width={sp.w * k} height={sp.h * k} />;
}

/** Bitta sahna-bitni t vaqtda chizadi */
function BeatFrame({ item, time, lang }: { item: Timed; time: number; lang: Locale }) {
  const { beat, start, end } = item;
  const { shot } = beat;
  const local = time - start;
  const dur = end - start;
  const k = ease(clamp(local / dur));
  const cast = shot.cast ?? [];
  const hasGraphic = !!shot.graphic;
  const wide = shot.scene === "studio" || hasGraphic;
  const [z, cx, cy] = shot.cam ? [0, 1, 2].map((i) => lerp(shot.cam!.from[i], shot.cam!.to[i], k)) : [1, W / 2, H / 2];
  const zoom = wide && shot.scene !== "studio" ? Math.min(z, 1.06) : z;
  const camT = `translate(${W / 2 - cx * zoom} ${H / 2 - cy * zoom}) scale(${zoom})`;
  const babyState = shot.baby ? lerp(shot.baby.from, shot.baby.to, ease(clamp((local - 0.5) / Math.max(1, dur - 1)))) : -1;
  const warmerX = hasGraphic ? 640 : 960;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: hasGraphic && shot.scene !== "studio" ? "blur(1.5px) saturate(.95)" : undefined }}>
        <g transform={camT}>
          <SceneBack scene={shot.scene} t={time} cast={cast} babyState={babyState} warmerX={warmerX} />
          {cast.map((c) => {
            const sp = SPRITES[c.id];
            if (sp && c.inBed)
              // karavotda o'tirgan bemor: beldan pasti ko'rpa (SceneFront) ortida qoladi
              return <SpriteActor key={c.id} id={c.id} x={c.x} t={time} speaking={beat.speaker === c.id} scale={(c.scale ?? 1) * 0.72} baseY={880 + (c.sink ?? 0)} />;
            if (sp) return <SpriteActor key={c.id} id={c.id} x={c.x} t={time} speaking={beat.speaker === c.id} scale={(c.scale ?? 1) * (shot.scene === "studio" ? 1 : shot.scene === "nicu" ? 0.68 : 0.76)} />;
            const scale = (c.scale ?? 1) * (c.inBed ? 1.0 : 1.32);
            const baseY = c.inBed ? 930 : 1080;
            return (
              <g key={c.id} transform={`translate(${c.x} ${baseY}) scale(${scale * (c.facing ?? 1)} ${scale}) translate(-200 -600)`}>
                <Character id={c.id} t={time} pose={c.pose} speaking={beat.speaker === c.id} inBed={c.inBed} />
              </g>
            );
          })}
          <SceneFront scene={shot.scene} t={time} cast={cast} babyState={babyState} warmerX={warmerX} />
        </g>
      </svg>

      {/* infografika paneli */}
      {shot.graphic && (
        <div
          style={{
            position: "absolute",
            left: shot.scene === "studio" ? 790 : 1130,
            top: shot.scene === "studio" ? 90 : 70,
            width: shot.scene === "studio" ? 1060 : 730,
            minHeight: shot.scene === "studio" ? 700 : 0,
            padding: shot.scene === "studio" ? 50 : 36,
            borderRadius: 40,
            background: "rgba(255,255,255,.96)",
            boxShadow: "0 30px 80px -20px rgba(12,60,72,.35)",
            transformOrigin: "left center",
            transform: `translateX(${(1 - appear(local, 0, 0.6)) * 60}px) scale(${shot.scene === "studio" ? 1 : 0.92})`,
            opacity: appear(local, 0, 0.5),
          }}
        >
          <GraphicView g={shot.graphic} lang={lang} local={local} dur={dur} />
        </div>
      )}

      {/* manba */}
      {beat.source && (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 36,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderRadius: 16,
            background: "rgba(255,255,255,.92)",
            color: "#0c5c6e",
            fontSize: 24,
            fontWeight: 700,
            opacity: appear(local, 0.6, 0.5),
            boxShadow: "0 6px 20px rgba(0,0,0,.08)",
          }}
        >
          📄 {T(UI.source, lang)}: {lang === "ru" ? "Протокол" : T({ uz: "Protokol", ru: "" }, lang)} №{beat.source.protocolId} ·{" "}
          {/^\d/.test(beat.source.section) ? (lang === "ru" ? `раздел ${beat.source.section}` : `${beat.source.section}-${T(UI.section, lang)}`) : `«${beat.source.section}»`} ·{" "}
          {lang === "ru" ? `стр. ${beat.source.page}` : `${beat.source.page}-${T(UI.page, lang)}`}
        </div>
      )}
    </div>
  );
}

function Subtitle({ item, time, lang }: { item: Timed; time: number; lang: Locale }) {
  const { beat, start, end } = item;
  const k = appear(time, start, 0.3) * (1 - appear(time, end - 0.25, 0.25));
  const name = beat.speaker ? T(PERSONAS[beat.speaker].name, lang) : null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", opacity: k }}>
      <div style={{ maxWidth: 1560, padding: "18px 34px 22px", borderRadius: 22, background: "rgba(10,24,30,.82)", color: "#fff", textAlign: "center" }}>
        {name && <div style={{ fontSize: 26, fontWeight: 800, color: "#8fe0ef", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{name}</div>}
        <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.3 }}>{T(beat.line, lang)}</div>
      </div>
    </div>
  );
}

function TitleCard({ script, time, lang, outro, total }: { script: VideoScript; time: number; lang: Locale; outro?: boolean; total: number }) {
  const k = outro ? appear(time, total - OUTRO, 0.6) : 1 - appear(time, INTRO - 0.6, 0.6);
  const people = Array.from(new Set(script.beats.map((b) => b.speaker).filter(Boolean))) as (keyof typeof PERSONAS)[];
  const local = outro ? time - (total - OUTRO) : time;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: k,
        background: "radial-gradient(circle at 30% 30%, #0f6d82 0%, #08414f 70%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: appear(local, 0.1), fontSize: 36, fontWeight: 700 }}>
        <Logo size={70} /> {T(UI.brand, lang)}
      </div>
      <div style={{ marginTop: 50, fontSize: outro ? 64 : 92, fontWeight: 900, letterSpacing: -1.5, maxWidth: 1500, lineHeight: 1.08, ...{ opacity: appear(local, 0.4), transform: `translateY(${(1 - appear(local, 0.4)) * 30}px)` } }}>
        {outro ? T({ uz: "Endi darslarga o'ting", ru: "Теперь переходите к урокам" }, lang) : T(script.title, lang)}
      </div>
      <div style={{ marginTop: 26, fontSize: 40, color: "#b9e6ef", opacity: appear(local, 0.9) }}>
        {outro
          ? T({ uz: "To'liq ma'lumot — protokolning o'zida:", ru: "Полная информация — в самом протоколе:" }, lang)
          : T(script.subtitle, lang)}
      </div>
      {outro && <div style={{ marginTop: 18, fontSize: 42, fontWeight: 800, color: "#fff", opacity: appear(local, 1.3) }}>clinical-protocols.uz/protocol/{script.protocolId}</div>}
      <div style={{ marginTop: 70, display: "flex", gap: 34, opacity: appear(local, 1.2) }}>
        {people.map((id, i) => (
          <div key={id} style={{ transform: `translateY(${(1 - appear(local, 1.2 + i * 0.15)) * 30}px)` }}>
            <svg width="190" height="190" viewBox="0 0 400 400" style={{ borderRadius: 95, background: "rgba(255,255,255,.12)" }}>
              <g transform="translate(0 30)">
                {SPRITES[id] ? <SpritePortrait id={id} /> : <Character id={id} t={time} pose="idle" />}
              </g>
            </svg>
            <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700, color: "#d6f1f6" }}>{T(PERSONAS[id].name, lang)}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 50, fontSize: 26, color: "#9ccfd9" }}>
        {T(UI.protocol, lang)} №{script.protocolId} · clinical-protocols.uz
      </div>
    </div>
  );
}

export function Composition({ script, time, lang, voice }: { script: VideoScript; time: number; lang: Locale; voice?: Voice | null }) {
  const { timed, total } = layout(script, voice);
  const idx = timed.findIndex((x) => time >= x.start && time < x.end);
  const cur = idx >= 0 ? timed[idx] : time < INTRO ? timed[0] : timed[timed.length - 1];
  const prev = idx > 0 ? timed[idx - 1] : null;
  const fading = prev && time - cur.start < XFADE;

  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: "#0b1c22", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {fading && prev && <BeatFrame item={prev} time={prev.end} lang={lang} />}
      <div style={{ position: "absolute", inset: 0, opacity: fading ? ease((time - cur.start) / XFADE) : 1 }}>
        <BeatFrame item={cur} time={Math.max(time, cur.start)} lang={lang} />
      </div>
      {idx >= 0 && <Subtitle item={cur} time={time} lang={lang} />}
      {time < INTRO + 0.1 && <TitleCard script={script} time={time} lang={lang} total={total} />}
      {time > total - OUTRO - 0.1 && <TitleCard script={script} time={time} lang={lang} outro total={total} />}
      {/* vinyetka — chuqurlik hissi */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(8,30,38,.28) 100%)" }} />
      {/* yuqori o'ng burchakdagi brend belgisi */}
      <div style={{ position: "absolute", right: 36, top: 30, display: "flex", alignItems: "center", gap: 10, opacity: 0.85 }}>
        <Logo size={40} />
      </div>
    </div>
  );
}
