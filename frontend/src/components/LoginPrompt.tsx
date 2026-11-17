"use client";

import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { ButtonLink, EmptyState } from "./kit";

export function LoginPrompt({ lang }: { lang: Locale }) {
  const pathname = usePathname() ?? `/${lang}`;
  return (
    <EmptyState
      icon={<LogIn />}
      title={t(UI.loginRequired, lang)}
      action={<ButtonLink href={`/${lang}/kirish?next=${encodeURIComponent(pathname)}`}>{t(UI.login, lang)}</ButtonLink>}
    >
      {t(UI.loginRequiredText, lang)}
    </EmptyState>
  );
}
