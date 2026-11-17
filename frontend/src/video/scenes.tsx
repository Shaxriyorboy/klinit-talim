import type { CastMember, SceneId } from "./types";
import { clamp } from "./timeline";

// Sahnalar 1920x1080 koordinatalarda; kamera zoomi uchun chetlari kengroq chizilgan.

function mix(a: string, b: string, k: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * clamp(k))).join(",")})`;
}

function Wall({ top, bottom, floor }: { top: string; bottom: string; floor: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`wall-${top.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`floor-${floor.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={floor} />
          <stop offset="1" stopColor={mix(floor, "#7d8f96", 0.35)} />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={2520} height={1110} fill={`url(#wall-${top.slice(1)})`} />
      <rect x={-300} y={690} width={2520} height={22} fill="rgba(255,255,255,.55)" />
      <rect x={-300} y={712} width={2520} height={60} fill="rgba(0,0,0,.035)" />
      <rect x={-300} y={772} width={2520} height={600} fill={`url(#floor-${floor.slice(1)})`} />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M${-300 + i * 190} 772 L${-700 + i * 260} 1380`} stroke="rgba(255,255,255,.18)" strokeWidth="3" />
      ))}
    </>
  );
}

function Window({ x, y, w, h, t }: { x: number; y: number; w: number; h: number; t: number }) {
  const sway = Math.sin(t * 0.5) * 6;
  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#bfe3f2" />
          <stop offset="1" stopColor="#eaf6fb" />
        </linearGradient>
      </defs>
      <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx="10" fill="#f7fafb" />
      <rect x={x} y={y} width={w} height={h} fill="url(#sky)" />
      <ellipse cx={x + w * 0.3 + Math.sin(t * 0.05) * 40} cy={y + h * 0.3} rx="90" ry="26" fill="#fff" opacity="0.8" />
      <ellipse cx={x + w * 0.72 - Math.sin(t * 0.04) * 30} cy={y + h * 0.18} rx="70" ry="20" fill="#fff" opacity="0.7" />
      <path d={`M${x} ${y + h * 0.78} Q${x + w * 0.3} ${y + h * 0.66} ${x + w * 0.55} ${y + h * 0.76} T${x + w} ${y + h * 0.72} L${x + w} ${y + h} L${x} ${y + h} Z`} fill="#9cc9a7" />
      <rect x={x + w / 2 - 5} y={y} width="10" height={h} fill="#f7fafb" />
      <rect x={x} y={y + h / 2 - 5} width={w} height="10" fill="#f7fafb" />
      {/* pardalar */}
      <path d={`M${x - 40} ${y - 30} L${x + 70 + sway} ${y - 30} Q${x + 40 + sway} ${y + h / 2} ${x + 60 + sway} ${y + h + 40} L${x - 40} ${y + h + 40} Z`} fill="#cfe3e6" />
      <path d={`M${x + w + 40} ${y - 30} L${x + w - 70 - sway} ${y - 30} Q${x + w - 40 - sway} ${y + h / 2} ${x + w - 60 - sway} ${y + h + 40} L${x + w + 40} ${y + h + 40} Z`} fill="#cfe3e6" />
      <rect x={x - 60} y={y - 44} width={w + 120} height="16" rx="8" fill="#b9c9cd" />
      {/* yorug'lik nurlari */}
      <path d={`M${x + 20} ${y + h} L${x + w - 20} ${y + h} L${x + w + 260} 1100 L${x - 120} 1100 Z`} fill="#fff" opacity={0.16 + Math.sin(t * 0.7) * 0.03} />
    </g>
  );
}

function Clock({ x, y, t }: { x: number; y: number; t: number }) {
  const sec = Math.floor(t) * 6;
  const min = 52 * 6 + t * 0.1;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="58" fill="#fff" stroke="#9fb0b7" strokeWidth="8" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="-2" y="-50" width="4" height="10" fill="#7b8b92" transform={`rotate(${i * 30})`} />
      ))}
      <rect x="-3" y="-30" width="6" height="32" rx="3" fill="#34444b" transform="rotate(300)" />
      <rect x="-2.5" y="-44" width="5" height="46" rx="2.5" fill="#34444b" transform={`rotate(${min})`} />
      <rect x="-1" y="-48" width="2" height="54" fill="#c0392b" transform={`rotate(${sec})`} />
      <circle r="5" fill="#34444b" />
    </g>
  );
}

function Monitor({ x, y, t, hr, spo2, color = "#4ade80", w = 300 }: { x: number; y: number; t: number; hr?: number; spo2?: number; color?: string; w?: number }) {
  const h = w * 0.62;
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const px = (i / 60) * (w - 40);
    const ph = (i / 60) * 6 - t * 1.6;
    const beat = ph - Math.floor(ph);
    const yv = beat < 0.08 ? -Math.sin((beat / 0.08) * Math.PI) * 34 : beat < 0.14 ? Math.sin(((beat - 0.08) / 0.06) * Math.PI) * 10 : Math.sin(ph * 2) * 2;
    pts.push(`${px.toFixed(1)},${(h * 0.38 + yv).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-10" y="-10" width={w + 20} height={h + 20} rx="16" fill="#3b4950" />
      <rect width={w} height={h} rx="10" fill="#0d1a1f" />
      <polyline points={pts.join(" ")} transform="translate(20 0)" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
      {hr !== undefined && (
        <text x={w - 18} y={h - 22} textAnchor="end" fill={color} fontSize={w * 0.17} fontWeight="800" fontFamily="var(--font-inter), sans-serif">
          {Math.round(hr)}
        </text>
      )}
      {spo2 !== undefined && (
        <text x="20" y={h - 22} fill="#67e8f9" fontSize={w * 0.12} fontWeight="800" fontFamily="var(--font-inter), sans-serif">
          {Math.round(spo2)}%
        </text>
      )}
      <rect x={w / 2 - 30} y={h + 10} width="60" height={y < 150 ? 40 : 140} fill="#8c9aa1" />
    </g>
  );
}

function IVPole({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 4} y={250} width="8" height={560} fill="#9fb0b7" />
      <rect x={x - 50} y={240} width="100" height="8" rx="4" fill="#9fb0b7" />
      <rect x={x - 46} y={258} width="40" height="80" rx="12" fill="#e6f4f8" stroke="#b8cdd4" strokeWidth="3" />
      <path d={`M${x - 26} 338 C ${x - 26} 420, ${x + 30} 460, ${x + 40} 620`} stroke="#c9dde3" strokeWidth="3" fill="none" />
      <ellipse cx={x} cy={812} rx="70" ry="10" fill="rgba(0,0,0,.08)" />
    </g>
  );
}

function Cabinet({ x }: { x: number }) {
  return (
    <g>
      <rect x={x} y={480} width="260" height="330" rx="10" fill="#e9eff1" stroke="#cdd9dd" strokeWidth="4" />
      <rect x={x + 16} y={500} width="108" height="130" rx="6" fill="#dfe8eb" />
      <rect x={x + 136} y={500} width="108" height="130" rx="6" fill="#dfe8eb" />
      <rect x={x + 16} y={646} width="228" height="70" rx="6" fill="#dfe8eb" />
      <rect x={x + 16} y={728} width="228" height="70" rx="6" fill="#dfe8eb" />
      {[562, 680, 762].map((y) => (
        <rect key={y} x={x + 110} y={y} width="40" height="8" rx="4" fill="#a9b8bd" />
      ))}
      <rect x={x + 30} y={440} width="40" height="40" rx="8" fill="#9ed3c8" />
      <rect x={x + 90} y={448} width="70" height="32" rx="6" fill="#f2c8a0" />
    </g>
  );
}

/** Karavotning orqa qismi (bemor orqasida) */
export function BedBack({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 250} y={440} width="500" height="70" rx="26" fill="#9db7c0" />
      <rect x={x - 230} y={460} width="460" height="300" rx="30" fill="#c7d8de" />
      <ellipse cx={x} cy={600} rx="200" ry="70" fill="#fff" />
    </g>
  );
}

/** Karavotning old qismi (ko'rpa) — bemorning pastki qismini yopadi */
export function BedFront({ x, t }: { x: number; t: number }) {
  const b = Math.sin(t * 1.5) * 3;
  return (
    <g>
      <path d={`M${x - 330} ${780 + b} C ${x - 200} ${740 + b}, ${x + 200} ${740 + b}, ${x + 360} ${770 + b} L${x + 380} 900 L${x - 350} 900 Z`} fill="#e9f2f5" stroke="#cbdbe0" strokeWidth="4" />
      <path d={`M${x - 300} ${800 + b} C ${x - 100} ${780 + b}, ${x + 120} ${790 + b}, ${x + 330} ${790 + b}`} stroke="#d4e2e7" strokeWidth="6" fill="none" />
      <rect x={x - 380} y={880} width="770" height="60" rx="14" fill="#8fa9b2" />
      <rect x={x - 360} y={940} width="16" height="140" fill="#7b939b" />
      <rect x={x + 344} y={940} width="16" height="140" fill="#7b939b" />
      <rect x={x + 330} y={700} width="16" height="190" rx="8" fill="#aebfc5" />
      <rect x={x + 250} y={700} width="96" height="14" rx="7" fill="#aebfc5" />
    </g>
  );
}

/** Yangi tug'ilgan chaqaloq. state: 0 = rangpar/harakatsiz, 1 = pushti, faol */
export function Baby({ x, y, t, state, swaddled = false, scale = 1 }: { x: number; y: number; t: number; state: number; swaddled?: boolean; scale?: number }) {
  const s = clamp(state);
  const skin = mix("#c8b6c3", "#f4b8a4", s);
  const breathe = Math.sin(t * (2 + s * 3)) * (1 + s * 4);
  const kick = s > 0.6 ? Math.sin(t * 3.2) * 10 * (s - 0.6) * 2.5 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="58" rx="150" ry="16" fill="rgba(0,0,0,.08)" />
      {swaddled ? (
        <>
          <path d="M-110 10 C -120 -40, 60 -50, 110 -10 C 130 20, 100 60, 40 62 L -90 62 C -120 60, -126 40, -110 10 Z" fill="#cfe6f1" />
          <path d="M-60 -20 C -30 10, 40 10, 80 -10" stroke="#b5d3e2" strokeWidth="5" fill="none" />
        </>
      ) : (
        <>
          {/* oyoqlar */}
          <rect x="40" y={12 + kick} width="80" height="26" rx="13" fill={skin} transform={`rotate(${-6 + kick * 0.4} 40 24)`} />
          <rect x="40" y={30 - kick} width="80" height="26" rx="13" fill={skin} transform={`rotate(${8 - kick * 0.4} 40 42)`} />
          {/* gavda */}
          <ellipse cx="-10" cy="24" rx="78" ry={42 + breathe * 0.3} fill={skin} />
          <path d="M20 4 C 50 6, 60 40, 30 52" stroke="rgba(150,80,60,.18)" strokeWidth="4" fill="none" />
          {/* qo'llar */}
          <rect x="-50" y={-14 - kick * 0.5} width="64" height="20" rx="10" fill={skin} transform={`rotate(${-20 - kick} -50 -4)`} />
          <rect x="-40" y="44" width="60" height="20" rx="10" fill={skin} transform={`rotate(${14 + kick * 0.6} -40 54)`} />
        </>
      )}
      {/* bosh */}
      <circle cx="-100" cy="10" r="46" fill={skin} />
      <path d="M-140 -10 C -130 -40, -80 -46, -62 -20" stroke={mix("#7a6a6a", "#4a3a30", s)} strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d={s > 0.5 ? "M-118 12 q6 -5 12 0 M-96 12 q6 -5 12 0" : "M-118 12 h12 M-96 12 h12"} stroke="#4a3a35" strokeWidth="3" fill="none" strokeLinecap="round" />
      {s > 0.7 ? <ellipse cx="-100" cy="32" rx="9" ry={4 + Math.abs(Math.sin(t * 6)) * 6} fill="#8a3a3a" /> : <path d="M-108 32 q8 3 16 0" stroke="#8a5a5a" strokeWidth="3" fill="none" />}
      <circle cx="-122" cy="22" r="7" fill="#f28b82" opacity={0.15 + s * 0.3} />
    </g>
  );
}

function Warmer({ x, t, state }: { x: number; t: number; state: number }) {
  const glow = 0.45 + Math.sin(t * 2.2) * 0.08;
  return (
    <g>
      {/* isitgich ustuni va boshi */}
      <rect x={x + 330} y={180} width="26" height="640" rx="10" fill="#b6c5ca" />
      <rect x={x - 230} y={150} width="590" height="40" rx="20" fill="#c9d6da" />
      <rect x={x - 200} y={186} width="300" height="34" rx="12" fill="#7f8f95" />
      <ellipse cx={x - 50} cy={226} rx="150" ry="10" fill="#ff8a4c" opacity={glow} />
      <path d={`M${x - 190} 228 L${x + 90} 228 L${x + 230} 640 L${x - 330} 640 Z`} fill="#ffb27a" opacity={glow * 0.12} />
      {/* monitor */}
      {state >= 0 && <Monitor x={x + 390} y={70} t={t} hr={60 + 80 * clamp(state)} spo2={62 + 30 * clamp(state)} color={state > 0.55 ? "#4ade80" : "#fbbf24"} w={260} />}
      {/* stol */}
      <rect x={x - 330} y={690} width="660" height="40" rx="16" fill="#9fb3ba" />
      <rect x={x - 300} y={660} width="600" height="40" rx="14" fill="#e6f2f6" />
      <rect x={x - 300} y={640} width="20" height="60" rx="8" fill="#c5d5da" />
      <rect x={x + 280} y={640} width="20" height="60" rx="8" fill="#c5d5da" />
      <rect x={x - 40} y={730} width="80" height="250" fill="#a7b8be" />
      <rect x={x - 200} y={970} width="400" height="24" rx="12" fill="#8ea2a9" />
    </g>
  );
}

function Crib({ x, t }: { x: number; t: number }) {
  return (
    <g>
      <rect x={x - 170} y={620} width="340" height="150" rx="24" fill="#f3f8fa" stroke="#cbdbe0" strokeWidth="5" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={x - 150 + i * 37} y={630} width="8" height="130" rx="4" fill="#dbe7eb" />
      ))}
      <Baby x={x + 20} y={630} t={t} state={1} swaddled scale={0.6} />
      <rect x={x - 150} y={770} width="14" height="220" fill="#b9c9ce" />
      <rect x={x + 136} y={770} width="14" height="220" fill="#b9c9ce" />
    </g>
  );
}

/** Orqa fon (kameraga bog'liq qatlam) */
/** Bemor kadrda bo'lmasa ham tug'ruq zali/palatada bo'sh, yig'ilgan karavot turadi */
function emptyBedX(scene: SceneId, cast: CastMember[]) {
  if ((scene !== "delivery" && scene !== "ward") || cast.some((c) => c.inBed)) return null;
  return cast.some((c) => c.x > 900) ? 520 : 1250;
}

export function SceneBack({ scene, t, cast, babyState, warmerX }: { scene: SceneId; t: number; cast: CastMember[]; babyState: number; warmerX: number }) {
  const eb = emptyBedX(scene, cast);
  const beds = eb === null ? cast.filter((c) => c.inBed) : [{ id: "nigora" as const, x: eb, inBed: true }];
  if (scene === "delivery")
    return (
      <g>
        <Wall top="#e8f1f2" bottom="#d6e5e8" floor="#c7d5d9" />
        <Window x={180} y={150} w={380} h={380} t={t} />
        <Clock x={1500} y={190} t={t} />
        <Cabinet x={-60} />
        <IVPole x={1580} />
        <Monitor x={1660} y={360} t={t} hr={140 + Math.sin(t * 0.7) * 4} color="#4ade80" w={240} />
        {beds.map((b) => (
          <BedBack key={b.id} x={b.x} />
        ))}
      </g>
    );
  if (scene === "nicu")
    return (
      <g>
        <Wall top="#e6f0ee" bottom="#d3e3df" floor="#c4d4d1" />
        <Clock x={1700} y={170} t={t} />
        <rect x={1420} y={300} width="200" height="120" rx="12" fill="#f4f8f9" stroke="#cbd8dc" strokeWidth="4" />
        <rect x={1440} y={322} width="160" height="14" rx="7" fill="#9ed3c8" />
        <rect x={1440} y={350} width="110" height="14" rx="7" fill="#c9dde3" />
        <Warmer x={warmerX} t={t} state={babyState} />
      </g>
    );
  if (scene === "ward")
    return (
      <g>
        <Wall top="#f3eee6" bottom="#e7dfd2" floor="#d7cfc2" />
        <Window x={1380} y={140} w={360} h={360} t={t} />
        <g>
          <rect x={160} y={560} width="120" height="250" rx="10" fill="#e9e1d4" />
          <path d="M190 560 C 170 470, 200 430, 220 400 C 240 430, 270 470, 250 560 Z" fill="#8fbf9a" />
          <circle cx="205" cy="430" r="16" fill="#f4a3b8" />
          <circle cx="235" cy="455" r="13" fill="#f7d06b" />
        </g>
        {beds.map((b) => (
          <BedBack key={b.id} x={b.x} />
        ))}
        <Crib x={1640} t={t} />
      </g>
    );
  // studio
  return (
    <g>
      <defs>
        <radialGradient id="studio" cx="0.25" cy="0.35" r="1">
          <stop offset="0" stopColor="#f4f9fa" />
          <stop offset="1" stopColor="#d9e8ec" />
        </radialGradient>
      </defs>
      <rect x={-300} y={-300} width={2520} height={1680} fill="url(#studio)" />
      <circle cx={1700 + Math.sin(t * 0.2) * 30} cy={200} r="260" fill="#0c5c6e" opacity="0.05" />
      <circle cx={200} cy={980} r="320" fill="#c9932b" opacity="0.05" />
      <ellipse cx={430} cy={1060} rx="300" ry="40" fill="rgba(12,92,110,.08)" />
    </g>
  );
}

/** Oldingi qatlam: ko'rpa, chaqaloq va niqob */
export function SceneFront({ scene, t, cast, babyState, warmerX }: { scene: SceneId; t: number; cast: CastMember[]; babyState: number; warmerX: number }) {
  const eb = emptyBedX(scene, cast);
  const beds = eb === null ? cast.filter((c) => c.inBed) : [{ id: "nigora" as const, x: eb }];
  return (
    <g>
      {beds.map((c) => (
        <BedFront key={c.id} x={c.x} t={t} />
      ))}
      {scene === "nicu" && babyState >= 0 && (
        <g>
          <Baby x={warmerX + 40} y={610} t={t} state={babyState} />
          {cast.some((c) => c.pose === "bag") && (
            <g transform={`translate(${warmerX - 70} 600)`}>
              <ellipse cx="0" cy="0" rx="34" ry="28" fill="rgba(200,230,240,.85)" stroke="#7fa7b5" strokeWidth="4" />
              <rect x="-14" y="-90" width="28" height="70" rx="6" fill="#7fa7b5" />
              <ellipse cx="0" cy={-130} rx={58 - Math.max(0, Math.sin(t * 4.2)) * 10} ry="44" fill="#4f8fa6" />
            </g>
          )}
        </g>
      )}
    </g>
  );
}
