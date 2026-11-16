import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { assertSkuFree, toProductData } from "@/lib/admin-products";
import { parseJson } from "@/lib/json";
import { revalidatePublic } from "@/lib/revalidate";
import { productSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id: (await params).id } });
  if (!p) throw new ApiError("Not found", 404);
  return ok({ ...p, images: parseJson(p.images, []), languages: parseJson(p.languages, []) });
});

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const input = await parseBody(req, productSchema);
  if (!(await assertSkuFree(input.sku, id))) throw new ApiError("SKU already exists", 409);
  const product = await prisma.product.update({ where: { id }, data: await toProductData(input, id) });
  revalidatePublic();
  return ok({ id: product.id, slug: product.slug });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await prisma.product.delete({ where: { id: (await params).id } });
  revalidatePublic();
  return ok({ ok: true });
});
