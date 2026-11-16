import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, parseBody } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-products";
import { revalidatePublic } from "@/lib/revalidate";
import { sanitizeRichText } from "@/lib/sanitize";
import { articleSchema } from "@/lib/validation";

export const GET = handle(async () => {
  await requireAdmin();
  const items = await prisma.article.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, slug: true, status: true, cover: true, createdAt: true, updatedAt: true } });
  return ok({ items });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const d = await parseBody(req, articleSchema);
  const row = await prisma.article.create({
    data: { title: d.title, slug: await uniqueSlug("article", d.slug || d.title), excerpt: d.excerpt, cover: d.cover, content: sanitizeRichText(d.content), status: d.status },
  });
  revalidatePublic();
  return ok({ id: row.id }, { status: 201 });
});
