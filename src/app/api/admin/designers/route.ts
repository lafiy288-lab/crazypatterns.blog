import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, parseBody } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-products";
import { revalidatePublic } from "@/lib/revalidate";
import { designerSchema } from "@/lib/validation";

export const GET = handle(async () => {
  await requireAdmin();
  const rows = await prisma.designer.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return ok({ items: rows.map((d) => ({ ...d, productCount: d._count.products })) });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const d = await parseBody(req, designerSchema);
  const row = await prisma.designer.create({ data: { name: d.name, slug: await uniqueSlug("designer", d.slug || d.name), bio: d.bio, avatar: d.avatar } });
  revalidatePublic();
  return ok(row, { status: 201 });
});
