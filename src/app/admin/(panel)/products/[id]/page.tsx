import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { productFormOptions } from "@/lib/admin-options";
import type { ProductImage } from "@/lib/types";
import { ProductForm, type ProductFormValue } from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, { categories, designers }] = await Promise.all([prisma.product.findUnique({ where: { id } }), productFormOptions()]);
  if (!p) notFound();
  const initial: ProductFormValue = {
    id: p.id, title: p.title, slug: p.slug, sku: p.sku, description: p.description, price: p.price, oldPrice: p.oldPrice, currency: p.currency === "EUR" ? "EUR" : "USD",
    images: parseJson<ProductImage[]>(p.images, []), categoryId: p.categoryId, subcategory: p.subcategory, designerId: p.designerId,
    difficulty: (["beginner", "intermediate", "advanced"].includes(p.difficulty) ? p.difficulty : "beginner") as ProductFormValue["difficulty"],
    languages: parseJson<string[]>(p.languages, []), fileFormat: p.fileFormat, hasVideo: p.hasVideo, isFree: p.isFree, isBestseller: p.isBestseller, isNew: p.isNew,
    isSponsored: p.isSponsored, isFeatured: p.isFeatured, rating: p.rating, reviewCount: p.reviewCount, getPatternUrl: p.getPatternUrl, metaTitle: p.metaTitle,
    metaDescription: p.metaDescription, status: p.status === "published" ? "published" : "draft",
  };
  return <ProductForm key={p.updatedAt.toISOString()} initial={initial} categories={categories} designers={designers} />;
}
