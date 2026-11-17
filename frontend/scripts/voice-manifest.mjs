// Ovoz fayllari manifesti: public/voice/<slug>/<lang>/NN.mp3 → manifest.json (har sahna uchun davomiylik).
//
//   node scripts/voice-manifest.mjs partogramma uz
//
// Fayl nomi — sahna raqami: 01.mp3, 02.mp3, … (mp3 / wav / m4a). Yo'q raqamli sahna ovozsiz qoladi.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO = /^(\d{1,3})\.(mp3|wav|m4a)$/i;
const hasAudio = (dir) => existsSync(dir) && readdirSync(dir).some((n) => AUDIO.test(n));

export function buildVoiceManifest(slug, lang) {
  const dir = join(ROOT, "public", "voice", slug, lang);
  // o'zbek kirill (oz) videosi o'zbek lotin (uz) ovozini ishlatadi — o'qilishi bir xil
  if (lang === "oz" && !hasAudio(dir)) {
    const uz = buildVoiceManifest(slug, "uz");
    if (!uz) return null;
    mkdirSync(dir, { recursive: true });
    const m = { files: uz.files.map((f) => (f ? `../uz/${f}` : null)), durations: uz.durations };
    writeFileSync(join(dir, "manifest.json"), JSON.stringify(m, null, 2) + "\n");
    return m;
  }
  if (!existsSync(dir)) return null;
  const files = [];
  const durations = [];
  for (const name of readdirSync(dir).sort()) {
    const m = name.match(AUDIO);
    if (!m) continue;
    const i = Number(m[1]) - 1;
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(dir, name)]).toString();
    files[i] = name;
    durations[i] = Math.round(Number(out) * 1000) / 1000;
  }
  if (!files.length) return null;
  const manifest = { files: Array.from(files, (f) => f ?? null), durations: Array.from(durations, (d) => d ?? null) };
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [slug, lang] = process.argv.slice(2);
  if (!slug || !lang) {
    console.error("foydalanish: node scripts/voice-manifest.mjs <slug> <lang>");
    process.exit(1);
  }
  const m = buildVoiceManifest(slug, lang);
  if (!m) console.log(`ovoz topilmadi: public/voice/${slug}/${lang}/`);
  else m.files.forEach((f, i) => console.log(`${String(i + 1).padStart(2, "0")}  ${f ?? "— (ovozsiz)"}  ${m.durations[i] ?? ""}`));
}
