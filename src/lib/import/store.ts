import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const IMPORT_ROOT = path.join(process.env.DATA_DIR || path.join(process.cwd(), "storage"), "imports");

export type RawRow = Record<string, string>;

const safeId = (id: string) => id.replace(/[^a-z0-9]/gi, "");
export const jobDir = (id: string) => path.join(IMPORT_ROOT, safeId(id));
export const imagesDir = (id: string) => path.join(jobDir(id), "images");

export async function writeRows(id: string, rows: RawRow[]) {
  await mkdir(jobDir(id), { recursive: true });
  await writeFile(path.join(jobDir(id), "rows.json"), JSON.stringify(rows));
}

export async function readRows(id: string): Promise<RawRow[]> {
  return JSON.parse(await readFile(path.join(jobDir(id), "rows.json"), "utf8"));
}

/** Lists ZIP-extracted image files for a job. */
export async function listZipImages(id: string) {
  try {
    return await readdir(imagesDir(id));
  } catch {
    return [];
  }
}

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Files named SKU.jpg, SKU-2.png or SKU_3.webp (case-insensitive), ordered by their number. */
export function filesForSku(files: string[], sku: string) {
  const re = new RegExp(`^${escape(sku)}(?:[-_ ](\\d+))?\\.(jpe?g|png|webp|gif|avif)$`, "i");
  return files
    .map((f) => ({ f, m: f.match(re) }))
    .filter((x) => x.m && IMG_RE.test(x.f))
    .sort((a, b) => Number(a.m![1] ?? 0) - Number(b.m![1] ?? 0))
    .map((x) => x.f);
}
