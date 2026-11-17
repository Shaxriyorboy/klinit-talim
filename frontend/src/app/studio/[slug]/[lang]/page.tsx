import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/i18n";
import { VIDEOS } from "@/video/scripts";
import { StudioPlayer } from "@/video/StudioPlayer";

export function generateStaticParams() {
  return Object.keys(VIDEOS).flatMap((slug) => LOCALES.map((lang) => ({ slug, lang })));
}

export default async function StudioPage({ params }: PageProps<"/studio/[slug]/[lang]">) {
  const { slug, lang } = await params;
  if (!isLocale(lang) || !VIDEOS[slug]) notFound();
  return <StudioPlayer slug={slug} lang={lang} />;
}
