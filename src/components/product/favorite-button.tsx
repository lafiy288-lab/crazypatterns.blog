"use client";

import { Heart } from "lucide-react";
import { usePrefs } from "@/components/site/prefs";
import { cn } from "@/lib/utils";

export function FavoriteButton({ id, title, className, withLabel }: { id: string; title: string; className?: string; withLabel?: boolean }) {
  const { isFavorite, toggleFavorite } = usePrefs();
  const active = isFavorite(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
      }}
      aria-pressed={active}
      // Icon-only buttons need a label; the labelled variant uses its visible text.
      aria-label={withLabel ? undefined : active ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      className={cn(
        "transition active:scale-90",
        withLabel ? "btn-outline" : "grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-800 shadow-soft backdrop-blur hover:scale-105 hover:text-accent-strong",
        className,
      )}
    >
      <Heart className={cn("h-[18px] w-[18px] transition", active && "text-accent")} fill={active ? "currentColor" : "none"} aria-hidden />
      {withLabel && (active ? "Saved to favorites" : "Add to favorites")}
    </button>
  );
}
