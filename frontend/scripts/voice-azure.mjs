// Video ovozini Microsoft Azure TTS bilan yaratish: har sahna → public/voice/<slug>/<lang>/NN.mp3
//
//   node scripts/voice-azure.mjs partogramma uz              # barcha sahnalar
//   node scripts/voice-azure.mjs partogramma uz --only 7,9   # faqat shu sahnalar (qayta yaratish)
//   node scripts/voice-azure.mjs partogramma uz --dry        # Azure'ga yubormasdan SSML ni ko'rsatish
//   node scripts/voice-azure.mjs partogramma uz --edge       # SINOV: kalitsiz, edge-tts orqali (norasmiy; yakuniy video uchun emas)
//                                                            #   o'rnatish: python3 -m venv ../tools/tts/.venv && ../tools/tts/.venv/bin/pip install edge-tts
//
// Kalit: loyiha ildizidagi .env.tools faylida (git'ga tushmaydi):
//   AZURE_SPEECH_KEY=...
//   AZURE_SPEECH_REGION=westeurope
// Dev server ishlab turishi kerak (matn /studio-voice/... dan olinadi).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVoiceManifest } from "./voice-manifest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.STUDIO_URL ?? "http://localhost:3100";

// Personaj → ovoz. O'zbekchada Azure'da ikki ovoz bor: Madina (ayol) va Sardor (erkak).
// Ayol personajlar bir ovozda bo'lgani uchun balandlik va tezlik bilan farqlanadi.
const VOICES = {
  uz: {
    female: "uz-UZ-MadinaNeural",
    male: "uz-UZ-SardorNeural",
  },
  ru: {
    female: "ru-RU-SvetlanaNeural",
    male: "ru-RU-DmitryNeural",
  },
};
const CAST = {
  malika: { voice: "female", pitch: "+0%", rate: "-4%" }, // katta akusherka — iliq, xotirjam
  dilnoza: { voice: "female", pitch: "-7%", rate: "-8%" }, // bo'lim mudiri — pastroq, vazmin
  nigora: { voice: "female", pitch: "+8%", rate: "+2%" }, // yosh bemor — balandroq
  jasur: { voice: "male", pitch: "+0%", rate: "-4%" },
  bekzod: { voice: "male", pitch: "-6%", rate: "-6%" },
  sardor: { voice: "male", pitch: "+4%", rate: "+0%" },
};

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const [slug, lang] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--only"));
const dry = args.includes("--dry");
const edge = args.includes("--edge");
const EDGE_BIN = join(ROOT, "..", "tools", "tts", ".venv", "bin", "edge-tts");
const only = flag("--only")?.split(",").map(Number);
if (!slug || !lang || !VOICES[lang]) {
  console.error("foydalanish: node scripts/voice-azure.mjs <slug> <uz|ru> [--only 3,7] [--dry]");
  process.exit(1);
}

function env() {
  const out = { key: process.env.AZURE_SPEECH_KEY, region: process.env.AZURE_SPEECH_REGION };
  const file = join(ROOT, "..", ".env.tools");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*(AZURE_SPEECH_KEY|AZURE_SPEECH_REGION)\s*=\s*"?([^"\s]+)"?/);
      if (m && m[1] === "AZURE_SPEECH_KEY") out.key ??= m[2];
      if (m && m[1] === "AZURE_SPEECH_REGION") out.region ??= m[2];
    }
  }
  return out;
}

/**
 * Sintezator uchun matn: o' va g' — rasmiy oʻ/gʻ belgisi (U+02BB), boshqa apostroflar — tutuq belgisi ʼ (U+02BC).
 * Oddiy ' ni sintezator pauza deb o'qiydi; ʻ bilan o' va g' aniqroq chiqadi (tinglab tanlangan).
 */
function speakable(text) {
  return text
    .replace(/…/g, "...")
    .replace(/([OoGg])['‘’`ʼʻ]/g, "$1\u02BB")
    .replace(/['‘’`ʼ]/g, "\u02BC");
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xmlLang = { uz: "uz-UZ", ru: "ru-RU" }[lang];

function ssml(text, speaker) {
  const c = CAST[speaker] ?? CAST.malika;
  const voice = VOICES[lang][c.voice];
  const body = esc(speakable(text));
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}"><voice name="${voice}"><prosody rate="${c.rate}" pitch="${c.pitch}">${body}</prosody></voice></speak>`;
}

const lines = await fetch(`${BASE}/studio-voice/${slug}/${lang}?format=json`).then((r) => {
  if (!r.ok) throw new Error(`matn olinmadi (${r.status}) — dev server ishlayaptimi?`);
  return r.json();
});

const { key, region } = env();
if (edge && !existsSync(EDGE_BIN)) {
  console.error(`edge-tts topilmadi: ${EDGE_BIN}`);
  process.exit(1);
}
if (!dry && !edge && (!key || !region)) {
  console.error("Azure kaliti topilmadi. Loyiha ildizidagi .env.tools fayliga AZURE_SPEECH_KEY va AZURE_SPEECH_REGION yozing.");
  process.exit(1);
}

const outDir = join(ROOT, "public", "voice", slug, lang);
if (!dry) mkdirSync(outDir, { recursive: true });

for (const { n, speaker, text } of lines) {
  if (only && !only.includes(n)) continue;
  const body = ssml(text, speaker);
  const name = `${String(n).padStart(2, "0")}.mp3`;
  if (dry) {
    console.log(`${name}  ${body}\n`);
    continue;
  }
  if (edge) {
    // edge-tts balandlikni Hz da oladi: Madina ~200 Hz → 1% ≈ 2 Hz
    const c = CAST[speaker] ?? CAST.malika;
    const hz = `${c.pitch.startsWith("-") ? "-" : "+"}${Math.round(Math.abs(parseFloat(c.pitch)) * 2)}Hz`;
    const clean = speakable(text);
    execFileSync(EDGE_BIN, ["--voice", VOICES[lang][c.voice], `--rate=${c.rate}`, `--pitch=${hz}`, "--text", clean, "--write-media", join(outDir, name)], {
      stdio: ["ignore", "ignore", "inherit"],
    });
    console.log(`${name}  ${speaker ?? "—"}  ${text.slice(0, 60)}…`);
    continue;
  }
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-48khz-192kbitrate-mono-mp3",
      "User-Agent": "video-voice-script",
    },
    body,
  });
  if (!res.ok) {
    console.error(`${name}: Azure xatosi ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  writeFileSync(join(outDir, name), Buffer.from(await res.arrayBuffer()));
  console.log(`${name}  ${speaker ?? "—"}  ${text.slice(0, 60)}…`);
}

if (!dry) {
  const m = buildVoiceManifest(slug, lang);
  if (lang === "uz") buildVoiceManifest(slug, "oz");
  console.log(`tayyor: ${m?.files.filter(Boolean).length ?? 0} ta ovoz → ${outDir}`);
}
