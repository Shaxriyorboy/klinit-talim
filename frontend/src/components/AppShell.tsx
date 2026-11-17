"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, FileText, LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import { LOCALES, LOCALE_LABEL, t, type L, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { levelOf, logout, useSession } from "@/lib/progress";
import { PROTOCOL_BASE } from "@/content/types";
import { Logo } from "./Logo";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

type NavItem = { href: string; label: L; Icon: LucideIcon; active: boolean };

/**
 * Platforma qobig'i: chapda doimiy menyu (desktop), mobil qurilmada — yuqori panel va chiqib keladigan menyu.
 * Kirish sahifasi menyusiz, to'liq ekranda ko'rsatiladi.
 */
export function AppShell({ lang, children }: { lang: Locale; children: ReactNode }) {
  const pathname = usePathname() ?? `/${lang}`;
  const rest = pathname.replace(/^\/(uz|oz|ru)(?=\/|$)/, "");
  // Mobil menyu qaysi sahifada ochilgan bo'lsa, faqat o'sha sahifada ochiq turadi (o'tishda o'zi yopiladi)
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);

  if (rest.startsWith("/kirish")) return <main className="min-h-dvh">{children}</main>;

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* desktop: chap menyu */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:flex">
        <Sidebar lang={lang} rest={rest} />
      </aside>

      {/* mobil: yuqori panel */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t(UI.menu, lang)}
          className="-ml-2 grid h-10 w-10 place-items-center rounded-md text-ink-2 hover:bg-surface-2"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={`/${lang}`} className="flex min-w-0 items-center gap-2.5">
          <Logo className="h-8 w-8 shrink-0" />
          <span className="truncate text-[0.95rem] font-semibold text-ink">{t(UI.brand, lang)}</span>
        </Link>
      </div>

      {/* mobil: chiqib keladigan menyu */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="×" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] bg-surface shadow-xl anim-rise">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="×"
              className="absolute right-2 top-3 z-10 grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-2"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar lang={lang} rest={rest} />
          </div>
        </div>
      )}

      <main className="min-w-0">{children}</main>
      <footer className="border-t border-line px-6 py-5 text-[0.8rem] text-muted">
        {t(UI.footerSource, lang)}:{" "}
        <a href={PROTOCOL_BASE} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">
          clinical-protocols.uz
        </a>
      </footer>
    </div>
  );
}

function Sidebar({ lang, rest }: { lang: Locale; rest: string }) {
  const router = useRouter();
  const session = useSession();
  const { user, progress } = session;
  const { level } = levelOf(progress.xp);
  const isInspector = user?.role === "inspector" || user?.role === "admin";

  const nav: NavItem[] = [
    { href: `/${lang}`, label: UI.navHome, Icon: LayoutDashboard, active: rest === "" },
    { href: `/${lang}/kurs`, label: UI.navCourses, Icon: BookOpen, active: rest.startsWith("/kurs") || rest.startsWith("/modul") },
    { href: `/${lang}/natijalar`, label: UI.navResults, Icon: BarChart3, active: rest.startsWith("/natijalar") },
    ...(isInspector ? [{ href: `/${lang}/hisobot`, label: UI.navReport, Icon: FileText, active: rest.startsWith("/hisobot") }] : []),
  ];

  return (
    <div className="flex h-full w-full flex-col">
      <Link href={`/${lang}`} className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Logo className="h-9 w-9 shrink-0" />
        <span className="min-w-0 leading-tight">
          <span className="block text-[0.92rem] font-semibold text-ink">{t(UI.brand, lang)}</span>
          <span className="block text-[0.7rem] uppercase tracking-wider text-muted">{t(UI.brandShort, lang)}</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={t(UI.menu, lang)}>
        {nav.map(({ href, label, Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.92rem] font-medium transition-colors ${
              active ? "bg-primary text-primary-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {t(label, lang)}
          </Link>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        {/* til */}
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1" role="group" aria-label={t(UI.language, lang)}>
          {LOCALES.map((l) => (
            <Link
              key={l}
              href={`/${l}${rest}`}
              lang={LOCALE_LABEL[l].htmlLang}
              title={LOCALE_LABEL[l].long}
              aria-current={l === lang ? "true" : undefined}
              className={`rounded px-2 py-1 text-center text-[0.8rem] font-semibold ${
                l === lang ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {LOCALE_LABEL[l].short}
            </Link>
          ))}
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Link href={`/${lang}/natijalar`} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1.5 hover:bg-surface-2" title={user.full_name}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[0.78rem] font-semibold text-primary-strong">
                {initials(user.full_name)}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[0.85rem] font-medium text-ink">{user.full_name}</span>
                <span className="block truncate text-[0.72rem] text-muted">
                  {t(UI.levels[level], lang)} · <span className="tabular-nums">{progress.xp}</span> {t(UI.xp, lang)}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push(`/${lang}/kirish`);
              }}
              title={t(UI.logout, lang)}
              aria-label={t(UI.logout, lang)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : (
          <Link
            href={`/${lang}/kirish`}
            className={`flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-[0.9rem] font-semibold text-primary-ink hover:bg-primary-strong ${
              session.status === "loading" ? "invisible" : ""
            }`}
          >
            <LogIn className="h-4 w-4" />
            {t(UI.login, lang)}
          </Link>
        )}
      </div>
    </div>
  );
}
