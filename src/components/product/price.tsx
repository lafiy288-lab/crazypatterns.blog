"use client";

import { usePrefs } from "@/components/site/prefs";
import { cn, formatMoney } from "@/lib/utils";

type Props = { price: number; oldPrice?: number | null; isFree?: boolean; from?: boolean; size?: "sm" | "lg"; className?: string };

export function Price({ price, oldPrice, isFree, from = true, size = "sm", className }: Props) {
  const { currency } = usePrefs();
  if (isFree || price === 0) {
    return <span className={cn("font-heading font-semibold text-primary", size === "lg" ? "text-2xl" : "text-base", className)}>Free</span>;
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-heading font-semibold", size === "lg" ? "text-2xl" : "text-base", oldPrice ? "text-accent-ink" : "text-ink")}>
        {from && <span className="mr-1 text-xs font-normal text-muted">from</span>}
        {formatMoney(price, currency)}
      </span>
      {oldPrice && oldPrice > price ? (
        <s className={cn("text-muted", size === "lg" ? "text-base" : "text-xs")}>
          <span className="sr-only">Was </span>
          {formatMoney(oldPrice, currency)}
        </s>
      ) : null}
    </span>
  );
}
