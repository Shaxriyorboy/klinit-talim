export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="var(--primary)" />
      {/* Qalqon (inspeksiya) + tibbiy xoch */}
      <path d="M20 8l10 4v7c0 6.5-4.3 11.2-10 13-5.7-1.8-10-6.5-10-13v-7z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 15.5v9M15.5 20h9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
