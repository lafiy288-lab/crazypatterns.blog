import Image from "next/image";
import Link from "next/link";

export function Logo({ siteName, tagline, logo, href = "/" }: { siteName: string; tagline?: string; logo?: string | null; href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2.5" aria-label={`${siteName} home`}>
      {logo ? (
        <Image src={logo} alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-contain" />
      ) : (
        <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden>
          <rect width="64" height="64" rx="16" fill="rgb(var(--color-primary))" />
          <circle cx="32" cy="34" r="16" fill="rgb(var(--color-accent))" />
          <path d="M18 30c8-6 20-6 28 0M17 38c9-5 21-5 30 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
          <path d="M14 22c6-10 30-10 36 0" stroke="#FFFBF5" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      )}
      <span className="leading-tight">
        <span className="block font-heading text-lg font-bold text-ink">{siteName}</span>
        {tagline && <span className="hidden text-[11px] text-muted sm:block">{tagline}</span>}
      </span>
    </Link>
  );
}
