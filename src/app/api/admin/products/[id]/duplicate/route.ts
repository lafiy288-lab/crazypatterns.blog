import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-products";

/** Creates a draft copy of a product with a new SKU and slug. */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const src = await prisma.product.findUnique({ where: { id: (await params).id } });
  if (!src) throw new ApiError("Not found", 404);
  const { id: _id, createdAt: _c, updatedAt: _u, importJobId: _j, ...rest } = src;
  let sku = `${src.sku}-COPY`;
  for (let i = 2; await prisma.product.findUnique({ where: { sku }, select: { id: true } }); i++) sku = `${src.sku}-COPY${i}`;
  const copy = await prisma.product.create({
    data: { ...rest, sku, title: `${src.title} (copy)`, slug: await uniqueSlug("product", `${src.slug}-copy`), status: "draft", reviewCount: 0, rating: 0 },
  });
  return ok({ id: copy.id }, { status: 201 });
});
