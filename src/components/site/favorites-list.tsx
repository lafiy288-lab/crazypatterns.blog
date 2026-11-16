"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { ProductCardData } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeletons";
import { usePrefs } from "./prefs";

export function FavoritesList() {
  const { favorites, ready } = usePrefs();
  const [items, setItems] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!favorites.length) return setItems([]);
    const ctrl = new AbortController();
    fetch(`/api/products?ids=${favorites.slice(0, 100).join(",")}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => setItems(j.items ?? []))
      .catch(() => undefined);
    return () => ctrl.abort();
    // Only refetch when the set of ids grows; removals are filtered locally below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, favorites.length === 0 ? 0 : favorites.join(",")]);

  if (!ready || items === null) return <ProductGridSkeleton count={4} />;
  const visible = items.filter((p) => favorites.includes(p.id));
  if (!visible.length) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <Heart className="h-10 w-10 text-accent" aria-hidden />
        <h2 className="font-heading text-lg font-semibold">No favorites yet</h2>
        <p className="max-w-sm text-sm text-muted">Tap the heart on any pattern to save it here for later.</p>
        <Link href="/" className="btn-primary mt-2">Discover patterns</Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {visible.map((p) => (
        <li key={p.id}><ProductCard product={p} /></li>
      ))}
    </ul>
  );
}
