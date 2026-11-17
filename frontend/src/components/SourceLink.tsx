import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { ArrowUpRight, FileText } from "lucide-react";
import { sourcePdfUrl, type Source } from "@/content/types";

/** Bo'lim nomi: raqamli bo'lim "2.10-bo'lim" / "раздел 2.10", nomli bo'lim «Первичная оценка». */
export function sectionLabel(section: string, lang: Locale) {
  if (!/^\d/.test(section)) return `«${section}»`;
  return lang === "ru" ? `${t(UI.section, lang)} ${section}` : `${section}-${t(UI.section, lang)}`;
}

/** Protokoldagi aniq joyga havola: "Manba: Protokol №795 · 2.10-bo'lim · 15-bet ↗" */
export function SourceLink({ source, lang, compact = false }: { source: Source; lang: Locale; compact?: boolean }) {
  const sectionText = sectionLabel(source.section, lang);
  const pageText = lang === "ru" ? `${t(UI.page, lang)} ${source.page}` : `${source.page}-${t(UI.page, lang)}`;
  return (
    <a
      href={sourcePdfUrl(source)}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary ${compact ? "text-[0.75rem]" : "text-[0.8rem]"}`}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="font-semibold">{t(UI.source, lang)}:</span>
      <span>
        {lang === "ru" ? "Протокол" : t({ uz: "Protokol", ru: "" }, lang)} №{source.protocolId} · {sectionText} · {pageText}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden="true" />
    </a>
  );
}
