import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock, FileQuestion, Layers } from "lucide-react";
import { LOCALES, isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { READY_MODULES, getModule, toPublicModule } from "@/content/catalog";
import { PERSONAS } from "@/content/personas";
import { moduleStats, protocolUrl } from "@/content/types";
import { Avatar } from "@/components/Avatar";
import { LessonList } from "@/components/LessonList";
import { ModuleVideo } from "@/components/ModuleVideo";
import { Code, Meta, PageHeader, SectionTitle } from "@/components/kit";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => READY_MODULES.map((m) => ({ lang, slug: m.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/modul/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const m = getModule(slug);
  return isLocale(lang) && m ? { title: t(m.title, lang) } : {};
}

export default async function ModulePage({ params }: PageProps<"/[lang]/modul/[slug]">) {
  const { lang, slug } = await params;
  const m = getModule(slug);
  if (!isLocale(lang) || !m || m.status !== "ready") notFound();
  const st = moduleStats(m);
  const lead = PERSONAS[m.lead];

  const sources = [
    { label: t(UI.protocol, lang), id: m.protocolId },
    ...(m.standardId ? [{ label: t(UI.standard, lang), id: m.standardId }] : []),
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}/kurs`, label: t(UI.navCourses, lang) }]}
        title={t(m.title, lang)}
        lead={t(m.short, lang)}
        meta={
          <>
            <Meta icon={<Layers />}>
              {st.lessons} {t(UI.lessonsN, lang)}
            </Meta>
            <Meta icon={<Clock />}>
              ~{st.minutes} {t(UI.minutesN, lang)}
            </Meta>
            <Meta icon={<FileQuestion />}>
              {st.questions} {t(UI.questionsN, lang)}
            </Meta>
            <span className="text-muted">
              {t(UI.icd, lang)}: <Code>{m.icd}</Code>
            </span>
          </>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="plan-h">
            <SectionTitle id="plan-h" title={t(UI.syllabus, lang)} />
            <LessonList m={toPublicModule(m)} lang={lang} />
          </section>
          <section id="video" className="scroll-mt-20">
            <ModuleVideo slug={m.slug} lang={lang} />
          </section>
        </div>

        {/* manbalar va ustoz */}
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div>
            <h2 className="text-[0.8rem] font-semibold uppercase tracking-wider text-muted">{t(UI.sourceDocs, lang)}</h2>
            <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-surface">
              {sources.map((s) => (
                <li key={s.id}>
                  <a
                    href={protocolUrl(s.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 px-4 py-3 text-[0.9rem] hover:bg-surface-2"
                  >
                    <span>
                      <span className="block font-medium text-ink group-hover:text-primary-strong">{s.label}</span>
                      <span className="text-[0.78rem] text-muted">
                        <span className="font-mono">№{s.id}</span> · clinical-protocols.uz
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted group-hover:text-primary" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-3 border-t border-line pt-5">
            <Avatar id={m.lead} size={44} />
            <div className="text-[0.85rem] leading-tight">
              <p className="text-muted">{t(UI.leadBy, lang)}</p>
              <p className="mt-0.5 font-semibold text-ink">{t(lead.name, lang)}</p>
              <p className="text-[0.78rem] text-muted">{t(lead.role, lang)}</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
