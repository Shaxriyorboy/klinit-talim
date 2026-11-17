import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { READY_MODULES, getModule, toPublicModule } from "@/content/catalog";
import { FinalTest } from "@/components/FinalTest";
import { PageHeader } from "@/components/kit";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => READY_MODULES.map((m) => ({ lang, slug: m.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/modul/[slug]/test">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: t(UI.finalTest, lang) } : {};
}

export default async function TestPage({ params }: PageProps<"/[lang]/modul/[slug]/test">) {
  const { lang, slug } = await params;
  const m = getModule(slug);
  if (!isLocale(lang) || !m || m.status !== "ready") notFound();
  return (
    <>
      <PageHeader
        narrow
        crumbs={[
          { href: `/${lang}/kurs`, label: t(UI.navCourses, lang) },
          { href: `/${lang}/modul/${m.slug}`, label: t(m.title, lang) },
        ]}
        title={t(UI.finalTest, lang)}
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <FinalTest m={toPublicModule(m)} lang={lang} />
      </div>
    </>
  );
}
