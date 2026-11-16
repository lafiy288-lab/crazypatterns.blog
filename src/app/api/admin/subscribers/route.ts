import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const q = sp.get("q")?.trim();
  const where = q ? { email: { contains: q.toLowerCase() } } : {};
  const [total, items] = await Promise.all([
    prisma.subscriber.count({ where }),
    prisma.subscriber.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
  ]);
  return ok({ items, total, page, pages: Math.max(1, Math.ceil(total / 50)) });
});
