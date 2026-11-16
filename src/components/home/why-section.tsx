import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";
import type { SiteSettings } from "@/lib/types";

export function WhySection({ siteName, counters }: { siteName: string; counters: SiteSettings["counters"] }) {
  const stats = [
    { value: counters.patterns, label: "Patterns" },
    { value: counters.designers, label: "Designers" },
    { value: counters.downloads, label: "Downloads" },
    { value: counters.rating, label: "Average rating" },
  ];
  return (
    <section aria-labelledby="why-title" className="container-page py-12">
      <Reveal className="card grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <h2 id="why-title" className="text-3xl font-bold">Why {siteName}?</h2>
          <p className="mt-4 leading-relaxed text-muted">
            We bring together independent designers and makers in one calm, inspiring place. Every pattern is a downloadable PDF with clear instructions, many include video tutorials, and our
            community reviews help you pick the right project for your skill level. No account needed — just browse, save your favorites and start making.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-cream p-5 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-3xl font-bold text-primary sm:text-4xl">
                <Counter value={s.value} />
              </dd>
              <dd className="mt-1 text-sm text-muted" aria-hidden>{s.label}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
