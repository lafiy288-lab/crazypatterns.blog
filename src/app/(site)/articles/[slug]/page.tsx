import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

const getArticle = cache((slug: string) => prisma.article.findFirst({ where: { slug, status: "published" } }));

export async function generateStaticParams() {
  return (await prisma.article.findMany({ where: { status: "published" }, select: { slug: true } })).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/articles/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt, images: a.cover ? [a.cover] : undefined, publishedTime: a.createdAt.toISOString() },
  };
}

export default async function ArticlePage({ params }: Props) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  const more = await prisma.article.findMany({ where: { status: "published", id: { not: a.id } }, orderBy: { createdAt: "desc" }, take: 3, select: { title: true, slug: true } });
  return (
    <article className="container-page max-w-3xl py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/articles" className="hover:text-primary">Articles</Link>
      </nav>
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{a.title}</h1>
      <time className="mt-3 block text-sm text-muted" dateTime={a.createdAt.toISOString()}>{formatDate(a.createdAt)}</time>
      {a.cover && (
        <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={a.cover} alt="" fill priority sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="prose prose-lg prose-slate max-w-none dark:prose-invert prose-headings:font-heading prose-a:text-primary" dangerouslySetInnerHTML={{ __html: a.content }} />
      {more.length > 0 && (
        <aside className="card mt-12 p-6" aria-labelledby="more-articles">
          <h2 id="more-articles" className="mb-3 font-heading text-lg font-semibold">Keep reading</h2>
          <ul className="space-y-2">
            {more.map((m) => (
              <li key={m.slug}><Link href={`/articles/${m.slug}`} className="text-primary hover:underline">{m.title}</Link></li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
