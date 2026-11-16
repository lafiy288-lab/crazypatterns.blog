import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { Logo } from "./logo";

const PAYMENTS = ["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay", "Klarna"];

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-20 border-t border-line bg-card">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_repeat(5,1fr)]">
        <div className="space-y-3">
          <Logo siteName={s.siteName} tagline={s.tagline} logo={s.logo} />
          <p className="max-w-xs text-sm text-muted">Digital patterns and tutorials from independent designers around the world.</p>
        </div>
        {s.footer.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-3 font-heading text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Accepted payment methods">
            {PAYMENTS.map((p) => (
              <li key={p} className="rounded-lg border border-line bg-cream px-2.5 py-1 text-[11px] font-semibold text-muted">
                {p}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
