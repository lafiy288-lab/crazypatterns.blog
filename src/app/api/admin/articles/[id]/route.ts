import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-products";
import { revalidatePublic } from "@/lib/revalidate";
import { sanitizeRichText } from "@/lib/sanitize";
import { articleSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const a = await prisma.article.findUnique({ where: { id: (await params).id } });
  if (!a) throw new ApiError("Not found", 404);
  return ok(a);
});

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const d = await parseBody(req, articleSchema);
  await prisma.article.update({
    where: { id },
    data: { title: d.title, slug: await uniqueSlug("article", d.slug || d.title, id), excerpt: d.excerpt, cover: d.cover, content: sanitizeRichText(d.content), status: d.status },
  });
  revalidatePublic();
  return ok({ id });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await prisma.article.delete({ where: { id: (await params).id } });
  revalidatePublic();
  return ok({ ok: true });
});
