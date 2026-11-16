import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-products";
import { revalidatePublic } from "@/lib/revalidate";
import { designerSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const d = await parseBody(req, designerSchema);
  const row = await prisma.designer.update({ where: { id }, data: { name: d.name, slug: await uniqueSlug("designer", d.slug || d.name, id), bio: d.bio, avatar: d.avatar } });
  revalidatePublic();
  return ok(row);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const count = await prisma.product.count({ where: { designerId: id } });
  if (count) throw new ApiError(`This designer still has ${count} products`, 409);
  await prisma.designer.delete({ where: { id } });
  revalidatePublic();
  return ok({ ok: true });
});
