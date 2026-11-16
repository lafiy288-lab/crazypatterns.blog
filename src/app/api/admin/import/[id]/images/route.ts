import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok } from "@/lib/api";
import { parseJson } from "@/lib/json";
import type { Mapping } from "@/lib/import/fields";
import { filesForSku, imagesDir, readRows } from "@/lib/import/store";

export const runtime = "nodejs";

const MAX_ZIP_BYTES = 20 * 1024 * 1024;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 300 * 1024 * 1024;
const MAX_FILES = 5000;

/** POST multipart (file=.zip): extracts images named after SKUs (SKU.jpg, SKU-2.png …). */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.importJob.findUnique({ where: { id } });
  if (!job) throw new ApiError("Import not found", 404);
  if (!["uploaded", "validated"].includes(job.status)) throw new ApiError("This import has already been run");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError("Please choose a ZIP file");
  if (!/\.zip$/i.test(file.name)) throw new ApiError("Images must be uploaded as a .zip file", 415);
  if (file.size > MAX_ZIP_BYTES) throw new ApiError("ZIP is larger than 20 MB", 413);

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new ApiError("Could not read the ZIP file", 422);
  }
  const dir = imagesDir(id);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const entries = Object.values(zip.files).filter((f) => !f.dir && !f.name.includes("__MACOSX") && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name));
  if (entries.length > MAX_FILES) throw new ApiError(`Too many files in ZIP (max ${MAX_FILES})`);
  let total = 0;
  const names: string[] = [];
  for (const entry of entries) {
    // Only the base name is used, which prevents "zip slip" path traversal.
    const base = path.basename(entry.name).replace(/[^\w.\- ]/g, "_");
    if (!base || base.startsWith(".")) continue;
    const buf = await entry.async("nodebuffer");
    if (buf.length > MAX_FILE_BYTES) continue;
    total += buf.length;
    if (total > MAX_TOTAL_BYTES) throw new ApiError("ZIP contents are too large");
    await writeFile(path.join(dir, base), buf);
    names.push(base);
  }

  const rows = await readRows(id);
  const skuCol = parseJson<Mapping>(job.mapping, {}).sku;
  const skus = skuCol ? rows.map((r) => r[skuCol]).filter(Boolean) : [];
  const matched = skus.filter((s) => filesForSku(names, s).length > 0).length;

  await prisma.importJob.update({ where: { id }, data: { hasImageZip: names.length > 0 } });
  return ok({ files: names.length, matchedSkus: matched, totalSkus: skus.length });
});
