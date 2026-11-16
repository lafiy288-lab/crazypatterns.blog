import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, parseBody } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-products";
import { parseJson } from "@/lib/json";
import { revalidatePublic } from "@/lib/revalidate";
import { categorySchema } from "@/lib/validation";

export const GET = handle(async () => {
  await requireAdmin();
  const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return ok({ items: rows.map((c) => ({ ...c, subcategories: parseJson<string[]>(c.subcategories, []), productCount: c._count.products })) });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const d = await parseBody(req, categorySchema);
  const row = await prisma.category.create({
    data: { name: d.name, slug: await uniqueSlug("category", d.slug || d.name), description: d.description, image: d.image, subcategories: JSON.stringify(d.subcategories), sortOrder: d.sortOrder },
  });
  revalidatePublic();
  return ok(row, { status: 201 });
});
