import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

export function ProductGrid({ products, columns = 4, showAd, priorityCount = 0 }: { products: ProductCardData[]; columns?: 3 | 4; showAd?: boolean; priorityCount?: number }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3", columns === 4 && "lg:grid-cols-4")}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} showAd={showAd} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
