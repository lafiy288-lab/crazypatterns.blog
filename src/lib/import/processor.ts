import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import { processImage, removeImage } from "@/lib/images";
import { parseJson } from "@/lib/json";
import { revalidatePublic } from "@/lib/revalidate";
import { sanitizeRichText } from "@/lib/sanitize";
import type { ProductImage } from "@/lib/types";
import { discountFrom, slugify, stripHtml, truncate } from "@/lib/utils";
import type { Mapping } from "./fields";
import { loadImageSource } from "./fetch-image";
import { filesForSku, imagesDir, listZipImages, readRows } from "./store";
import { lineOf, normalizeRow, type NormalizedRow, type RowError } from "./validate";

export const BATCH_SIZE = 100;
const IMAGE_CONCURRENCY = 4;
const MAX_STORED_ERRORS = 5000;

export type ImportOptions = { duplicateMode: "skip" | "update"; asDraft: boolean };
export type ImageFailure = { row: number; sku: string; url: string; error: string };
type Snapshot = { id: string; data: Omit<Product, "id" | "createdAt" | "updatedAt"> };
type CreatedRefs = { categories: string[]; designers: string[] };

// Registry of running jobs (one runner per job per process) and jobs whose
// public pages still need revalidating from inside a request context.
const g = globalThis as unknown as { __importRunning?: Set<string>; __importRevalidate?: Set<string> };
const running = (g.__importRunning ??= new Set());
const pendingRevalidate = (g.__importRevalidate ??= new Set());

export const isRunning = (id: string) => running.has(id);

/** Called from request handlers: revalidates ISR pages if a background job finished since. */
export function flushRevalidation() {
  if (!pendingRevalidate.size) return;
  try {
    revalidatePublic();
    pendingRevalidate.clear();
  } catch {
    /* not in a request context – try again on the next request */
  }
}

function tryRevalidate(jobId: string) {
  try {
    revalidatePublic();
  } catch {
    pendingRevalidate.add(jobId);
  }
}

/** Runs `fn` over items with at most `limit` in flight. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/** Starts a background import if it isn't already running. Returns immediately. */
export function startImport(jobId: string) {
  if (running.has(jobId)) return false;
  running.add(jobId);
  void runImport(jobId)
    .catch(async (e) => {
      console.error("Import failed", e);
      await prisma.importJob
        .update({ where: { id: jobId }, data: { status: "failed", finishedAt: new Date(), errors: JSON.stringify([{ row: 0, sku: "", field: "job", message: (e as Error).message }]) } })
        .catch(() => undefined);
    })
    .finally(() => running.delete(jobId));
  return true;
}

async function runImport(jobId: string) {
  const job = await prisma.importJob.findUniqueOrThrow({ where: { id: jobId } });
  const mapping = parseJson<Mapping>(job.mapping, {});
  const options = parseJson<ImportOptions>(job.options, { duplicateMode: "skip", asDraft: false });
  const rows = await readRows(jobId);
  const zipFiles = job.hasImageZip ? await listZipImages(jobId) : [];

  const counts = { created: 0, updated: 0, skipped: 0, failed: 0 };
  const errors: RowError[] = [];
  const imageFailures: ImageFailure[] = [];
  const createdIds: string[] = [];
  const snapshots: Snapshot[] = [];
  const createdRefs: CreatedRefs = { categories: [], designers: [] };
  const seenSkus = new Set<string>();
  const reservedSlugs = new Set<string>();

  // Lookup tables for categories/designers (by slug and by slugified name).
  const catMap = new Map<string, string>();
  for (const c of await prisma.category.findMany({ select: { id: true, slug: true, name: true } })) {
    catMap.set(c.slug, c.id);
    catMap.set(slugify(c.name), c.id);
  }
  const desMap = new Map<string, string>();
  for (const d of await prisma.designer.findMany({ select: { id: true, slug: true, name: true } })) {
    desMap.set(d.slug, d.id);
    desMap.set(slugify(d.name), d.id);
  }
  let sortOrder = (await prisma.category.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;

  const categoryId = async (name: string, sub: string | null) => {
    const key = slugify(name);
    let id = catMap.get(key);
    if (!id) {
      const c = await prisma.category.create({ data: { name, slug: await uniqueSlug("category", key || "category"), sortOrder: ++sortOrder, subcategories: JSON.stringify(sub ? [sub] : []) } });
      id = c.id;
      catMap.set(key, id);
      createdRefs.categories.push(id);
    } else if (sub) {
      const c = await prisma.category.findUnique({ where: { id }, select: { subcategories: true } });
      const subs = parseJson<string[]>(c?.subcategories, []);
      if (!subs.some((s) => s.toLowerCase() === sub.toLowerCase())) await prisma.category.update({ where: { id }, data: { subcategories: JSON.stringify([...subs, sub]) } });
    }
    return id;
  };
  const designerId = async (name: string) => {
    const key = slugify(name);
    let id = desMap.get(key);
    if (!id) {
      const d = await prisma.designer.create({ data: { name, slug: await uniqueSlug("designer", key || "designer") } });
      id = d.id;
      desMap.set(key, id);
      createdRefs.designers.push(id);
    }
    return id;
  };

  // Each source URL/file is processed once per job and reused across rows.
  const imageCache = new Map<string, Promise<ProductImage>>();
  const processSource = (src: string, sku: string) => {
    let p = imageCache.get(src);
    if (!p) {
      p = (async () => {
        const buf = src.startsWith("zip:") ? await readFile(path.join(imagesDir(jobId), src.slice(4))) : await loadImageSource(src);
        return processImage(buf, sku);
      })();
      imageCache.set(src, p);
    }
    return p;
  };

  const resolveImages = async (row: NormalizedRow, line: number): Promise<ProductImage[]> => {
    const zip = filesForSku(zipFiles, row.sku).map((f) => `zip:${f}`);
    const sources = (zip.length ? zip : row.imageUrls).slice(0, 10);
    const out: ProductImage[] = [];
    for (const [i, src] of sources.entries()) {
      try {
        const img = await processSource(src, row.sku);
        out.push({ ...img, alt: `${row.title} – image ${i + 1}` });
      } catch (e) {
        imageFailures.push({ row: line, sku: row.sku, url: src.replace(/^zip:/, "ZIP: "), error: (e as Error).message });
      }
    }
    return out;
  };

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);

    // 1) Validate and fetch/convert images concurrently (the slow part).
    const prepared = await pool(batch, IMAGE_CONCURRENCY, async (raw, j) => {
      const index = start + j;
      const { row, errors: rowErrors } = normalizeRow(raw, mapping, index);
      if (!row) return { index, row: null, rowErrors, images: [] as ProductImage[] };
      return { index, row, rowErrors, images: await resolveImages(row, lineOf(index)) };
    });

    // 2) Write to the database sequentially (keeps slugs and auto-created refs race-free).
    for (const item of prepared) {
      const line = lineOf(item.index);
      if (!item.row) {
        counts.failed++;
        errors.push(...item.rowErrors);
        continue;
      }
      const row = item.row;
      const skuKey = row.sku.toLowerCase();
      if (seenSkus.has(skuKey)) {
        counts.skipped++;
        errors.push({ row: line, sku: row.sku, field: "sku", message: "duplicate SKU in file – skipped" });
        continue;
      }
      seenSkus.add(skuKey);

      try {
        const existing =
          (await prisma.product.findUnique({ where: { sku: row.sku } })) ??
          (options.duplicateMode === "update" ? await prisma.product.findUnique({ where: { slug: slugify(row.title) } }) : null);

        if (existing && options.duplicateMode === "skip") {
          counts.skipped++;
          continue;
        }

        const [catId, desId] = [await categoryId(row.category, row.subcategory), await designerId(row.designer)];
        const description = sanitizeRichText(row.description.includes("<") ? row.description : row.description.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join(""));
        const plain = stripHtml(description);
        const data = {
          sku: row.sku,
          title: row.title,
          description,
          price: row.price,
          oldPrice: row.oldPrice,
          currency: row.currency,
          discountPercent: discountFrom(row.price, row.oldPrice),
          categoryId: catId,
          subcategory: row.subcategory,
          designerId: desId,
          difficulty: row.difficulty,
          languages: JSON.stringify(row.languages),
          fileFormat: row.fileFormat,
          hasVideo: row.hasVideo,
          isFree: row.isFree,
          isBestseller: row.isBestseller,
          isNew: row.isNew,
          isSponsored: row.isSponsored,
          rating: row.rating,
          reviewCount: row.reviewCount,
          getPatternUrl: row.getPatternUrl,
          metaTitle: truncate(`${row.title} – ${row.category} Pattern`, 70),
          metaDescription: truncate(plain || `Download the ${row.title} ${row.category.toLowerCase()} pattern by ${row.designer}.`, 160),
          status: options.asDraft ? "draft" : row.status,
          importJobId: jobId,
        };

        if (existing) {
          const { id, createdAt: _c, updatedAt: _u, ...snapshot } = existing;
          snapshots.push({ id, data: snapshot });
          await prisma.product.update({ where: { id }, data: { ...data, ...(item.images.length ? { images: JSON.stringify(item.images) } : {}) } });
          counts.updated++;
        } else {
          const slug = await uniqueSlug("product", slugify(row.title) || slugify(row.sku), reservedSlugs);
          const p = await prisma.product.create({ data: { ...data, slug, images: JSON.stringify(item.images) } });
          createdIds.push(p.id);
          counts.created++;
        }
      } catch (e) {
        counts.failed++;
        const msg = (e as Error).message.split("\n").filter(Boolean).pop() ?? "Database error";
        errors.push({ row: line, sku: row.sku, field: "row", message: msg.slice(0, 300) });
      }
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        processedRows: Math.min(start + BATCH_SIZE, rows.length),
        ...counts,
        errors: JSON.stringify(errors.slice(0, MAX_STORED_ERRORS)),
        imageFailures: JSON.stringify(imageFailures.slice(0, MAX_STORED_ERRORS)),
        createdIds: JSON.stringify(createdIds),
        snapshots: JSON.stringify(snapshots),
        createdRefs: JSON.stringify(createdRefs),
      },
    });
  }

  await prisma.importJob.update({ where: { id: jobId }, data: { status: "completed", finishedAt: new Date() } });
  tryRevalidate(jobId);
}

async function uniqueSlug(kind: "product" | "category" | "designer", base: string, reserved?: Set<string>) {
  const root = base.slice(0, 70) || kind;
  for (let n = 1; n < 10_000; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    if (reserved?.has(candidate)) continue;
    const taken =
      kind === "product"
        ? await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } })
        : kind === "category"
          ? await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } })
          : await prisma.designer.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) {
      reserved?.add(candidate);
      return candidate;
    }
  }
  return `${root}-${Date.now()}`;
}

/** Undoes an import: restores updated products, deletes created ones and unused auto-created refs. */
export async function rollbackImport(jobId: string) {
  const job = await prisma.importJob.findUniqueOrThrow({ where: { id: jobId } });
  const snapshots = parseJson<Snapshot[]>(job.snapshots, []);
  const createdIds = parseJson<string[]>(job.createdIds, []);
  const refs = parseJson<CreatedRefs>(job.createdRefs, { categories: [], designers: [] });

  const keepUrls = new Set<string>();
  for (const s of snapshots) for (const img of parseJson<ProductImage[]>(s.data.images, [])) [img.url, img.thumb, img.medium, img.large].forEach((u) => u && keepUrls.add(u));

  let restored = 0;
  for (const s of snapshots.reverse()) {
    const res = await prisma.product.updateMany({ where: { id: s.id }, data: s.data });
    restored += res.count;
  }

  const created = await prisma.product.findMany({ where: { id: { in: createdIds } }, select: { id: true, images: true } });
  const deleted = await prisma.product.deleteMany({ where: { id: { in: createdIds } } });
  for (const p of created) {
    for (const img of parseJson<ProductImage[]>(p.images, [])) {
      if (img.url?.startsWith("/placeholders/") || keepUrls.has(img.url)) continue;
      await removeImage(img).catch(() => undefined);
    }
  }

  const delCats = await prisma.category.deleteMany({ where: { id: { in: refs.categories }, products: { none: {} } } });
  const delDes = await prisma.designer.deleteMany({ where: { id: { in: refs.designers }, products: { none: {} } } });

  await prisma.importJob.update({ where: { id: jobId }, data: { status: "rolled_back" } });
  tryRevalidate(jobId);
  return { deleted: deleted.count, restored, categoriesDeleted: delCats.count, designersDeleted: delDes.count };
}
