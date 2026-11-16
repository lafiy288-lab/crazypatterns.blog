import type { Mapping } from "./fields";
import type { RawRow } from "./store";

export type RowError = { row: number; sku: string; field: string; message: string };

export type NormalizedRow = {
  sku: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  designer: string;
  price: number;
  oldPrice: number | null;
  currency: "USD" | "EUR";
  isFree: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  languages: string[];
  fileFormat: string;
  hasVideo: boolean;
  imageUrls: string[];
  getPatternUrl: string | null;
  isBestseller: boolean;
  isNew: boolean;
  isSponsored: boolean;
  status: "draft" | "published";
  rating: number;
  reviewCount: number;
};

export const DEFAULT_DESIGNER = "Independent Designer";

/** Spreadsheet line number for a 0-based data row (row 1 is the header). */
export const lineOf = (index: number) => index + 2;

const TRUE = ["true", "yes", "y", "1", "x", "ja", "oui", "si"];
const FALSE = ["false", "no", "n", "0", "nein", "non", ""];

/** Validates and normalizes one raw row using the column mapping. */
export function normalizeRow(raw: RawRow, mapping: Mapping, index: number): { row: NormalizedRow | null; errors: RowError[] } {
  const get = (key: string) => (mapping[key] ? (raw[mapping[key]] ?? "").toString().trim() : "");
  const sku = get("sku");
  const errors: RowError[] = [];
  const err = (field: string, message: string) => errors.push({ row: lineOf(index), sku, field, message });

  const bool = (key: string) => {
    const v = get(key).toLowerCase();
    if (TRUE.includes(v)) return true;
    if (FALSE.includes(v)) return false;
    err(key, `"${get(key)}" is not yes/no`);
    return false;
  };
  const num = (key: string, opts: { min?: number; max?: number; required?: boolean } = {}) => {
    const v = get(key);
    if (!v) {
      if (opts.required) err(key, "is required");
      return null;
    }
    let s = v.replace(/[^\d.,-]/g, "");
    if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
    const n = Number(s);
    if (!s || Number.isNaN(n)) {
      err(key, `"${v}" is not a number`);
      return null;
    }
    if (opts.min !== undefined && n < opts.min) err(key, `must be at least ${opts.min}`);
    if (opts.max !== undefined && n > opts.max) err(key, `must be at most ${opts.max}`);
    return n;
  };

  if (!sku) err("sku", "is required");
  else if (sku.length > 64) err("sku", "is longer than 64 characters");
  else if (!/^[\w.\- ]+$/.test(sku)) err("sku", "may only contain letters, numbers, spaces, dot, dash and underscore");
  const title = get("title");
  if (!title) err("title", "is required");
  else if (title.length > 160) err("title", "is longer than 160 characters");
  const category = get("category");
  if (!category) err("category", "is required");

  const isFree = bool("is_free");
  const price = num("price", { min: 0, max: 100000, required: !isFree }) ?? 0;
  const oldPrice = num("old_price", { min: 0, max: 100000 });

  const currencyRaw = get("currency").toUpperCase() || "USD";
  if (!["USD", "EUR"].includes(currencyRaw)) err("currency", `"${currencyRaw}" must be USD or EUR`);

  const diffRaw = get("difficulty").toLowerCase() || "beginner";
  const difficulty = ({ easy: "beginner", medium: "intermediate", hard: "advanced", expert: "advanced" } as Record<string, string>)[diffRaw] ?? diffRaw;
  if (!["beginner", "intermediate", "advanced"].includes(difficulty)) err("difficulty", `"${diffRaw}" must be beginner, intermediate or advanced`);

  const statusRaw = get("status").toLowerCase() || "published";
  if (!["draft", "published"].includes(statusRaw)) err("status", `"${statusRaw}" must be draft or published`);

  const imageUrls = get("image_urls").split(/[|\n]/).map((s) => s.trim()).filter(Boolean);
  for (const u of imageUrls) {
    if (!/^https?:\/\//i.test(u) && !u.startsWith("/")) err("image_urls", `"${u.slice(0, 60)}" is not an http(s) URL or /path`);
  }
  if (imageUrls.length > 10) err("image_urls", "max 10 images per product");

  const getPatternUrl = get("get_pattern_url") || null;
  if (getPatternUrl && !/^https?:\/\/[^\s]+$/i.test(getPatternUrl)) err("get_pattern_url", "must be an http(s) URL");

  const languages = get("language").split(/[|,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 10);
  const rating = num("rating", { min: 0, max: 5 }) ?? 0;
  const reviewCount = num("review_count", { min: 0 }) ?? 0;
  const hasVideo = bool("has_video");
  const isBestseller = bool("is_bestseller");
  const isNew = bool("is_new");
  const isSponsored = bool("is_sponsored");

  if (errors.length) return { row: null, errors };
  return {
    errors,
    row: {
      sku,
      title,
      description: get("description"),
      category: category.slice(0, 80),
      subcategory: get("subcategory").slice(0, 80) || null,
      designer: get("designer").slice(0, 80) || DEFAULT_DESIGNER,
      price: isFree ? 0 : Math.round(price * 100) / 100,
      oldPrice: !isFree && oldPrice && oldPrice > price ? Math.round(oldPrice * 100) / 100 : null,
      currency: currencyRaw as "USD" | "EUR",
      isFree: isFree || price === 0,
      difficulty: difficulty as NormalizedRow["difficulty"],
      languages: languages.length ? languages : ["English"],
      fileFormat: get("file_format").slice(0, 40) || "PDF",
      hasVideo,
      imageUrls,
      getPatternUrl,
      isBestseller,
      isNew,
      isSponsored,
      status: statusRaw as NormalizedRow["status"],
      rating: Math.round(rating * 10) / 10,
      reviewCount: Math.round(reviewCount),
    },
  };
}

/** Validates every row, including duplicate SKUs inside the file. */
export function validateAll(rows: RawRow[], mapping: Mapping) {
  const seen = new Map<string, number>();
  const errors: RowError[] = [];
  const results = rows.map((raw, i) => {
    const res = normalizeRow(raw, mapping, i);
    if (res.row) {
      const key = res.row.sku.toLowerCase();
      if (seen.has(key)) {
        const e = { row: lineOf(i), sku: res.row.sku, field: "sku", message: `duplicate SKU in file (first seen on line ${seen.get(key)})` };
        res.errors.push(e);
        res.row = null;
      } else seen.set(key, lineOf(i));
    }
    errors.push(...res.errors);
    return res;
  });
  return { results, errors };
}

export function errorsToCsv(errors: RowError[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return ["line,sku,field,message", ...errors.map((e) => [e.row, e.sku, e.field, e.message].map(esc).join(","))].join("\n");
}
