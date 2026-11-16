import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";
import { cardSelect, listProducts, PUBLISHED, queryFromParams, toCard } from "@/lib/products";

/**
 * GET /api/products
 * Query: q, category, sub, designer, min, max, rating, free=free|paid, video=1, lang,
 * difficulty, sale=1, flag=bestseller|new|sponsored|featured, sort, page, perPage (max 60), ids=a,b,c
 */
export const GET = handle(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const ids = sp.get("ids");
  if (ids) {
    const list = ids.split(",").filter(Boolean).slice(0, 100);
    const rows = await prisma.product.findMany({ where: { id: { in: list }, ...PUBLISHED }, select: cardSelect });
    return ok({ items: rows.map(toCard) });
  }
  const result = await listProducts(queryFromParams(sp));
  return ok(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
