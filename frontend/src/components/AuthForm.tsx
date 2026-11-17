"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LOCALES, LOCALE_LABEL, t, type Locale } from "@/lib/i18n";
import { UI } from "@/lib/ui";
import { api, ApiError, type Institution, type User } from "@/lib/api";
import { refreshSession } from "@/lib/progress";
import { ShieldCheck } from "lucide-react";
import { Button } from "./kit";
import { Logo } from "./Logo";

type Mode = "login" | "register";

export function AuthForm({ lang }: { lang: Locale }) {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    phone: "",
    password: "",
    full_name: "",
    institution_id: "",
    department: "",
    position: "",
  });

  useEffect(() => {
    if (mode !== "register" || institutions.length) return;
    api<Institution[]>("/institutions")
      .then(setInstitutions)
      .catch(() => undefined);
  }, [mode, institutions.length]);

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body =
        mode === "login"
          ? { phone: f.phone, password: f.password }
          : {
              phone: f.phone,
              password: f.password,
              full_name: f.full_name,
              institution_id: f.institution_id
                ? Number(f.institution_id)
                : null,
              department: f.department,
              position: f.position,
            };
      const res = await api<{ user: User }>(`/auth/${mode}`, { body });
      await refreshSession();
      const next = params.get("next");
      const safeNext = next && next.startsWith(`/${lang}`) ? next : null;
      const home =
        res.user.role === "learner" ? `/${lang}/kurs` : `/${lang}/hisobot`;
      router.push(safeNext ?? home);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 0
          ? t(UI.serverDown, lang)
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  };

  const input =
    "mt-1.5 h-12 w-full rounded-md border border-line-strong bg-surface px-3.5 text-ink outline-none transition-shadow focus:border-ink focus:shadow-[0_0_0_3px_#f2b705]";
  const label = "block text-[0.9rem] font-semibold text-ink";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* chap: forma */}
      <div className="flex flex-col bg-surface px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/${lang}`} className="flex items-center gap-3">
            <Logo className="h-10 w-10 shrink-0" />
            <span className="leading-tight">
              <span className="block font-semibold text-ink">
                {t(UI.brand, lang)}
              </span>
              <span className="block text-[0.7rem] uppercase tracking-wider text-muted">
                {t(UI.brandShort, lang)}
              </span>
            </span>
          </Link>
          <nav
            className="flex gap-1 text-[0.8rem]"
            aria-label={t(UI.language, lang)}
          >
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={`/${l}/kirish`}
                aria-current={l === lang ? "true" : undefined}
                className={`rounded px-2 py-1 font-semibold ${l === lang ? "bg-primary-soft text-primary-strong" : "text-muted hover:text-ink"}`}
              >
                {LOCALE_LABEL[l].short}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-10">
          <h1 className="text-[1.8rem] font-bold leading-tight text-ink">
            {t(UI.loginTitle, lang)}
          </h1>
          <p className="mb-6 mt-2 text-[0.95rem] leading-relaxed text-ink-2">
            {t(UI.loginText, lang)}
          </p>

          <div className="rounded-md border border-line bg-surface">
            <div className="flex border-b border-line" role="tablist">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`relative flex-1 py-3.5 text-[0.92rem] font-semibold ${mode === m ? "text-ink" : "text-muted hover:text-ink"}`}
                >
                  {t(m === "login" ? UI.login : UI.register, lang)}
                  {mode === m && (
                    <span className="absolute inset-x-0 -bottom-px h-[3px] bg-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-6 sm:p-7">
              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <label className={label}>
                    {t(UI.fullName, lang)}
                    <input
                      className={input}
                      value={f.full_name}
                      onChange={set("full_name")}
                      required
                      minLength={3}
                      autoComplete="name"
                    />
                  </label>
                )}
                <label className={label}>
                  {t(UI.phone, lang)}
                  <input
                    className={input}
                    value={f.phone}
                    onChange={set("phone")}
                    required
                    inputMode="tel"
                    placeholder="+998 90 123 45 67"
                    autoComplete="tel"
                  />
                </label>
                <label className={label}>
                  {t(UI.password, lang)}
                  <input
                    className={input}
                    type="password"
                    value={f.password}
                    onChange={set("password")}
                    required
                    minLength={6}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  {mode === "register" && (
                    <span className="mt-1 block text-[0.78rem] font-normal text-muted">
                      {t(UI.passwordHint, lang)}
                    </span>
                  )}
                </label>
                {mode === "register" && (
                  <>
                    <label className={label}>
                      {t(UI.institution, lang)}
                      <select
                        className={input}
                        value={f.institution_id}
                        onChange={set("institution_id")}
                      >
                        <option value="">
                          {t(UI.chooseInstitution, lang)}
                        </option>
                        {institutions.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={label}>
                        {t(UI.department, lang)}
                        <input
                          className={input}
                          value={f.department}
                          onChange={set("department")}
                        />
                      </label>
                      <label className={label}>
                        {t(UI.position, lang)}
                        <input
                          className={input}
                          value={f.position}
                          onChange={set("position")}
                        />
                      </label>
                    </div>
                  </>
                )}

                {error && (
                  <p
                    className="border-l-4 border-bad bg-bad-soft px-4 py-3 text-[0.88rem] font-medium text-bad"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={busy}
                  size="lg"
                  className="w-full"
                >
                  {busy
                    ? "…"
                    : t(mode === "login" ? UI.login : UI.register, lang)}
                </Button>
              </form>
              <p className="mt-4 text-center text-[0.85rem] text-muted">
                {t(mode === "login" ? UI.noAccount : UI.haveAccount, lang)}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setMode(mode === "login" ? "register" : "login")
                  }
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {t(mode === "login" ? UI.register : UI.login, lang)}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* o'ng: platforma haqida */}
      <div className="relative hidden overflow-hidden bg-primary-strong px-12 py-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fff 0, transparent 45%), radial-gradient(circle at 80% 70%, #fff 0, transparent 40%)",
          }}
        />
        <div className="relative max-w-lg">
          <h2 className="text-[2.1rem] font-bold leading-tight">
            {t(UI.heroTitle, lang)}
          </h2>
          <p className="mt-4 text-white/80">{t(UI.heroText, lang)}</p>
          <ol className="mt-8 space-y-3">
            {UI.howSteps.slice(0, 4).map((st, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-lg border border-white/15 bg-white/10 px-4 py-3"
              >
                <span className="mt-0.5 shrink-0 rounded bg-white/20 px-2 py-0.5 text-[0.75rem] font-semibold tabular-nums">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{t(st.t, lang)}</span>
                  <span className="block text-[0.85rem] text-white/75">
                    {t(st.d, lang)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 flex items-center gap-2 text-[0.82rem] text-white/70">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {t(UI.onlyProtocols, lang)}
          </p>
        </div>
      </div>
    </div>
  );
}
