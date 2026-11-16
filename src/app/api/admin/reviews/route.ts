import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const where = status === "pending" || status === "approved" ? { status } : {};
  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { product: { select: { title: true, slug: true } } } }),
  ]);
  return ok({ items, total, page, pages: Math.max(1, Math.ceil(total / 25)) });
});
