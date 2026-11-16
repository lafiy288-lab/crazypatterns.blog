import Link from "next/link";
import { Gift } from "lucide-react";
import type { ProductCardData } from "@/lib/types";
import { ProductGrid } from "@/components/product/product-grid";
import { Reveal } from "@/components/ui/reveal";

export function FreeBanner({ title, text, products }: { title: string; text: string; products: ProductCardData[] }) {
  return (
    <section aria-labelledby="free-title" className="py-10">
      <div className="container-page">
        <Reveal className="overflow-hidden rounded-[28px] bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 p-6 sm:p-10">
          <div className="mb-8 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <span className="chip mb-3 gap-1 bg-primary text-white"><Gift className="h-3.5 w-3.5" aria-hidden /> Free</span>
              <h2 id="free-title" className="text-3xl font-bold sm:text-4xl">{title}</h2>
              <p className="mt-2 max-w-xl text-muted">{text}</p>
            </div>
            <Link href="/free-patterns" className="btn-primary px-6 py-3">All free patterns</Link>
          </div>
          <ProductGrid products={products} />
        </Reveal>
      </div>
    </section>
  );
}
