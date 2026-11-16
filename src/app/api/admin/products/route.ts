import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { assertSkuFree, toProductData } from "@/lib/admin-products";
import { parseJson } from "@/lib/json";
import { revalidatePublic } from "@/lib/revalidate";
import type { ProductImage } from "@/lib/types";
import { productSchema } from "@/lib/validation";

const SORTABLE = ["title", "price", "createdAt", "updatedAt", "rating", "sku", "status"] as const;

/** Admin product list: search, filters, sorting, pagination. */
export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const perPage = Math.min(100, Math.max(5, Number(sp.get("perPage")) || 20));
  const q = sp.get("q")?.trim();
  const and: Prisma.ProductWhereInput[] = [];
  if (q) {
    const match = { contains: q, mode: "insensitive" as const };
    and.push({ OR: [{ title: match }, { sku: match }, { slug: match }, { designer: { name: match } }] });
  }
  if (sp.get("status")) and.push({ status: sp.get("status")! });
  if (sp.get("categoryId")) and.push({ categoryId: sp.get("categoryId")! });
  const type = sp.get("type");
  if (type === "free") and.push({ isFree: true });
  if (type === "paid") and.push({ isFree: false });
  if (type === "sale") and.push({ discountPercent: { gt: 0 } });
  const flag = sp.get("flag");
  if (flag && ["isBestseller", "isNew", "isSponsored", "isFeatured", "hasVideo"].includes(flag)) and.push({ [flag]: true });
  const sortKey = (SORTABLE as readonly string[]).includes(sp.get("sort") ?? "") ? (sp.get("sort") as (typeof SORTABLE)[number]) : "createdAt";
  const dir = sp.get("dir") === "asc" ? "asc" : "desc";
  const where = { AND: and };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ [sortKey]: dir }, { id: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, title: true, slug: true, sku: true, price: true, oldPrice: true, discountPercent: true, isFree: true, status: true, images: true,
        isBestseller: true, isNew: true, isSponsored: true, isFeatured: true, hasVideo: true, rating: true, createdAt: true, updatedAt: true,
        category: { select: { name: true } }, designer: { select: { name: true } },
      },
    }),
  ]);
  return ok({
    items: rows.map((r) => ({ ...r, image: parseJson<ProductImage[]>(r.images, [])[0] ?? null, images: undefined })),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const input = await parseBody(req, productSchema);
  if (!(await assertSkuFree(input.sku))) throw new ApiError("SKU already exists", 409);
  const product = await prisma.product.create({ data: await toProductData(input) });
  revalidatePublic();
  return ok({ id: product.id, slug: product.slug }, { status: 201 });
});
