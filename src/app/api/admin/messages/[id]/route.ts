import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { isRead } = await parseBody(req, z.object({ isRead: z.boolean() }));
  await prisma.message.update({ where: { id: (await params).id }, data: { isRead } });
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  await prisma.message.delete({ where: { id: (await params).id } });
  return ok({ ok: true });
});
