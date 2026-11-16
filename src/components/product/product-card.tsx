import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { ProductCardData } from "@/lib/types";
import { pickSrc } from "@/lib/image-src";
import { Stars } from "@/components/ui/stars";
import { Price } from "./price";
import { FavoriteButton } from "./favorite-button";

export function ProductCard({ product, priority = false, showAd = false }: { product: ProductCardData; priority?: boolean; showAd?: boolean }) {
  const p = product;
  return (
    <article className="group card relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/5] overflow-hidden bg-line/40">
        <Image
          src={pickSrc(p.image, "medium")}
          alt={p.image?.alt || p.title}
          fill
          sizes="(min-width:1280px) 280px, (min-width:768px) 30vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          placeholder={p.image?.blur ? "blur" : "empty"}
          blurDataURL={p.image?.blur}
          priority={priority}
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {p.isFree && <span className="chip bg-primary text-white">FREE</span>}
          {!p.isFree && p.discountPercent > 0 && <span className="chip bg-accent-strong text-white">-{p.discountPercent}%</span>}
          {p.isNew && <span className="chip bg-white/90 text-primary">New</span>}
          {showAd && <span className="chip bg-ink/80 text-white">Ad</span>}
        </div>
        <FavoriteButton id={p.id} title={p.title} className="absolute right-2.5 top-2.5 z-10" />
        {p.hasVideo && (
          <span className="chip absolute bottom-2.5 left-2.5 gap-1 bg-ink/80 text-white">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden /> Video
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 font-heading text-[15px] font-semibold leading-snug">
          <Link href={`/product/${p.slug}`} className="after:absolute after:inset-0 focus-visible:underline">
            {p.title}
          </Link>
        </h3>
        <p className="text-xs text-muted">by {p.designerName}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Stars rating={p.rating} size={13} />
          <span>({p.reviewCount})</span>
        </div>
        <div className="mt-auto pt-1">
          <Price price={p.price} oldPrice={p.oldPrice} isFree={p.isFree} />
        </div>
      </div>
    </article>
  );
}
