import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { DIRECTION, MODULES, SECTIONS, toPublicModule } from "@/content/catalog";
import { PERSONAS } from "@/content/personas";
import { Avatar } from "@/components/Avatar";
import { ModuleCard } from "@/components/ModuleCard";
import { PageHeader } from "@/components/kit";

export async function generateMetadata({ params }: PageProps<"/[lang]/kurs">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: t(UI.navCourses, lang) } : {};
}

export default async function Kurs({ params }: PageProps<"/[lang]/kurs">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const groups = SECTIONS.map((s) => ({
    s,
    mods: MODULES.filter((m) => m.section === s.id).sort((a, b) => Number(a.status !== "ready") - Number(b.status !== "ready")),
  }));

  return (
    <>
      <PageHeader eyebrow={t(UI.coursesTitle, lang)} title={t(DIRECTION.title, lang)} lead={t(DIRECTION.subtitle, lang)} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 xl:grid-cols-[220px_1fr]">
        {/* bo'limlar bo'yicha navigatsiya — bemor yo'li */}
        <nav aria-label={t(UI.coursesTitle, lang)} className="hidden xl:block">
          <ol className="sticky top-6 border-l border-line">
            {groups.map(({ s, mods }, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-2 pl-4 hover:border-primary hover:text-primary-strong">
                  <span className="block font-mono text-[0.7rem] text-muted">0{i + 1}</span>
                  <span className="block text-[0.92rem] font-medium text-ink">{t(s.title, lang)}</span>
                  <span className="block text-[0.75rem] text-muted">
                    {mods.filter((m) => m.status === "ready").length} / {mods.length} {t(UI.modulesReady, lang)}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-12">
          {groups.map(({ s, mods }, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-20">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[0.72rem] text-muted">
                    0{i + 1} / 0{SECTIONS.length}
                  </p>
                  <h2 id={`${s.id}-h`} className="text-[1.35rem] font-bold text-ink">
                    {t(s.title, lang)}
                  </h2>
                </div>
                <p className="flex items-center gap-2 text-[0.8rem] text-muted">
                  <Avatar id={s.persona} size={28} />
                  <span>
                    {t(UI.leadBy, lang)}: <span className="text-ink-2">{t(PERSONAS[s.persona].name, lang)}</span>
                  </span>
                </p>
              </div>
              <ul className="divide-y divide-line rounded-md border border-line bg-surface">
                {mods.map((m) => (
                  <li key={m.slug}>
                    <ModuleCard m={toPublicModule(m)} lang={lang} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
