import { isLocale, t } from "@/lib/i18n";
import { PERSONAS } from "@/content/personas";
import { VIDEOS } from "@/video/scripts";

// Ovoz yozish uchun matn: har sahna raqami, gapiruvchi va o'qiladigan jumla (ElevenLabs uchun).
// Tayyor fayllar: public/voice/<slug>/<lang>/01.mp3, 02.mp3, …
export async function GET(req: Request, ctx: RouteContext<"/studio-voice/[slug]/[lang]">) {
  const { slug, lang } = await ctx.params;
  const script = VIDEOS[slug];
  if (!script || !isLocale(lang)) return new Response("not found", { status: 404 });
  // ?format=json — ovoz yaratish skriptlari uchun (scripts/voice-azure.mjs)
  if (new URL(req.url).searchParams.get("format") === "json") {
    return Response.json(script.beats.map((b, i) => ({ n: i + 1, speaker: b.speaker ?? null, text: t(b.say ?? b.line, lang) })));
  }
  const rows = script.beats.map((b, i) => {
    const n = String(i + 1).padStart(2, "0");
    const who = b.speaker ? `${t(PERSONAS[b.speaker].name, lang)} (${t(PERSONAS[b.speaker].role, lang)})` : "—";
    return `${n}.mp3 | ${who}\n${t(b.say ?? b.line, lang)}`;
  });
  return new Response(`${t(script.title, lang)} — ${lang}\n\n${rows.join("\n\n")}\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
