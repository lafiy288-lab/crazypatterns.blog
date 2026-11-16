import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { sanitizeRichText } from "./sanitize";
import { discountFrom, slugify, stripHtml, truncate } from "./utils";
import type { ProductInput } from "./validation";

/** Returns `base` or `base-2`, `base-3`… so slugs stay unique. */
export async function uniqueSlug(model: "product" | "category" | "designer" | "article", base: string, excludeId?: string) {
  const root = slugify(base) || "item";
  for (let i = 1; i < 500; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    const where = { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = await (prisma[model] as any).findFirst({ where, select: { id: true } });
    if (!found) return slug;
  }
  return `${root}-${Date.now()}`;
}

/** Converts validated form input into Prisma data: unique slug, discount, SEO defaults, sanitized HTML. */
export async function toProductData(input: ProductInput, excludeId?: string): Promise<Prisma.ProductUncheckedCreateInput> {
  const description = sanitizeRichText(input.description);
  const price = input.isFree ? 0 : input.price;
  const oldPrice = input.isFree || !input.oldPrice || input.oldPrice <= price ? null : input.oldPrice;
  const designer = await prisma.designer.findUnique({ where: { id: input.designerId }, select: { name: true } });
  return {
    title: input.title,
    slug: await uniqueSlug("product", input.slug || input.title, excludeId),
    sku: input.sku,
    description,
    price,
    oldPrice,
    currency: input.currency,
    discountPercent: discountFrom(price, oldPrice),
    images: JSON.stringify(input.images),
    categoryId: input.categoryId,
    subcategory: input.subcategory || null,
    designerId: input.designerId,
    difficulty: input.difficulty,
    languages: JSON.stringify(input.languages.length ? input.languages : ["English"]),
    fileFormat: input.fileFormat || "PDF",
    hasVideo: input.hasVideo,
    isFree: input.isFree,
    isBestseller: input.isBestseller,
    isNew: input.isNew,
    isSponsored: input.isSponsored,
    isFeatured: input.isFeatured,
    rating: input.rating,
    reviewCount: input.reviewCount,
    getPatternUrl: input.getPatternUrl ?? null,
    metaTitle: input.metaTitle || truncate(`${input.title} Pattern`, 70),
    metaDescription: input.metaDescription || truncate(stripHtml(description) || `${input.title}${designer ? ` by ${designer.name}` : ""}`, 160),
    status: input.status,
  };
}

export async function assertSkuFree(sku: string, excludeId?: string) {
  const found = await prisma.product.findFirst({ where: { sku, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
  return !found;
}
