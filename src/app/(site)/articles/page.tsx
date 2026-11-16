import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Articles", description: "Guides, techniques and inspiration for crocheters, knitters, sewists and crafters.", alternates: { canonical: "/articles" } };
export const revalidate = 300;

const PER_PAGE = 9;

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const where = { status: "published" };
  const [total, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, select: { id: true, title: true, slug: true, excerpt: true, cover: true, createdAt: true } }),
  ]);
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Articles</h1>
      <p className="mb-8 mt-2 text-muted">Techniques, tips and inspiration from our designers.</p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a, i) => (
          <li key={a.id} className="card group relative overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image src={a.cover || "/placeholders/og.webp"} alt="" fill sizes="(min-width:1024px) 400px, 100vw" priority={i < 3} className="object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <time className="text-xs text-muted" dateTime={a.createdAt.toISOString()}>{formatDate(a.createdAt)}</time>
              <h2 className="mt-1 font-heading text-lg font-semibold leading-snug">
                <Link href={`/articles/${a.slug}`} className="after:absolute after:inset-0">{a.title}</Link>
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{a.excerpt}</p>
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} basePath="/articles" params={{}} />
    </div>
  );
}
