// Bitta uzun ovoz faylini sahnalar bo'yicha bo'laklarga ajratish (jumlalar orasidagi jimlik bo'yicha).
//
//   node scripts/voice-split.mjs <audio> <slug> <lang> <sahna raqamlari>
//
//   # Malika opaning barcha jumlalari bitta faylda, tartib bilan:
//   node scripts/voice-split.mjs ~/Downloads/malika.mp3 partogramma uz 2,5,6,7,10,13
//   # Hamma jumlalar bitta faylda:
//   node scripts/voice-split.mjs ~/Downloads/hammasi.mp3 partogramma uz 1-13
//
// Jumlalar orasida ~1 soniya jimlik bo'lishi kerak (ElevenLabs: <break time="1.5s" />).
// Natija: public/voice/<slug>/<lang>/02.mp3, 05.mp3, … — keyin render skripti ularni o'zi ishlatadi.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [src, slug, lang, spec] = process.argv.slice(2);
if (!src || !slug || !lang || !spec) {
  console.error("foydalanish: node scripts/voice-split.mjs <audio> <slug> <lang> <2,5,6 | 1-13>");
  process.exit(1);
}

const beats = spec.split(",").flatMap((p) => {
  const [a, b] = p.split("-").map(Number);
  return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
});

const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).toString());

/** ffmpeg silencedetect natijasidan jimlik oraliqlari [boshi, oxiri] */
function parse(log) {
  const list = [];
  let start = null;
  for (const line of log.split("\n")) {
    const s = line.match(/silence_start: ([\d.]+)/);
    const e = line.match(/silence_end: ([\d.]+)/);
    if (s) start = Number(s[1]);
    if (e && start !== null) {
      list.push([Math.max(0, start), Number(e[1])]);
      start = null;
    }
  }
  if (start !== null) list.push([start, duration]);
  return list;
}

// ffmpeg jimlik haqidagi xabarni stderr ga yozadi
function detect(noiseDb, minDur) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", src, "-af", `silencedetect=noise=${noiseDb}dB:d=${minDur}`, "-f", "null", "-"], { encoding: "utf8" });
  return parse(r.stderr);
}

// Ichki jimliklar (boshi va oxiridagidan tashqari): eng uzunlari — jumlalar orasidagi chegaralar
let all = detect(-35, 0.35);
const lead = all.find((s) => s[0] <= 0.05);
const tail = all.find((s) => s[1] >= duration - 0.05);
let inner = all.filter((s) => s !== lead && s !== tail);
if (inner.length < beats.length - 1) {
  all = detect(-30, 0.25); // sezgirroq qidiruv
  inner = all.filter((s) => s[0] > 0.05 && s[1] < duration - 0.05);
}
if (inner.length < beats.length - 1) {
  console.error(`Jumlalar orasida yetarli jimlik topilmadi: kerak ${beats.length - 1}, topildi ${inner.length}.`);
  console.error("Jumlalar orasiga ~1 soniya pauza qo'yib qayta yarating.");
  process.exit(1);
}
const cuts = [...inner]
  .sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
  .slice(0, beats.length - 1)
  .sort((a, b) => a[0] - b[0]);

const speechStart = lead ? lead[1] : 0;
const speechEnd = tail ? tail[0] : duration;
const outDir = join(ROOT, "public", "voice", slug, lang);
mkdirSync(outDir, { recursive: true });

beats.forEach((n, i) => {
  const from = Math.max(0, (i === 0 ? speechStart : cuts[i - 1][1]) - 0.08);
  const to = Math.min(duration, (i === beats.length - 1 ? speechEnd : cuts[i][0]) + 0.15);
  const file = join(outDir, `${String(n).padStart(2, "0")}.mp3`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-ss", from.toFixed(3), "-to", to.toFixed(3), "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-q:a", "2", file]);
  console.log(`${String(n).padStart(2, "0")}.mp3  ${from.toFixed(2)}–${to.toFixed(2)} s  (${(to - from).toFixed(1)} s)`);
});
console.log(`tayyor: ${outDir}`);
