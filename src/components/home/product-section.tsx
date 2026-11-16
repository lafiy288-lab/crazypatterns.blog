import type { ProductCardData } from "@/lib/types";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductGrid } from "@/components/product/product-grid";
import { Reveal } from "@/components/ui/reveal";

type Props = { id: string; title: string; subtitle?: string; href?: string; linkLabel?: string; products: ProductCardData[]; showAd?: boolean };

export function ProductSection({ id, title, subtitle, href, linkLabel, products, showAd }: Props) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={id} className="container-page py-10">
      <Reveal>
        <SectionHeader id={id} title={title} subtitle={subtitle} href={href} linkLabel={linkLabel} />
        <ProductGrid products={products} showAd={showAd} />
      </Reveal>
    </section>
  );
}
