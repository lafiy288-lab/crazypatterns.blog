import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { revalidatePublic } from "@/lib/revalidate";

type Ctx = { params: Promise<{ id: string }> };

/** Approve or reject (back to pending). Approving folds the rating into the product's average. */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const { status } = await parseBody(req, z.object({ status: z.enum(["approved", "pending"]) }));
  const review = await prisma.review.findUnique({ where: { id }, include: { product: { select: { id: true, rating: true, reviewCount: true } } } });
  if (!review) throw new ApiError("Not found", 404);
  if (review.status === status) return ok(review);
  const p = review.product;
  const delta = status === "approved" ? 1 : -1;
  const count = Math.max(0, p.reviewCount + delta);
  const rating = count === 0 ? 0 : Math.min(5, Math.max(0, (p.rating * p.reviewCount + delta * review.rating) / count));
  await prisma.$transaction([
    prisma.review.update({ where: { id }, data: { status } }),
    prisma.product.update({ where: { id: p.id }, data: { reviewCount: count, rating: Number(rating.toFixed(2)) } }),
  ]);
  revalidatePublic();
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id }, include: { product: { select: { id: true, rating: true, reviewCount: true } } } });
  if (!review) throw new ApiError("Not found", 404);
  const ops = [prisma.review.delete({ where: { id } })];
  if (review.status === "approved") {
    const p = review.product;
    const count = Math.max(0, p.reviewCount - 1);
    const rating = count === 0 ? 0 : (p.rating * p.reviewCount - review.rating) / count;
    ops.push(prisma.product.update({ where: { id: p.id }, data: { reviewCount: count, rating: Number(Math.min(5, Math.max(0, rating)).toFixed(2)) } }) as never);
  }
  await prisma.$transaction(ops);
  revalidatePublic();
  return ok({ ok: true });
});
