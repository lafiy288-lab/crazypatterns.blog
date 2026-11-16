import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata = { title: "Edit article" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const a = await prisma.article.findUnique({ where: { id: (await params).id } });
  if (!a) notFound();
  return <ArticleForm initial={{ id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt, cover: a.cover, content: a.content, status: a.status === "published" ? "published" : "draft" }} />;
}
