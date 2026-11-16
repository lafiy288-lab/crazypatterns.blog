import { prisma } from "@/lib/db";
import { ApiError, handle, limitOrThrow, ok, parseBody } from "@/lib/api";
import { sanitizePlain } from "@/lib/sanitize";
import { reviewSchema } from "@/lib/validation";

/** New reviews are stored as "pending" and only shown after admin approval. */
export const POST = handle(async (req: Request) => {
  limitOrThrow(req, "review", 3, 10 * 60_000);
  const data = await parseBody(req, reviewSchema);
  const product = await prisma.product.findFirst({ where: { id: data.productId, status: "published" }, select: { id: true } });
  if (!product) throw new ApiError("Product not found", 404);
  await prisma.review.create({ data: { productId: product.id, name: sanitizePlain(data.name), rating: data.rating, text: sanitizePlain(data.text), status: "pending" } });
  return ok({ message: "Review submitted for moderation" }, { status: 201 });
});
