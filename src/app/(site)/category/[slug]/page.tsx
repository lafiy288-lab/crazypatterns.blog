import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { Listing } from "@/components/listing/listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const getCategory = cache((slug: string) => prisma.category.findUnique({ where: { slug } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return {};
  return {
    title: `${c.name} Patterns`,
    description: c.description || `Browse ${c.name.toLowerCase()} patterns from independent designers.`,
    alternates: { canonical: `/category/${c.slug}` },
    openGraph: { title: `${c.name} Patterns`, description: c.description, images: c.image ? [c.image] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const sp = await searchParams;
  const sub = typeof sp.sub === "string" ? sp.sub : undefined;
  return (
    <div className="container-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <Link href="/" className="hover:text-primary">Home</Link> / <Link href="/categories" className="hover:text-primary">Categories</Link> / <span className="text-ink">{category.name}</span>
      </nav>
      <h1 className="text-3xl font-bold sm:text-4xl">{sub ? `${sub} · ${category.name}` : `${category.name} Patterns`}</h1>
      <p className="mb-8 mt-2 max-w-2xl text-muted">{category.description}</p>
      <Listing basePath={`/category/${category.slug}`} searchParams={sp} fixed={{ category: category.slug }} subcategories={parseJson<string[]>(category.subcategories, [])} />
    </div>
  );
}
