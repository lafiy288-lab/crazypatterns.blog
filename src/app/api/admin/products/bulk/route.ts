import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { revalidatePublic } from "@/lib/revalidate";
import { bulkSchema } from "@/lib/validation";

/** Bulk actions: publish, unpublish, delete, change category, set discount %, toggle flags. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const body = await parseBody(req, bulkSchema);
  const where = { id: { in: body.ids } };
  let count = 0;
  switch (body.action) {
    case "publish":
    case "unpublish":
      count = (await prisma.product.updateMany({ where, data: { status: body.action === "publish" ? "published" : "draft" } })).count;
      break;
    case "delete":
      count = (await prisma.product.deleteMany({ where })).count;
      break;
    case "category": {
      if (!body.categoryId || !(await prisma.category.findUnique({ where: { id: body.categoryId } }))) throw new ApiError("Choose a valid category");
      count = (await prisma.product.updateMany({ where, data: { categoryId: body.categoryId, subcategory: null } })).count;
      break;
    }
    case "discount": {
      // Sets price = basePrice * (1 - pct) where basePrice is the old price if already discounted.
      const pct = body.discountPercent ?? 0;
      const rows = await prisma.product.findMany({ where: { ...where, isFree: false }, select: { id: true, price: true, oldPrice: true } });
      await prisma.$transaction(
        rows.map((r) => {
          const base = r.oldPrice && r.oldPrice > r.price ? r.oldPrice : r.price;
          return prisma.product.update({
            where: { id: r.id },
            data: pct > 0 ? { oldPrice: base, price: Number((base * (1 - pct / 100)).toFixed(2)), discountPercent: pct } : { price: base, oldPrice: null, discountPercent: 0 },
          });
        }),
      );
      count = rows.length;
      break;
    }
    case "flag": {
      if (!body.flag || body.value === undefined) throw new ApiError("Choose a flag and value");
      count = (await prisma.product.updateMany({ where, data: { [body.flag]: body.value, ...(body.flag === "isFree" && body.value ? { price: 0, oldPrice: null, discountPercent: 0 } : {}) } })).count;
      break;
    }
  }
  revalidatePublic();
  return ok({ count });
});
