import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { READY_MODULES, getModule, toPublicLesson, toPublicModule } from "@/content/catalog";
import { LessonPlayer } from "@/components/LessonPlayer";
import { PageHeader } from "@/components/kit";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => READY_MODULES.flatMap((m) => m.lessons.map((l) => ({ lang, slug: m.slug, lesson: l.slug }))));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/modul/[slug]/dars/[lesson]">): Promise<Metadata> {
  const { lang, slug, lesson } = await params;
  const l = getModule(slug)?.lessons.find((x) => x.slug === lesson);
  return isLocale(lang) && l ? { title: t(l.title, lang) } : {};
}

export default async function LessonPage({ params }: PageProps<"/[lang]/modul/[slug]/dars/[lesson]">) {
  const { lang, slug, lesson: lessonSlug } = await params;
  const m = getModule(slug);
  const lesson = m?.lessons.find((l) => l.slug === lessonSlug);
  if (!isLocale(lang) || !m || !lesson) notFound();
  const n = m.lessons.indexOf(lesson) + 1;

  return (
    <>
      <PageHeader
        narrow
        crumbs={[
          { href: `/${lang}/kurs`, label: t(UI.navCourses, lang) },
          { href: `/${lang}/modul/${m.slug}`, label: t(m.title, lang) },
        ]}
        eyebrow={
          <>
            {n}-{t({ uz: "dars", ru: "урок" }, lang)} / {m.lessons.length} · {lesson.minutes} {t(UI.minutesN, lang)}
          </>
        }
        title={t(lesson.title, lang)}
        lead={t(lesson.summary, lang)}
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <LessonPlayer m={toPublicModule(m)} lesson={toPublicLesson(lesson)} lang={lang} />
      </div>
    </>
  );
}
