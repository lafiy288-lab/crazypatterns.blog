import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { PUBLISHED } from "@/lib/products";

export const revalidate = 300;
export const metadata: Metadata = { title: "All Categories", description: "Browse every craft category on PatternNest.", alternates: { canonical: "/categories" } };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: PUBLISHED } } } } });
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">All Categories</h1>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
            <Link href={`/category/${c.slug}`} className="block">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image src={c.image || "/placeholders/fallback.webp"} alt="" fill sizes="(min-width:1024px) 400px, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <h2 className="font-heading text-xl font-semibold">{c.name}</h2>
                <p className="mt-1 text-sm text-muted">{c._count.products} patterns · {c.description}</p>
              </div>
            </Link>
            <ul className="flex flex-wrap gap-2 px-5 pb-5">
              {parseJson<string[]>(c.subcategories, []).map((s) => (
                <li key={s}>
                  <Link href={`/category/${c.slug}?sub=${encodeURIComponent(s)}`} className="chip border border-line bg-cream px-3 py-1 hover:border-primary">{s}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
