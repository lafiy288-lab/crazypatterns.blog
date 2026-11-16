import { prisma } from "@/lib/db";
import { fail, handle, ok } from "@/lib/api";
import { parseJson } from "@/lib/json";
import { PUBLISHED } from "@/lib/products";

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const p = await prisma.product.findFirst({
    where: { slug, ...PUBLISHED },
    include: {
      category: { select: { name: true, slug: true } },
      designer: { select: { name: true, slug: true, avatar: true } },
      reviews: { where: { status: "approved" }, orderBy: { createdAt: "desc" }, take: 20, select: { name: true, rating: true, text: true, createdAt: true } },
    },
  });
  if (!p) return fail("Not found", 404);
  const { importJobId: _job, ...rest } = p;
  return ok({ ...rest, images: parseJson(p.images, []), languages: parseJson(p.languages, []) });
});
