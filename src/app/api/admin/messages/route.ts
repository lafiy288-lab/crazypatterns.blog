import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const where = sp.get("filter") === "unread" ? { isRead: false } : {};
  const [total, items] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 30, take: 30 }),
  ]);
  return ok({ items, total, page, pages: Math.max(1, Math.ceil(total / 30)) });
});
