// Import columns, their synonyms for auto-mapping, and helpers shared by client and server.

export type ImportField = { key: string; label: string; required?: boolean; synonyms: string[] };

export const IMPORT_FIELDS: ImportField[] = [
  { key: "sku", label: "SKU", required: true, synonyms: ["sku", "article", "articlenumber", "productcode", "code", "itemnumber", "id"] },
  { key: "title", label: "Title", required: true, synonyms: ["title", "name", "productname", "patternname", "product"] },
  { key: "description", label: "Description", synonyms: ["description", "desc", "body", "details", "longdescription"] },
  { key: "category", label: "Category", required: true, synonyms: ["category", "craft", "categoryname", "type"] },
  { key: "subcategory", label: "Subcategory", synonyms: ["subcategory", "sub", "subcategoryname", "subtype"] },
  { key: "designer", label: "Designer", synonyms: ["designer", "author", "designername", "creator", "brand", "vendor"] },
  { key: "price", label: "Price", synonyms: ["price", "saleprice", "currentprice", "amount"] },
  { key: "old_price", label: "Old price", synonyms: ["oldprice", "compareatprice", "regularprice", "originalprice", "listprice", "wasprice"] },
  { key: "currency", label: "Currency", synonyms: ["currency", "cur"] },
  { key: "is_free", label: "Is free", synonyms: ["isfree", "free"] },
  { key: "difficulty", label: "Difficulty", synonyms: ["difficulty", "level", "skilllevel", "skill"] },
  { key: "language", label: "Language(s)", synonyms: ["language", "languages", "lang"] },
  { key: "file_format", label: "File format", synonyms: ["fileformat", "format", "filetype"] },
  { key: "has_video", label: "Has video", synonyms: ["hasvideo", "video", "withvideo"] },
  { key: "image_urls", label: "Image URLs", synonyms: ["imageurls", "images", "image", "imageurl", "photos", "pictures"] },
  { key: "get_pattern_url", label: "Get Pattern URL", synonyms: ["getpatternurl", "patternurl", "url", "link", "buyurl", "externalurl"] },
  { key: "is_bestseller", label: "Bestseller", synonyms: ["isbestseller", "bestseller"] },
  { key: "is_new", label: "New", synonyms: ["isnew", "new"] },
  { key: "is_sponsored", label: "Sponsored", synonyms: ["issponsored", "sponsored", "ad"] },
  { key: "status", label: "Status", synonyms: ["status", "state", "published"] },
  { key: "rating", label: "Rating", synonyms: ["rating", "stars", "averagerating"] },
  { key: "review_count", label: "Review count", synonyms: ["reviewcount", "reviews", "numreviews", "ratingcount"] },
];

export const TEMPLATE_HEADERS = IMPORT_FIELDS.map((f) => f.key);

export type Mapping = Record<string, string>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Maps each import field to the first matching column header (case/punctuation-insensitive). */
export function autoMap(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const used = new Set<string>();
  for (const field of IMPORT_FIELDS) {
    const candidates = [norm(field.key), ...field.synonyms];
    const header = headers.find((h) => !used.has(h) && candidates.includes(norm(h)));
    if (header) {
      mapping[field.key] = header;
      used.add(header);
    }
  }
  return mapping;
}
