import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { Results } from "@/components/Results";
import { READY_MODULES, toPublicModule } from "@/content/catalog";
import { PageHeader } from "@/components/kit";

export async function generateMetadata({ params }: PageProps<"/[lang]/natijalar">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: t(UI.resultsTitle, lang) } : {};
}

export default async function ResultsPage({ params }: PageProps<"/[lang]/natijalar">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <PageHeader title={t(UI.resultsTitle, lang)} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Results lang={lang} modules={READY_MODULES.map(toPublicModule)} />
      </div>
    </>
  );
}
