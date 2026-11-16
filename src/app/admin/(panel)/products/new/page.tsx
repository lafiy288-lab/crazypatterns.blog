import { productFormOptions } from "@/lib/admin-options";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const { categories, designers } = await productFormOptions();
  return (
    <ProductForm
      categories={categories}
      designers={designers}
      initial={{
        title: "", slug: "", sku: `PN-${Date.now().toString(36).toUpperCase()}`, description: "", price: 4.95, oldPrice: null, currency: "USD", images: [],
        categoryId: categories[0]?.id ?? "", subcategory: null, designerId: "", difficulty: "beginner", languages: ["English"], fileFormat: "PDF",
        hasVideo: false, isFree: false, isBestseller: false, isNew: true, isSponsored: false, isFeatured: false, rating: 0, reviewCount: 0,
        getPatternUrl: null, metaTitle: null, metaDescription: null, status: "draft",
      }}
    />
  );
}
