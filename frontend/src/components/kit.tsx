/**
 * Umumiy UI primitivlari — butun platforma bir xil ko'rinishi uchun.
 * Uslub: davlat/klinik dizayn tizimlari (GOV.UK, NHS) va o'quv platformalari (Khan, Coursera, AMBOSS) andozasi:
 * ingichka chiziqlar, kichik burchaklar, kartochka o'rniga ro'yxat, aniq tipografik ierarxiya.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 select-none";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:bg-primary-strong shadow-[inset_0_-2px_0_rgba(0,0,0,.18)]",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-bad text-white hover:brightness-95",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[0.85rem]",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-12 px-6 text-[1rem]",
};

export function btn(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({ variant = "primary", size = "md", className = "", ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={btn(variant, size, className)} {...rest} />;
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={btn(variant, size, className)} {...rest} />;
}

type Tone = "neutral" | "primary" | "ok" | "bad" | "accent";
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  primary: "bg-primary-soft text-primary-strong border-primary/20",
  ok: "bg-ok-soft text-ok border-ok/25",
  bad: "bg-bad-soft text-bad border-bad/25",
  accent: "bg-accent-soft text-accent border-accent/25",
};

/** Kichik holat yorlig'i (GOV.UK "tag"). */
export function Tag({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[0.72rem] font-semibold leading-none tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Ingichka progress chizig'i. */
export function Progress({ value, tone = "primary", className = "", label }: { value: number; tone?: "primary" | "ok"; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${tone === "ok" ? "bg-ok" : "bg-primary"}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/** Sahifa sarlavhasi: oq polosa, non-yo'l, sarlavha, tavsif, meta-qator. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  meta,
  aside,
  narrow = false,
}: {
  crumbs?: { href: string; label: string }[];
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  narrow?: boolean;
}) {
  return (
    <header className="border-b border-line bg-surface">
      <div className={`mx-auto px-4 pb-8 pt-6 ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-5 text-[0.82rem] text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true" className="text-line-strong">/</span>}
                  <Link href={c.href} className="underline decoration-line-strong underline-offset-4 hover:text-primary hover:decoration-primary">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className={aside ? "grid gap-8 md:grid-cols-[1fr_300px] md:items-start" : ""}>
          <div className="min-w-0">
            {eyebrow && <p className="mb-2 text-[0.8rem] font-semibold text-muted">{eyebrow}</p>}
            <h1 className="text-[1.85rem] font-bold leading-[1.15] text-ink md:text-[2.15rem]">{title}</h1>
            {lead && <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-ink-2">{lead}</p>}
            {meta && <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.85rem] text-ink-2">{meta}</div>}
          </div>
          {aside}
        </div>
      </div>
    </header>
  );
}

/** Meta-qator elementi: ikonka + matn. */
export function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {children}
    </span>
  );
}

/** Bo'lim sarlavhasi (h2) + ixtiyoriy tavsif va o'ng tomondagi amal. */
export function SectionTitle({ title, lead, action, id }: { title: ReactNode; lead?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h2 id={id} className="text-[1.3rem] font-bold leading-tight text-ink">
          {title}
        </h2>
        {lead && <p className="mt-1 max-w-2xl text-[0.92rem] text-ink-2">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

/** Oq panel: ingichka chegara, ichki bo'linmalar uchun. */
export function Panel({ children, className = "", as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={`rounded-md border border-line bg-surface ${className}`}>{children}</As>;
}

/** NHS "inset text" / "care card" uslubidagi izoh bloki. */
export function Callout({
  tone = "primary",
  title,
  icon,
  children,
  className = "",
}: {
  tone?: "primary" | "ok" | "bad" | "accent" | "neutral";
  title?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const bar = { primary: "border-primary", ok: "border-ok", bad: "border-bad", accent: "border-accent", neutral: "border-line-strong" }[tone];
  const head = { primary: "text-primary-strong", ok: "text-ok", bad: "text-bad", accent: "text-accent", neutral: "text-ink" }[tone];
  return (
    <div className={`border-l-4 bg-surface py-3 pl-4 pr-3 ${bar} ${className}`}>
      {title && (
        <p className={`flex items-center gap-2 font-semibold ${head} [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:shrink-0`}>
          {icon}
          {title}
        </p>
      )}
      {children && <div className={`text-[0.92rem] text-ink-2 ${title ? "mt-1" : ""}`}>{children}</div>}
    </div>
  );
}

/** Raqamli ko'rsatkich (hisobot, natijalar). */
export function Stat({ value, label, sub, tone = "ink" }: { value: ReactNode; label: ReactNode; sub?: ReactNode; tone?: "ink" | "bad" | "ok" | "primary" }) {
  const c = { ink: "text-ink", bad: "text-bad", ok: "text-ok", primary: "text-primary" }[tone];
  return (
    <div className="min-w-0">
      <p className="text-[0.8rem] font-medium text-muted">{label}</p>
      <p className={`mt-1 text-[1.9rem] font-semibold leading-none tabular-nums ${c}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[0.78rem] text-muted">{sub}</p>}
    </div>
  );
}

/** Bo'sh holat / qulflangan holat. */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      {icon && <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-muted [&>svg]:h-5 [&>svg]:w-5">{icon}</div>}
      <p className="text-[1.05rem] font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-[0.92rem] text-ink-2">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "h-64" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line/60 ${className}`} aria-busy="true" />;
}

/** Protokol kodi va bo'lim raqamlari uchun monospace. */
export function Code({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.88em] tracking-tight">{children}</span>;
}
