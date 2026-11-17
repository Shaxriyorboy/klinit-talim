import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { InspectorReport } from "@/components/InspectorReport";
import { PageHeader } from "@/components/kit";

export async function generateMetadata({ params }: PageProps<"/[lang]/hisobot">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: t(UI.reportTitle, lang) } : {};
}

export default async function ReportPage({ params }: PageProps<"/[lang]/hisobot">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <PageHeader title={t(UI.reportTitle, lang)} lead={t(UI.reportText, lang)} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <InspectorReport lang={lang} />
      </div>
    </>
  );
}
