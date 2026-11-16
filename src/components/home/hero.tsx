import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

type Cat = { name: string; slug: string; image: string | null; count: number };

export function Hero({ title, subtitle, categories }: { title: string; subtitle: string; categories: Cat[] }) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-accent/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-40 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
      <div className="container-page relative pb-14 pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="chip mb-4 gap-1.5 border border-accent/30 bg-card px-3 py-1 text-accent-ink">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> New patterns added every day
          </p>
          <h1 id="hero-title" className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted sm:text-xl">{subtitle}</p>
        </div>

        <ul className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="group card block overflow-hidden p-2 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    <Image
                      src={c.image || "/placeholders/fallback.webp"}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 190px, 33vw"
                      priority={i < 3}
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="px-1 pb-1 pt-2.5 text-center">
                    <span className="block font-heading text-sm font-semibold sm:text-base">{c.name}</span>
                    <span className="text-xs text-muted">{c.count} patterns</span>
                  </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/categories" className="btn-primary px-6 py-3">
            All Categories <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/inspiration" className="btn-outline px-6 py-3">
            Get Inspired
          </Link>
        </div>
      </div>
    </section>
  );
}
