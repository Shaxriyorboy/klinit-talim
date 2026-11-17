import { t as tr, type Locale } from "@/lib/i18n";
import type { Graphic } from "./types";
import { appear, clamp, ease, lerp } from "./timeline";

// Infografikalar: HTML panel ichida, `local` = bit boshlanganidan beri soniyalar.

const C = {
  ink: "#12222b",
  ink2: "#3d5260",
  muted: "#64788a",
  line: "#d8e1e7",
  primary: "#0c5c6e",
  soft: "#e1f0f3",
  bad: "#b3261e",
  badSoft: "#fbe9e7",
  ok: "#1d7a4f",
  okSoft: "#e3f4ea",
  warn: "#a16207",
  warnSoft: "#fdf3dc",
  accent: "#c9932b",
};

const rise = (k: number) => ({ opacity: k, transform: `translateY(${(1 - k) * 24}px)` });

function Title({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 44, fontWeight: 800, color: C.ink, letterSpacing: -0.5, marginBottom: 28, lineHeight: 1.15 }}>{children}</div>;
}

export function GraphicView({ g, lang, local, dur }: { g: Graphic; lang: Locale; local: number; dur: number }) {
  const T = (x: Parameters<typeof tr>[0]) => tr(x, lang).replace(/\{\{([^}]*)\}\}/g, "$1");

  switch (g.kind) {
    case "bigStat": {
      const k = appear(local, 0.3, 0.7);
      const color = g.tone === "bad" ? C.bad : g.tone === "ok" ? C.ok : C.primary;
      return (
        <div style={{ textAlign: "center", paddingTop: 70 }}>
          <div style={{ fontSize: 170, fontWeight: 900, color, lineHeight: 1, transform: `scale(${0.7 + 0.3 * k})`, opacity: k }}>{T(g.value)}</div>
          <div style={{ marginTop: 40, fontSize: 40, color: C.ink2, fontWeight: 600, ...rise(appear(local, 1.0)) }}>{T(g.caption)}</div>
        </div>
      );
    }
    case "list":
      return (
        <div>
          <Title>{T(g.title)}</Title>
          {g.items.map((it, i) => {
            const k = appear(local, 0.5 + i * 0.75);
            const bad = g.critical?.includes(i);
            return (
              <div
                key={i}
                style={{
                  ...rise(k),
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  marginBottom: 18,
                  padding: "22px 26px",
                  borderRadius: 22,
                  background: bad ? C.badSoft : C.soft,
                  border: `3px solid ${bad ? "#e8b4ae" : "transparent"}`,
                }}
              >
                <span
                  style={{
                    width: 56,
                    height: 56,
                    flex: "none",
                    borderRadius: 16,
                    display: "grid",
                    placeItems: "center",
                    background: bad ? C.bad : C.primary,
                    color: "#fff",
                    fontSize: 30,
                    fontWeight: 800,
                  }}
                >
                  {bad ? "!" : g.numbered ? i + 1 : "✓"}
                </span>
                <span style={{ fontSize: 38, fontWeight: 700, color: bad ? C.bad : C.ink }}>{T(it)}</span>
              </div>
            );
          })}
        </div>
      );
    case "cycle": {
      const n = g.steps.length;
      const active = Math.floor(clamp((local - 0.6) / Math.max(1, dur - 1.2)) * n * 0.999 + 0.0001);
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ position: "relative", height: 560 }}>
            <svg width="1000" height="560" style={{ position: "absolute", inset: 0 }}>
              <circle cx="500" cy="280" r="200" fill="none" stroke={C.line} strokeWidth="14" />
              <circle
                cx="500"
                cy="280"
                r="200"
                fill="none"
                stroke={C.primary}
                strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 200}`}
                strokeDashoffset={`${2 * Math.PI * 200 * (1 - clamp((local - 0.4) / (dur - 0.8)))}`}
                transform="rotate(-90 500 280)"
                strokeLinecap="round"
              />
            </svg>
            {g.steps.map((st, i) => {
              const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
              const x = 500 + Math.cos(ang) * 200;
              const y = 280 + Math.sin(ang) * 200;
              const on = i <= active;
              const k = appear(local, 0.3 + i * 0.25);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * k) * (i === active ? 1.08 : 1)})`,
                    opacity: k,
                    background: on ? C.primary : "#fff",
                    color: on ? "#fff" : C.ink,
                    border: `4px solid ${C.primary}`,
                    borderRadius: 26,
                    padding: "18px 30px",
                    fontSize: 36,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    boxShadow: i === active ? "0 14px 30px rgba(12,92,110,.3)" : "none",
                  }}
                >
                  {i + 1}. {T(st)}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    case "thresholds":
      return (
        <div>
          <Title>{T(g.title)}</Title>
          {g.rows.map((r, i) => {
            const k = appear(local, 0.5 + i * 0.6);
            return (
              <div
                key={i}
                style={{
                  ...rise(k),
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 28px",
                  marginBottom: 14,
                  borderRadius: 20,
                  background: i % 2 ? "#f6f9fa" : "#fff",
                  border: `2px solid ${C.line}`,
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, color: C.ink2 }}>{T(r.label)}</span>
                <span style={{ fontSize: 40, fontWeight: 900, color: r.bad ? C.bad : C.primary }}>{T(r.value)}</span>
              </div>
            );
          })}
        </div>
      );
    case "monitor": {
      const k = ease(clamp((local - 1.5) / Math.max(1, dur * 0.45)));
      const v = lerp(g.from, g.to, k);
      const bad = v < g.low || v > g.high;
      const color = bad ? "#f87171" : "#4ade80";
      const flash = bad ? 0.65 + 0.35 * Math.abs(Math.sin(local * 5)) : 1;
      const pts: string[] = [];
      const rate = v / 60;
      for (let i = 0; i <= 120; i++) {
        const x = (i / 120) * 900;
        const ph = (i / 120) * 4 * rate - local * rate;
        const b = ph - Math.floor(ph);
        let y = 0;
        if (g.wave === "pleth") y = -Math.max(0, Math.sin(b * Math.PI * 2)) * 60;
        else y = b < 0.06 ? -Math.sin((b / 0.06) * Math.PI) * 80 : b < 0.11 ? Math.sin(((b - 0.06) / 0.05) * Math.PI) * 22 : Math.sin(ph * 6) * 3;
        pts.push(`${x.toFixed(1)},${(130 + y).toFixed(1)}`);
      }
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ background: "#0d1a1f", borderRadius: 28, padding: 30, border: "10px solid #3b4950" }}>
            <svg width="900" height="220">
              <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
            </svg>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10 }}>
              <div style={{ color: "#93a8b2", fontSize: 30, fontWeight: 600 }}>
                {lang === "ru" ? "норма" : tr({ uz: "me'yor", ru: "" }, lang)} {g.low}–{g.high}
              </div>
              <div style={{ color, fontSize: 150, fontWeight: 900, lineHeight: 0.9, opacity: flash }}>
                {Math.round(v)}
                <span style={{ fontSize: 40, marginLeft: 8 }}>{g.unit}</span>
              </div>
            </div>
          </div>
          {g.note && (
            <div style={{ marginTop: 26, padding: "22px 28px", borderRadius: 20, background: C.badSoft, color: C.bad, fontSize: 38, fontWeight: 800, ...rise(bad ? appear(local, 1.5 + dur * 0.45) : 0) }}>
              ⚠ {T(g.note)}
            </div>
          )}
        </div>
      );
    }
    case "timeline": {
      const grow = ease(clamp((local - 0.5) / Math.max(1, dur * 0.6)));
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ position: "relative", height: 460, marginTop: 40 }}>
            <div style={{ position: "absolute", left: 30, right: 30, top: 200, height: 16, borderRadius: 8, background: C.line }} />
            <div style={{ position: "absolute", left: 30, top: 200, height: 16, borderRadius: 8, background: C.primary, width: `calc((100% - 60px) * ${grow})` }} />
            {g.points.map((p, i) => {
              const frac = p.at / g.max;
              const k = appear(local, 0.5 + frac * dur * 0.6, 0.5);
              const up = i % 2 === 0;
              return (
                <div key={i} style={{ position: "absolute", left: `calc(30px + (100% - 60px) * ${frac})`, top: 208, transform: "translateX(-50%)", opacity: k }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: p.color ?? C.primary, border: "6px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,.15)", transform: `translate(0,-50%) scale(${0.5 + 0.5 * k})`, margin: "0 auto" }} />
                  <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: up ? -150 : 40, textAlign: "center", width: 330 }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: p.color ?? C.ink }}>{T(p.label)}</div>
                    {p.sub && <div style={{ fontSize: 28, color: C.muted, marginTop: 6 }}>{T(p.sub)}</div>}
                  </div>
                </div>
              );
            })}
            <div style={{ position: "absolute", right: 30, top: 250, fontSize: 28, color: C.muted }}>{T(g.unit)}</div>
          </div>
        </div>
      );
    }
    case "bars": {
      const max = Math.max(...g.bars.map((b) => b.value));
      return (
        <div>
          <Title>{T(g.title)}</Title>
          {g.bars.map((b, i) => {
            const k = ease(clamp((local - 0.6 - i * 0.5) / 1.2));
            return (
              <div key={i} style={{ marginBottom: 34 }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: C.ink2, marginBottom: 10 }}>{T(b.label)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ flex: 1, height: 56, borderRadius: 14, background: "#eef3f5", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(b.value / max) * 100 * k}%`, background: C.primary, borderRadius: 14 }} />
                  </div>
                  <div style={{ width: 170, textAlign: "right", fontSize: 48, fontWeight: 900, color: C.ink, opacity: k }}>{b.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    case "countdown": {
      const p = clamp((local - 0.5) / Math.max(1, dur - 1));
      const left = Math.ceil(g.seconds * (1 - p));
      const R = 150;
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ display: "flex", gap: 50, alignItems: "center" }}>
            <svg width="360" height="360" style={{ flex: "none" }}>
              <circle cx="180" cy="180" r={R} fill="none" stroke={C.line} strokeWidth="26" />
              <circle cx="180" cy="180" r={R} fill="none" stroke={C.accent} strokeWidth="26" strokeLinecap="round" strokeDasharray={2 * Math.PI * R} strokeDashoffset={2 * Math.PI * R * p} transform="rotate(-90 180 180)" />
              <text x="180" y="196" textAnchor="middle" fontSize="96" fontWeight="900" fill={C.ink} fontFamily="var(--font-inter), sans-serif">
                {left}
              </text>
              <text x="180" y="250" textAnchor="middle" fontSize="30" fill={C.muted} fontFamily="var(--font-inter), sans-serif">
                {lang === "ru" ? "сек" : tr({ uz: "soniya", ru: "" }, lang)}
              </text>
            </svg>
            <div style={{ flex: 1 }}>
              {g.items.map((it, i) => {
                const done = p > (i + 0.6) / g.items.length;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16, fontSize: 36, fontWeight: 700, color: done ? C.ok : C.ink2, opacity: 0.4 + 0.6 * appear(local, 0.3 + i * 0.3) }}>
                    <span style={{ width: 48, height: 48, borderRadius: 24, display: "grid", placeItems: "center", background: done ? C.ok : "#eef3f5", color: "#fff", fontSize: 28 }}>{done ? "✓" : ""}</span>
                    {T(it)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    case "chart": {
      const Wd = 960;
      const Ht = 520;
      const pad = 70;
      const X = (x: number) => pad + (x / g.xMax) * (Wd - pad - 30);
      const Y = (y: number) => Ht - pad - ((y - g.yMin) / (g.yMax - g.yMin)) * (Ht - pad - 20);
      const prog = ease(clamp((local - 0.6) / Math.max(1, dur * 0.55)));
      const pts = [{ x: 0, y: g.points[0].y - 10 }, ...g.points];
      const path = pts.map((p, i) => `${i ? "L" : "M"}${X(p.x)},${Y(p.y)}`).join(" ");
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <svg width={Wd} height={Ht}>
            {[g.yMin, (g.yMin + g.yMax) / 2, g.yMax].map((v) => (
              <g key={v}>
                <line x1={pad} x2={Wd - 20} y1={Y(v)} y2={Y(v)} stroke={C.line} strokeWidth="2" />
                <text x={pad - 14} y={Y(v) + 10} textAnchor="end" fontSize="26" fill={C.muted} fontFamily="var(--font-inter), sans-serif">
                  {v}
                  {T(g.yLabel)}
                </text>
              </g>
            ))}
            <line x1={pad} x2={Wd - 20} y1={Ht - pad} y2={Ht - pad} stroke={C.ink2} strokeWidth="3" />
            <path d={path} fill="none" stroke={C.primary} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog} />
            {g.points.map((p, i) => {
              const k = appear(local, 0.6 + dur * 0.55 * (p.x / g.xMax), 0.4);
              return (
                <g key={i} opacity={k}>
                  <circle cx={X(p.x)} cy={Y(p.y)} r="14" fill={C.primary} stroke="#fff" strokeWidth="5" />
                  <text x={X(p.x)} y={Y(p.y) - 30} textAnchor="middle" fontSize="40" fontWeight="900" fill={C.ink} fontFamily="var(--font-inter), sans-serif">
                    {p.label}
                  </text>
                  <text x={X(p.x)} y={Ht - pad + 44} textAnchor="middle" fontSize="30" fontWeight="700" fill={C.ink2} fontFamily="var(--font-inter), sans-serif">
                    {p.x} {T(g.xLabel)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }
    case "branches": {
      const tone = { ok: [C.ok, C.okSoft], warn: [C.warn, C.warnSoft], bad: [C.bad, C.badSoft] } as const;
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div style={{ flex: "none", padding: "30px 34px", borderRadius: 26, background: C.primary, color: "#fff", fontSize: 40, fontWeight: 900, ...rise(appear(local, 0.3)) }}>{T(g.root)}</div>
            <div style={{ flex: 1 }}>
              {g.branches.map((b, i) => {
                const k = appear(local, 1 + i * 1.2);
                const [fg, bg] = tone[b.tone];
                return (
                  <div key={i} style={{ ...rise(k), display: "flex", alignItems: "center", gap: 20, marginBottom: 20, padding: "20px 24px", borderRadius: 22, background: bg, borderLeft: `10px solid ${fg}` }}>
                    <span style={{ fontSize: 46, fontWeight: 900, color: fg, minWidth: 170 }}>{T(b.when)}</span>
                    <span style={{ fontSize: 34, fontWeight: 700, color: C.ink }}>→ {T(b.then)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    case "compare":
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
            {[g.left, g.right].map((col, ci) => (
              <div key={ci} style={{ borderRadius: 26, padding: 28, background: ci ? C.okSoft : C.soft, ...rise(appear(local, 0.4 + ci * 0.8)) }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: ci ? C.ok : C.primary, marginBottom: 18 }}>{T(col.title)}</div>
                {col.items.map((it, i) => (
                  <div key={i} style={{ fontSize: 32, fontWeight: 600, color: C.ink, marginBottom: 14, display: "flex", gap: 12, ...rise(appear(local, 0.8 + ci * 2.5 + i * 0.7)) }}>
                    <span style={{ color: C.ok }}>✓</span>
                    {T(it)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    case "rhythm": {
      const period = g.pattern.length === 4 ? 2 : 1.25; // 3:1 → 2 s sikl; ventilyatsiya → ~48/daq
      const step = Math.floor(((local % period) / period) * g.pattern.length);
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ display: "flex", gap: 22, justifyContent: "center", margin: "40px 0" }}>
            {g.pattern.map((p, i) => {
              const on = i === step && local > 0.5;
              const last = i === g.pattern.length - 1 && g.pattern.length === 4;
              const base = last || (g.pattern.length === 3 && i === 0) ? C.accent : C.primary;
              return (
                <div
                  key={i}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    display: "grid",
                    placeItems: "center",
                    background: on ? base : "#eef3f5",
                    color: on ? "#fff" : C.ink2,
                    fontSize: 40,
                    fontWeight: 900,
                    transform: `scale(${on ? 1.12 : 1})`,
                    boxShadow: on ? `0 18px 40px ${base}55` : "none",
                  }}
                >
                  {T(p)}
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", fontSize: 38, fontWeight: 700, color: C.ink2, ...rise(appear(local, 1)) }}>{T(g.caption)}</div>
        </div>
      );
    }
    case "uterus": {
      const n = g.marks.length;
      const seg = Math.max(1, (dur - 1) / n);
      const idx = Math.min(n - 1, Math.floor(Math.max(0, local - 0.5) / seg));
      const prev = g.marks[Math.max(0, idx - 1)];
      const cur = g.marks[idx];
      const k = ease(clamp((local - 0.5 - idx * seg) / 1));
      const level = lerp(prev.level, cur.level, idx === 0 ? 1 : k);
      const top = 70 + level * 420;
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
            <svg width="420" height="560" style={{ flex: "none" }}>
              <path d="M110 20 C 60 160, 60 360, 120 540 L300 540 C 360 360, 360 160, 310 20 Z" fill="#f6e2d6" stroke="#e2c3b1" strokeWidth="5" />
              <circle cx="210" cy={70 + 0.3 * 420} r="9" fill="#c9957c" />
              <text x="330" y={70 + 0.3 * 420 + 10} fontSize="24" fill={C.muted} fontFamily="var(--font-inter), sans-serif">
                {lang === "ru" ? "пупок" : tr({ uz: "kindik", ru: "" }, lang)}
              </text>
              <path d={`M150 ${70 + 0.82 * 420} Q210 ${70 + 0.88 * 420} 270 ${70 + 0.82 * 420}`} stroke="#c9957c" strokeWidth="6" fill="none" />
              <text x="300" y={70 + 0.84 * 420} fontSize="24" fill={C.muted} fontFamily="var(--font-inter), sans-serif">
                {lang === "ru" ? "лоно" : tr({ uz: "qov", ru: "" }, lang)}
              </text>
              <path d={`M150 ${top} C 150 ${top - 40}, 270 ${top - 40}, 270 ${top} L 262 520 L 158 520 Z`} fill="#e59a9a" opacity="0.75" />
              <line x1="120" x2="300" y1={top - 30} y2={top - 30} stroke={C.primary} strokeWidth="6" strokeDasharray="12 8" />
            </svg>
            <div style={{ flex: 1 }}>
              {g.marks.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: "22px 26px",
                    marginBottom: 16,
                    borderRadius: 22,
                    background: i === idx ? C.primary : "#f2f6f7",
                    color: i === idx ? "#fff" : C.ink2,
                    opacity: i <= idx ? 1 : 0.35,
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, opacity: 0.85 }}>
                    {lang === "ru" ? `${tr(m.day, lang)}-е сутки` : `${tr(m.day, lang)}-${tr({ uz: "sutka", ru: "" }, lang)}`}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>{T(m.label)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case "cervix": {
      const k = ease(clamp((local - 0.5) / Math.max(1, dur * 0.5)));
      const cm = lerp(1, g.cm, k);
      const r = 30 + cm * 26;
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
            <svg width="460" height="460" style={{ flex: "none" }}>
              <circle cx="230" cy="230" r="215" fill="#f6dcd2" />
              <circle cx="230" cy="230" r={r} fill="#fff" stroke="#d98c7a" strokeWidth="10" />
              <text x="230" y="250" textAnchor="middle" fontSize="64" fontWeight="900" fill={cm >= 5 ? C.primary : C.ink2} fontFamily="var(--font-inter), sans-serif">
                {cm.toFixed(0)} {lang === "ru" ? "см" : tr({ uz: "sm", ru: "" }, lang)}
              </text>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} style={{ flex: 1, height: 40, borderRadius: 8, background: i < Math.round(cm) ? (i >= 4 ? C.primary : "#9fc6cf") : "#eef3f5" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: C.muted }}>
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
              <div style={{ marginTop: 40, fontSize: 40, fontWeight: 800, color: C.primary, ...rise(appear(local, dur * 0.55)) }}>{T(g.caption)}</div>
            </div>
          </div>
        </div>
      );
    }
    case "contractions": {
      const p = clamp((local - 0.4) / Math.max(1, dur * 0.7));
      const shown = Math.min(g.count, Math.floor(p * (g.count + 0.4)));
      let d = "M0 200";
      for (let x = 0; x <= 900 * p; x += 6) {
        const pos = (x / 900) * g.count;
        const b = pos - Math.floor(pos);
        const y = b > 0.25 && b < 0.65 ? -Math.sin(((b - 0.25) / 0.4) * Math.PI) * 150 : 0;
        d += ` L${x} ${200 + y}`;
      }
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <svg width="900" height="260" style={{ background: "#f6f9fa", borderRadius: 24 }}>
              {Array.from({ length: 11 }, (_, i) => (
                <line key={i} x1={i * 90} x2={i * 90} y1="20" y2="240" stroke={C.line} strokeWidth="2" />
              ))}
              <path d={d} fill="none" stroke={C.primary} strokeWidth="7" strokeLinejoin="round" />
            </svg>
            <div style={{ fontSize: 140, fontWeight: 900, color: C.primary }}>{shown}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: 900, fontSize: 26, color: C.muted, marginTop: 10 }}>
            <span>0</span>
            <span>5</span>
            <span>10 {lang === "ru" ? "мин" : tr({ uz: "daq", ru: "" }, lang)}</span>
          </div>
          <div style={{ marginTop: 34, fontSize: 38, fontWeight: 800, color: C.ink, ...rise(appear(local, dur * 0.6)) }}>{T(g.caption)}</div>
        </div>
      );
    }
    case "partogram": {
      // Protokoldagi namuna (2.12): 6:00 — 5 sm, 10:00 — 8 sm, 13:00 — 10 sm
      const marks = [
        { h: 0, cm: 5 },
        { h: 4, cm: 8 },
        { h: 7, cm: 10 },
      ];
      const X = (h: number) => 80 + h * 110;
      const Y = (cm: number) => 470 - (cm - 4) * 70;
      return (
        <div>
          <Title>{T(g.title)}</Title>
          <svg width="960" height="520">
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={X(i)} x2={X(i)} y1={Y(10) - 10} y2={Y(4)} stroke={C.line} strokeWidth="2" />
            ))}
            {[4, 5, 6, 7, 8, 9, 10].map((cm) => (
              <g key={cm}>
                <line x1={X(0)} x2={X(8)} y1={Y(cm)} y2={Y(cm)} stroke={C.line} strokeWidth="2" />
                <text x={X(0) - 18} y={Y(cm) + 9} textAnchor="end" fontSize="26" fill={C.muted} fontFamily="var(--font-inter), sans-serif">
                  {cm}
                </text>
              </g>
            ))}
            <path
              d={marks.map((m, i) => `${i ? "L" : "M"}${X(m.h)},${Y(m.cm)}`).join(" ")}
              fill="none"
              stroke={C.primary}
              strokeWidth="6"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - ease(clamp((local - 1) / Math.max(1, dur * 0.6)))}
            />
            {marks.map((m, i) => {
              const k = appear(local, 1 + (i / 2) * dur * 0.6, 0.4);
              return (
                <g key={i} opacity={k} transform={`translate(${X(m.h)} ${Y(m.cm)}) scale(${0.5 + 0.5 * k})`}>
                  <path d="M-16 -16 L16 16 M16 -16 L-16 16" stroke={C.bad} strokeWidth="8" strokeLinecap="round" />
                </g>
              );
            })}
          </svg>
          <div style={{ fontSize: 38, fontWeight: 800, color: C.primary, ...rise(appear(local, 1.2)) }}>{T(g.caption)}</div>
        </div>
      );
    }
  }
}
