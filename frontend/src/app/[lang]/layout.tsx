import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { LOCALES, LOCALE_LABEL, isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { AppShell } from "@/components/AppShell";

const plex = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["500"], variable: "--font-plex-mono", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: { default: t(UI.brand, lang), template: `%s · ${t(UI.brand, lang)}` }, description: t(UI.brandSub, lang) };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={LOCALE_LABEL[lang].htmlLang} className={`${plex.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh">
        <AppShell lang={lang}>{children}</AppShell>
      </body>
    </html>
  );
}
