import crypto from "node:crypto";
import sharp from "sharp";
import { getStorage } from "./storage";
import type { ProductImage } from "./types";

export const IMAGE_SIZES = { thumb: 300, medium: 600, large: 1200 } as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * Converts an image into three WebP sizes (300/600/1200px wide) plus a tiny
 * blurred base64 placeholder, and stores them via the configured adapter.
 */
export async function processImage(input: Buffer, baseName: string, alt = ""): Promise<ProductImage> {
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.format) throw new Error("Unsupported image");
  const id = `${baseName.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "img"}-${crypto.randomBytes(4).toString("hex")}`;
  const storage = getStorage();
  const out: Partial<ProductImage> = { alt };

  for (const [name, width] of Object.entries(IMAGE_SIZES)) {
    const buf = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    out[name as keyof typeof IMAGE_SIZES] = await storage.put(`products/${id}-${width}.webp`, buf, "image/webp");
  }
  const blur = await sharp(input).resize(16, 20, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
  out.blur = `data:image/webp;base64,${blur.toString("base64")}`;
  out.url = out.large!;
  return out as ProductImage;
}

export async function removeImage(img: ProductImage) {
  const storage = getStorage();
  const urls = new Set([img.url, img.thumb, img.medium, img.large].filter(Boolean) as string[]);
  await Promise.all([...urls].map((u) => storage.remove(u)));
}
