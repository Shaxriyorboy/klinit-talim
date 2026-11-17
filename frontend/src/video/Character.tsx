import { PERSONAS } from "@/content/personas";
import type { PersonaId } from "@/content/types";
import type { Pose } from "./types";

// Yarim gavdali personaj (zamonaviy "explainer" uslubi). Hamma harakat vaqt (t) ning sof funksiyasi.
// Koordinatalar: viewBox 0 0 400 600, bosh markazi ~ (200,105), yelkalar y≈215.

type ArmPose = [number, number]; // [yelka, tirsak] gradusda; 0 = pastga

export function shade(hex: string, k: number) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const out = n.map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Toraygan kapsula (bo'g'in) — (0,0) dan (0,len) gacha */
function limb(len: number, w1: number, w2: number) {
  const a = w1 / 2;
  const b = w2 / 2;
  return `M${-a} 0 L${-b} ${len} A${b} ${b} 0 0 0 ${b} ${len} L${a} 0 A${a} ${a} 0 0 0 ${-a} 0 Z`;
}

function posePair(pose: Pose, t: number, phase: number): { L: ArmPose; R: ArmPose; prop?: "clipboard" } {
  const osc = (f: number, a: number) => Math.sin(t * f + phase) * a;
  switch (pose) {
    case "explain":
      return { L: [8, -18], R: [22 + osc(1.6, 5), -108 + osc(2.2, 12)] };
    case "point":
      return { L: [7, -14], R: [76 + osc(1.2, 3), -14 + osc(1.8, 4)] };
    case "clipboard":
      return { L: [14, -98], R: [12, -72 + osc(1.2, 4)], prop: "clipboard" };
    case "hold":
      return { L: [18, -88], R: [18, -88] };
    case "bag":
      return { L: [30, -62], R: [52 + osc(4.2, 3), -36 + osc(4.2, 6)] };
    case "compress": {
      const push = Math.max(0, Math.sin(t * 9.4)) * 6;
      return { L: [44 + push * 0.6, -40], R: [48 + push * 0.6, -34] };
    }
    case "wave":
      return { L: [7, -14], R: [150, -22 + osc(5, 20)] };
    case "listen":
      return { L: [12, -86], R: [12, -86] };
    default:
      return { L: [6 + osc(1.1, 1.2), -8], R: [6 + osc(1.1, 1.2), -8] };
  }
}

type Look = (typeof PERSONAS)[PersonaId]["look"];

function Arm({ side, ang, look, longSleeve, shirt }: { side: "L" | "R"; ang: ArmPose; look: Look; longSleeve: boolean; shirt: string }) {
  const sx = side === "L" ? 104 : 296;
  const dir = side === "L" ? 1 : -1;
  const [a, b] = ang;
  const sleeve = look.coat ? "#fbfdfe" : shirt;
  const sleeveLine = look.coat ? "#d6dfe5" : shade(shirt, -0.15);
  const skin = look.skin;
  const skinDark = shade(skin, -0.14);
  return (
    <g transform={`translate(${sx} 222) rotate(${a * dir})`}>
      {/* yelka-bilak: uzun yengda butunlay kiyim, qisqa yengda yarmi teri */}
      {longSleeve ? (
        <>
          <path d={limb(148, 50, 42)} fill={sleeve} stroke={sleeveLine} strokeWidth="2" />
          <path d={`M${-12 * dir} 20 Q${-16 * dir} 80 ${-10 * dir} 140`} stroke={shade(sleeve, -0.1)} strokeWidth="5" fill="none" opacity="0.5" />
        </>
      ) : (
        <>
          <path d={limb(148, 42, 36)} fill={skin} stroke={skinDark} strokeWidth="2" />
          <path d="M-27 -6 C -27 -30, 27 -30, 27 -6 L 27 84 Q 0 92 -27 84 Z" fill={sleeve} stroke={sleeveLine} strokeWidth="2" />
          <path d="M-27 80 Q 0 88 27 80 L 27 88 Q 0 96 -27 88 Z" fill={shade(shirt, -0.14)} />
        </>
      )}
      <g transform={`translate(0 140) rotate(${b * dir})`}>
        {/* bilak */}
        <path d={longSleeve ? limb(128, 40, 31) : limb(128, 35, 28)} fill={longSleeve ? sleeve : skin} stroke={longSleeve ? sleeveLine : skinDark} strokeWidth="2" />
        {longSleeve && <rect x={-17} y={104} width={34} height={14} rx={5} fill={look.coat ? "#e6edf1" : shade(shirt, -0.12)} />}
        {/* kaft */}
        <g transform="translate(0 124)">
          <path d="M-15 0 C -18 18, -14 36, -4 42 C 4 46, 14 40, 16 26 L 15 0 Z" fill={skin} stroke={skinDark} strokeWidth="1.5" />
          <path d={`M${-13 * dir} 6 C ${-24 * dir} 12, ${-26 * dir} 24, ${-17 * dir} 28`} stroke={skin} strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M-6 30 L-6 40 M1 31 L1 42 M8 29 L8 38" stroke={skinDark} strokeWidth="1.5" opacity="0.6" />
        </g>
      </g>
    </g>
  );
}

export function Character({
  id,
  t,
  pose = "idle",
  speaking = false,
  inBed = false,
}: {
  id: PersonaId;
  t: number;
  pose?: Pose;
  speaking?: boolean;
  inBed?: boolean;
}) {
  const { look } = PERSONAS[id];
  const phase = id.length * 1.37;
  const breath = Math.sin(t * 1.5 + phase) * 1.6;
  const blinkT = (t + phase * 0.9) % 4.1;
  const eyeOpen = blinkT < 0.13 ? 0.08 : 1;
  const tilt = Math.sin(t * 0.8 + phase) * 1.6 + (speaking ? Math.sin(t * 2.6) * 1.8 : 0);
  const nod = speaking ? Math.max(0, Math.sin(t * 3.3)) * 2 : 0;
  const mouth = speaking ? 0.15 + 0.85 * Math.abs(Math.sin(t * 10.5 + phase)) * (0.55 + 0.45 * Math.sin(t * 3.7)) : 0;
  const gaze = (t * 0.35 + phase) % 6 < 0.6 ? 2 : 0; // vaqti-vaqti bilan nigoh siljishi
  const arms = posePair(inBed ? "listen" : pose, t, phase);

  const female = id === "nigora" || id === "dilnoza" || id === "malika";
  const scarf = look.style === "scarf";
  const coat = look.coat;
  const gid = `c-${id}`;
  const skin = look.skin;
  const skinShadow = shade(skin, -0.16);
  const hair = look.hair;
  const hairHi = shade(hair, 0.28);
  const longSleeve = coat || id === "sardor" || id === "nigora";
  const shirt = id === "nigora" ? "#e7a3b6" : look.outfit;

  const torso = "M86 236 C 96 212, 140 200, 200 200 C 260 200, 304 212, 314 236 L 330 600 L 70 600 Z";
  const face = "M156 98 C 156 52, 244 52, 244 98 C 244 140, 226 162, 200 164 C 174 162, 156 140, 156 98 Z";

  return (
    <svg viewBox="0 0 400 600" width={400} height={600} overflow="visible" aria-hidden="true">
      <defs>
        <clipPath id={`${gid}-head`}>
          <path d={face} />
        </clipPath>
        <clipPath id={`${gid}-torso`}>
          <path d={torso} />
        </clipPath>
        <linearGradient id={`${gid}-light`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#0a2730" stopOpacity="0" />
          <stop offset="1" stopColor="#0a2730" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {!inBed && <ellipse cx="200" cy="596" rx="150" ry="13" fill="rgba(20,40,50,.12)" />}

      <g transform={`translate(0 ${breath * 0.5})`}>
        {/* orqa soch (turmak) */}
        {look.style === "bun" && <path d="M150 104 C 140 150, 146 182, 162 196 L 238 196 C 254 182, 260 150, 250 104 Z" fill={shade(hair, -0.1)} />}

        {/* ro'mol — yelkaga tushgan qismi */}
        {scarf && <path d="M132 160 C 120 230, 150 262, 200 266 C 250 262, 280 230, 268 160 C 256 120, 144 120, 132 160 Z" fill={look.outfit} />}

        {/* gavda */}
        <path d={torso} fill={coat ? "#fbfdfe" : shirt} />
        <g clipPath={`url(#${gid}-torso)`}>
          {coat ? (
            <>
              <path d="M168 200 L 200 300 L 232 200 Z" fill={look.outfit} />
              <path d="M176 200 L 200 268 L 224 200 Z" fill={shade(look.outfit, -0.12)} />
              <path d="M164 198 L 142 250 L 176 286 L 200 304 L 178 210 Z" fill="#ffffff" stroke="#d3dce2" strokeWidth="2" />
              <path d="M236 198 L 258 250 L 224 286 L 200 304 L 222 210 Z" fill="#ffffff" stroke="#d3dce2" strokeWidth="2" />
              <path d="M200 304 L 196 600" stroke="#d3dce2" strokeWidth="3" />
              <path d="M120 430 L 172 430 L 170 486 L 122 486 Z" fill="none" stroke="#d3dce2" strokeWidth="3" />
              <path d="M232 340 L 276 340 L 274 380 L 234 380 Z" fill="none" stroke="#d3dce2" strokeWidth="3" />
              <rect x="238" y="320" width="34" height="22" rx="3" fill={look.outfit} />
              <rect x="244" y="326" width="14" height="10" rx="2" fill="#fff" opacity="0.8" />
              <path d="M110 300 Q 128 380 120 520" stroke="#e4ebef" strokeWidth="8" fill="none" />
              <path d="M290 300 Q 272 380 282 520" stroke="#e4ebef" strokeWidth="8" fill="none" />
            </>
          ) : id === "sardor" ? (
            <>
              <path d="M170 200 L 200 236 L 230 200 L 222 196 L 200 220 L 178 196 Z" fill={shade(shirt, 0.15)} />
              <path d="M200 236 L 200 600" stroke={shade(shirt, -0.2)} strokeWidth="3" />
              {[270, 330, 390, 450].map((y) => (
                <circle key={y} cx="206" cy={y} r="4" fill={shade(shirt, -0.3)} />
              ))}
              <path d="M126 320 L 168 320 L 166 360 L 128 360 Z" fill="none" stroke={shade(shirt, -0.18)} strokeWidth="3" />
            </>
          ) : scarf ? (
            <>
              {Array.from({ length: 40 }, (_, i) => (
                <circle key={i} cx={90 + ((i * 53) % 230)} cy={290 + Math.floor(i / 5) * 40} r="4" fill="#fff" opacity="0.35" />
              ))}
            </>
          ) : (
            <>
              <path d="M164 200 L 200 262 L 236 200 Z" fill={shade(shirt, -0.22)} />
              <path d="M164 200 L 200 262 L 236 200" fill="none" stroke={shade(shirt, 0.15)} strokeWidth="6" />
              <path d="M120 330 L 170 330 L 168 380 L 122 380 Z" fill="none" stroke={shade(shirt, -0.15)} strokeWidth="3" />
              <path d="M140 330 L 140 316 M150 330 L 150 312" stroke="#2f6f8f" strokeWidth="4" strokeLinecap="round" />
              {look.style === "surgcap" && (
                <path d="M162 214 C 176 246, 224 246, 238 214 L 232 206 C 220 228, 180 228, 168 206 Z" fill="#9ec7e0" stroke="#7fb0cf" strokeWidth="2" />
              )}
            </>
          )}
          <rect x="60" y="190" width="290" height="420" fill={`url(#${gid}-light)`} />
          <path d="M150 200 C 170 214, 230 214, 250 200 L 250 214 C 230 228, 170 228, 150 214 Z" fill="#0a2730" opacity="0.08" />
        </g>
        {coat && <path d={torso} fill="none" stroke="#d3dce2" strokeWidth="2.5" />}

        {/* stetoskop */}
        {look.stethoscope && (
          <g fill="none" strokeLinecap="round">
            <path d="M170 204 C 150 250, 158 300, 182 322" stroke="#2c3a43" strokeWidth="6" />
            <path d="M230 204 C 250 250, 246 292, 226 314" stroke="#2c3a43" strokeWidth="6" />
            <path d="M182 322 C 196 336, 214 330, 226 314" stroke="#2c3a43" strokeWidth="6" />
            <path d="M204 330 L 204 372" stroke="#2c3a43" strokeWidth="6" />
            <circle cx="204" cy="384" r="13" fill="#b9c8d1" stroke="#2c3a43" strokeWidth="4" />
          </g>
        )}

        {/* bo'yin */}
        {!scarf && (
          <>
            <path d="M178 148 L 222 148 L 226 206 C 214 216, 186 216, 174 206 Z" fill={skin} />
            <path d="M178 160 C 190 176, 210 176, 222 160 L 222 176 C 210 186, 190 186, 178 176 Z" fill={skinShadow} opacity="0.55" />
          </>
        )}

        {/* bosh */}
        <g transform={`translate(200 110) rotate(${tilt}) translate(-200 ${-110 + nod})`}>
          {!scarf && (
            <>
              <ellipse cx="156" cy="108" rx="9" ry="13" fill={skin} />
              <ellipse cx="244" cy="108" rx="9" ry="13" fill={skin} />
              <path d="M152 104 q4 4 2 10 M248 104 q-4 4 -2 10" stroke={skinShadow} strokeWidth="2" fill="none" />
            </>
          )}

          {scarf && <path d="M148 100 C 144 30, 256 30, 252 100 C 256 150, 236 178, 200 182 C 164 178, 144 150, 148 100 Z" fill={look.outfit} />}

          {/* yuz */}
          <path d={face} fill={skin} />
          <g clipPath={`url(#${gid}-head)`}>
            <path d="M228 60 C 252 90, 248 140, 214 168 L 260 170 L 260 50 Z" fill={skinShadow} opacity="0.35" />
            <ellipse cx="200" cy="58" rx="60" ry="16" fill={skinShadow} opacity="0.25" />
          </g>

          {/* sochlar / bosh kiyim */}
          {look.style === "bun" && (
            <>
              <path d="M152 104 C 146 50, 196 34, 222 44 C 248 52, 256 80, 248 106 C 240 84, 226 70, 204 66 C 186 74, 170 86, 160 108 Z" fill={hair} />
              <path d="M170 60 C 186 50, 210 48, 226 54" stroke={hairHi} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
              <circle cx="214" cy="32" r="20" fill={hair} />
              <path d="M202 24 C 210 18, 222 20, 226 28" stroke={hairHi} strokeWidth="3" fill="none" opacity="0.7" />
            </>
          )}
          {look.style === "short" && (
            <>
              <path d="M154 98 C 148 52, 182 36, 206 38 C 236 40, 254 62, 246 100 C 240 82, 228 72, 214 70 C 196 76, 176 72, 162 80 C 158 86, 156 92, 154 98 Z" fill={hair} />
              <path d="M180 50 C 196 44, 218 44, 234 54" stroke={hairHi} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
            </>
          )}
          {scarf && (
            <>
              <path d="M162 74 C 176 60, 224 60, 238 74 C 222 68, 178 68, 162 74 Z" fill={hair} />
              <path d="M150 90 C 152 40, 248 40, 250 90 C 236 62, 164 62, 150 90 Z" fill={shade(look.outfit, 0.08)} />
              <path d="M170 52 C 190 44, 212 44, 232 52" stroke={shade(look.outfit, 0.25)} strokeWidth="4" fill="none" opacity="0.7" />
            </>
          )}
          {look.style === "cap" && (
            <>
              <path d="M160 92 C 166 78, 182 72, 196 74 C 186 82, 176 90, 172 100 Z" fill={hair} />
              <path d="M150 92 C 140 36, 260 36, 250 92 C 236 78, 164 78, 150 92 Z" fill={look.outfit} />
              <path d="M150 92 C 164 78, 236 78, 250 92" fill="none" stroke={shade(look.outfit, -0.2)} strokeWidth="5" />
              <path d="M172 52 C 190 46, 214 46, 232 54" stroke={shade(look.outfit, 0.25)} strokeWidth="4" fill="none" opacity="0.8" />
              <path d="M186 62 C 200 58, 214 60, 224 66" stroke={shade(look.outfit, -0.12)} strokeWidth="3" fill="none" />
            </>
          )}
          {look.style === "surgcap" && (
            <>
              <path d="M150 96 C 142 34, 258 34, 250 96 C 236 80, 164 80, 150 96 Z" fill={look.outfit} />
              <path d="M150 96 C 164 80, 236 80, 250 96" fill="none" stroke={shade(look.outfit, -0.25)} strokeWidth="5" />
              {[[172, 56], [196, 48], [222, 54], [184, 72], [212, 70], [236, 76]].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={look.accent} opacity="0.8" />
              ))}
            </>
          )}
          {look.beard && (
            <path d="M158 110 C 160 146, 178 166, 200 166 C 222 166, 240 146, 242 110 C 236 132, 224 140, 210 140 C 204 136, 196 136, 190 140 C 176 140, 164 132, 158 110 Z" fill={hair} opacity="0.92" />
          )}

          {/* qoshlar */}
          {[
            [168, 186],
            [214, 232],
          ].map(([x1, x2], i) => {
            const lift = speaking ? Math.abs(Math.sin(t * 2.1)) * 1.5 : 0;
            const mid = (x1 + x2) / 2;
            return (
              <path
                key={i}
                d={`M${x1} ${90 - lift + (i ? -1 : 1)} Q${mid} ${84 - lift} ${x2} ${88 - lift + (i ? 1 : -1)}`}
                stroke={scarf ? "#3a2a22" : hair}
                strokeWidth={female ? 3.2 : 4.4}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* ko'zlar */}
          {[177, 223].map((cx) => (
            <g key={cx}>
              {eyeOpen > 0.5 ? (
                <>
                  <path d={`M${cx - 9} 104 Q${cx} 96 ${cx + 9} 104 Q${cx} 110 ${cx - 9} 104 Z`} fill="#fff" />
                  <circle cx={cx + gaze} cy="103.5" r="4.6" fill="#3b2617" />
                  <circle cx={cx + gaze} cy="103.5" r="2.2" fill="#120b07" />
                  <circle cx={cx + 1.6 + gaze} cy="102" r="1.3" fill="#fff" />
                  <path d={`M${cx - 10} 103.5 Q${cx} 94 ${cx + 10} 103.5`} stroke="#21160f" strokeWidth={female ? 2.6 : 1.8} fill="none" strokeLinecap="round" />
                  {female && <path d={`M${cx + (cx < 200 ? -10 : 10)} 103 l${cx < 200 ? -4 : 4} -3`} stroke="#21160f" strokeWidth="2" strokeLinecap="round" />}
                </>
              ) : (
                <path d={`M${cx - 9} 104 Q${cx} 108 ${cx + 9} 104`} stroke="#21160f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              )}
            </g>
          ))}
          {look.glasses && (
            <g fill="none" stroke="#3a454d" strokeWidth="2.6">
              <rect x="163" y="94" width="30" height="21" rx="8" />
              <rect x="207" y="94" width="30" height="21" rx="8" />
              <path d="M193 102 Q200 98 207 102" />
              <path d="M163 100 L 156 98 M237 100 L 244 98" />
            </g>
          )}

          {/* burun */}
          <path d="M202 108 C 200 118, 196 124, 198 128 C 202 130, 206 129, 208 127" stroke={skinShadow} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {/* yonoqlar */}
          <ellipse cx="170" cy="126" rx="10" ry="6" fill="#e9877f" opacity={female ? 0.22 : 0.12} />
          <ellipse cx="230" cy="126" rx="10" ry="6" fill="#e9877f" opacity={female ? 0.22 : 0.12} />

          {/* og'iz */}
          {speaking ? (
            <g>
              <path d={`M188 139 Q200 ${136 - mouth} 212 139 Q200 ${146 + mouth * 9} 188 139 Z`} fill="#5e2423" />
              <path d={`M191 139 Q200 ${137.5 - mouth} 209 139 L208 141 Q200 140 192 141 Z`} fill="#fff" opacity={mouth > 0.25 ? 0.9 : 0} />
              <ellipse cx="200" cy={143 + mouth * 4} rx={5} ry={1.2 + mouth * 1.6} fill="#c25b5d" opacity={mouth > 0.35 ? 0.85 : 0} />
            </g>
          ) : (
            <g>
              <path d="M189 139 Q200 146 211 139" stroke={female ? "#b35458" : "#8a4a3e"} strokeWidth="3.2" fill="none" strokeLinecap="round" />
              {female && <path d="M192 141 Q200 145 208 141" stroke="#c96a6d" strokeWidth="2" fill="none" opacity="0.6" />}
            </g>
          )}
        </g>

        {/* qo'llar */}
        <Arm side="L" ang={arms.L} look={look} longSleeve={longSleeve} shirt={shirt} />
        <Arm side="R" ang={arms.R} look={look} longSleeve={longSleeve} shirt={shirt} />

        {arms.prop === "clipboard" && (
          <g transform="translate(150 360) rotate(-8)">
            <rect x="0" y="0" width="96" height="126" rx="8" fill="#7e6037" />
            <rect x="8" y="12" width="80" height="106" rx="3" fill="#fff" />
            <rect x="32" y="-6" width="32" height="14" rx="4" fill="#9aa7b0" />
            {[30, 46, 62, 78, 94].map((y, i) => (
              <rect key={y} x="16" y={y} width={i % 2 ? 40 : 60} height="5" rx="2" fill="#c9d5dc" />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
