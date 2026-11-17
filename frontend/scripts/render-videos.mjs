// Videolarni kadrma-kadr render qilish: Chrome (playwright-core) → JPEG kadrlar → ffmpeg (H.264 MP4).
//
//   node scripts/render-videos.mjs                      # hammasi (3 mavzu × 3 til)
//   node scripts/render-videos.mjs partogramma uz       # bittasi
//   node scripts/render-videos.mjs partogramma uz --stills 10,30,60 --out /tmp/x   # tekshirish uchun PNG kadrlar
//
// Talab: dev server ishlab turgan bo'lishi kerak (STUDIO_URL, standart http://localhost:3100).
import { spawn } from "node:child_process";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { buildVoiceManifest } from "./voice-manifest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.STUDIO_URL ?? "http://localhost:3100";
const FPS = 30;
const SLUGS = ["partogramma", "chaqaloq-reanimatsiyasi", "tugruqdan-keyingi-davr"];
const LANGS = ["uz", "oz", "ru"];

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const slugs = positional[0] ? [positional[0]] : SLUGS;
const langs = positional[1] ? [positional[1]] : LANGS;
const stills = flag("--stills");
const outDir = flag("--out") ?? join(ROOT, "public", "videos");
const parallel = Number(flag("--parallel") ?? 3);

async function openPage(browser, slug, lang) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/studio/${slug}/${lang}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.__ready === true && typeof window.__seek === "function", null, { timeout: 60000 });
  return page;
}

async function renderOne(browser, slug, lang) {
  // ovoz bo'lsa — manifest yangilanadi, sahnalar ovoz uzunligiga moslanadi
  if (buildVoiceManifest(slug, lang)) console.log(`ovoz: public/voice/${slug}/${lang}/`);
  const page = await openPage(browser, slug, lang);
  mkdirSync(outDir, { recursive: true });

  if (stills) {
    for (const s of stills.split(",").map(Number)) {
      await page.evaluate((t) => window.__seek(t), s);
      await page.screenshot({ path: join(outDir, `${slug}.${lang}.${String(s).padStart(5, "0")}.png`) });
    }
    await page.close();
    console.log(`kadrlar: ${slug}.${lang} → ${outDir}`);
    return;
  }

  const duration = await page.evaluate(() => window.__duration);
  const frames = Math.ceil(duration * FPS);
  const file = join(outDir, `${slug}.${lang}.mp4`);
  const ff = spawn(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
     "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.__seek(t), f / FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 300 === 0) console.log(`${slug}.${lang}: ${f}/${frames} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));

  // ovozni qo'shish: har bir yozuv o'z sahnasi vaqtida, umumiy balandlik −16 LUFS ga keltiriladi
  const clips = await page.evaluate(() => window.__voice ?? []);
  if (clips.length) {
    const tmp = file.replace(/\.mp4$/, ".silent.mp4");
    renameSync(file, tmp);
    const inputs = clips.flatMap((c) => ["-i", join(ROOT, "public", decodeURI(c.src))]);
    const delays = clips.map((c, i) => `[${i + 1}:a]aresample=48000,adelay=${Math.round(c.at * 1000)}:all=1[a${i}]`);
    const mix = `${clips.map((_, i) => `[a${i}]`).join("")}amix=inputs=${clips.length}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad[aout]`;
    await new Promise((res, rej) => {
      const p = spawn(
        "ffmpeg",
        ["-y", "-loglevel", "error", "-i", tmp, ...inputs, "-filter_complex", [...delays, mix].join(";"),
         "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-t", String(duration), "-movflags", "+faststart", file],
        { stdio: "inherit" },
      );
      p.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg audio ${c}`))));
    });
    rmSync(tmp);
    console.log(`${slug}.${lang}: ${clips.length} ta ovoz qo'shildi`);
  }

  // subtitr (VTT) — ovoz qo'shilganda shu vaqtlar ishlatiladi
  const vtt = await page.evaluate(async () => (await fetch(location.pathname.replace("/studio/", "/studio-vtt/"))).text()).catch(() => null);
  if (vtt && vtt.startsWith("WEBVTT")) writeFileSync(join(outDir, `${slug}.${lang}.vtt`), vtt);
  await page.close();
  console.log(`tayyor: ${file} (${duration.toFixed(1)} s, ${Math.round((Date.now() - t0) / 1000)} s render)`);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const jobs = slugs.flatMap((s) => langs.map((l) => [s, l]));
let next = 0;
await Promise.all(
  Array.from({ length: Math.min(parallel, jobs.length) }, async () => {
    while (next < jobs.length) {
      const [s, l] = jobs[next++];
      await renderOne(browser, s, l);
    }
  }),
);
await browser.close();
