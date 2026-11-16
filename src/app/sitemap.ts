import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, articles, designers] = await Promise.all([
    prisma.product.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 45000 }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.article.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
    prisma.designer.findMany({ select: { slug: true } }),
  ]);
  const staticPages = ["", "/categories", "/free-patterns", "/articles", "/contact", "/inspiration"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 }));
  return [
    ...staticPages,
    ...categories.map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
    ...articles.map((a) => ({ url: `${SITE_URL}/articles/${a.slug}`, lastModified: a.updatedAt, priority: 0.5 })),
    ...designers.map((d) => ({ url: `${SITE_URL}/designer/${d.slug}`, priority: 0.4 })),
  ];
}
