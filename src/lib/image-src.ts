import type { ProductImage } from "./types";

export const FALLBACK_IMAGE = "/placeholders/fallback.webp";

/** Best stored size for a given display width (safe to import in client components). */
export function pickSrc(img: ProductImage | null | undefined, size: "thumb" | "medium" | "large" = "medium") {
  if (!img) return FALLBACK_IMAGE;
  return img[size] || img.medium || img.large || img.url || FALLBACK_IMAGE;
}
