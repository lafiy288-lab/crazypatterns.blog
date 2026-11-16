import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";
import { parseJson } from "@/lib/json";
import { PUBLISHED } from "@/lib/products";

export const GET = handle(async () => {
  const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: PUBLISHED } } } } });
  return ok({
    items: rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, image: c.image, subcategories: parseJson(c.subcategories, []), productCount: c._count.products })),
  });
});
