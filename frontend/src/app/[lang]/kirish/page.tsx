import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { AuthForm } from "@/components/AuthForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/kirish">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: t(UI.login, lang) } : {};
}

export default async function LoginPage({ params }: PageProps<"/[lang]/kirish">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <Suspense>
      <AuthForm lang={lang} />
    </Suspense>
  );
}
