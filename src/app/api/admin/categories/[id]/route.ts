import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-products";
import { revalidatePublic } from "@/lib/revalidate";
import { categorySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const d = await parseBody(req, categorySchema);
  const row = await prisma.category.update({
    where: { id },
    data: { name: d.name, slug: await uniqueSlug("category", d.slug || d.name, id), description: d.description, image: d.image, subcategories: JSON.stringify(d.subcategories), sortOrder: d.sortOrder },
  });
  revalidatePublic();
  return ok(row);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count) throw new ApiError(`Move or delete the ${count} products in this category first`, 409);
  await prisma.category.delete({ where: { id } });
  revalidatePublic();
  return ok({ ok: true });
});
