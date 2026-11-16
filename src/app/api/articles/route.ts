import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";

export const GET = handle(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const perPage = Math.min(30, Math.max(1, Number(sp.get("perPage")) || 9));
  const where = { status: "published" };
  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage, select: { title: true, slug: true, excerpt: true, cover: true, createdAt: true } }),
  ]);
  return ok({ items, total, page, perPage, pages: Math.ceil(total / perPage) });
});
