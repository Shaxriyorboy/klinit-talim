import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isLocale } from "@/lib/i18n";
import { VIDEOS } from "@/video/scripts";
import { toVtt, type Voice } from "@/video/timeline";

// Video subtitrlari (WebVTT). Ovoz yozilgan bo'lsa, vaqtlar ovozga moslanadi. Render skripti ularni public/videos ga saqlaydi.
export async function GET(_req: Request, ctx: RouteContext<"/studio-vtt/[slug]/[lang]">) {
  const { slug, lang } = await ctx.params;
  const script = VIDEOS[slug];
  if (!script || !isLocale(lang)) return new Response("not found", { status: 404 });
  let voice: Voice | null = null;
  try {
    const m = JSON.parse(await readFile(join(process.cwd(), "public", "voice", slug, lang, "manifest.json"), "utf8"));
    voice = m.durations;
  } catch {
    voice = null;
  }
  return new Response(toVtt(script, lang, voice), { headers: { "content-type": "text/vtt; charset=utf-8" } });
}
