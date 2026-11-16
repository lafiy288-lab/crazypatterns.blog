import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { parseJson } from "./json";
import type { ProductCardData, ProductImage } from "./types";

export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  oldPrice: true,
  discountPercent: true,
  currency: true,
  images: true,
  rating: true,
  reviewCount: true,
  hasVideo: true,
  isFree: true,
  isNew: true,
  isSponsored: true,
  designer: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function toCard(p: CardRow): ProductCardData {
  const images = parseJson<ProductImage[]>(p.images, []);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    oldPrice: p.oldPrice,
    discountPercent: p.discountPercent,
    currency: p.currency,
    image: images[0] ?? null,
    designerName: p.designer.name,
    designerSlug: p.designer.slug,
    rating: p.rating,
    reviewCount: p.reviewCount,
    hasVideo: p.hasVideo,
    isFree: p.isFree,
    isNew: p.isNew,
    isSponsored: p.isSponsored,
  };
}

export const PUBLISHED = { status: "published" } as const;

export type ProductQuery = {
  q?: string;
  category?: string;
  sub?: string;
  designer?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  free?: "free" | "paid";
  video?: boolean;
  language?: string;
  difficulty?: string;
  sale?: boolean;
  flag?: "bestseller" | "new" | "sponsored" | "featured";
  sort?: string;
  page?: number;
  perPage?: number;
};

export const SORTS = {
  popular: { label: "Most popular", orderBy: [{ reviewCount: "desc" }, { rating: "desc" }] },
  newest: { label: "Newest", orderBy: [{ createdAt: "desc" }] },
  "price-asc": { label: "Price: low to high", orderBy: [{ price: "asc" }] },
  "price-desc": { label: "Price: high to low", orderBy: [{ price: "desc" }] },
  rating: { label: "Top rated", orderBy: [{ rating: "desc" }, { reviewCount: "desc" }] },
} as const satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }>;

export function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [PUBLISHED];
  if (query.q) {
    // Every search term must match the title, description, subcategory, designer or category.
    // On Postgres this can be swapped for a tsvector full-text index (see README).
    const terms = query.q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const term of terms) {
      // Postgres `contains` is case-sensitive unless mode is "insensitive".
      const match = { contains: term, mode: "insensitive" as const };
      and.push({
        OR: [
          { title: match },
          { description: match },
          { subcategory: match },
          { sku: { equals: term, mode: "insensitive" } },
          { designer: { name: match } },
          { category: { name: match } },
        ],
      });
    }
  }
  if (query.category) and.push({ category: { slug: query.category } });
  if (query.sub) and.push({ subcategory: query.sub });
  if (query.designer) and.push({ designer: { slug: query.designer } });
  if (query.minPrice != null && !Number.isNaN(query.minPrice)) and.push({ price: { gte: query.minPrice } });
  if (query.maxPrice != null && !Number.isNaN(query.maxPrice)) and.push({ price: { lte: query.maxPrice } });
  if (query.rating) and.push({ rating: { gte: query.rating } });
  if (query.free === "free") and.push({ isFree: true });
  if (query.free === "paid") and.push({ isFree: false });
  if (query.video) and.push({ hasVideo: true });
  if (query.language) and.push({ languages: { contains: `"${query.language}"` } });
  if (query.difficulty) and.push({ difficulty: query.difficulty });
  if (query.sale) and.push({ discountPercent: { gt: 0 } });
  if (query.flag === "bestseller") and.push({ isBestseller: true });
  if (query.flag === "new") and.push({ isNew: true });
  if (query.flag === "sponsored") and.push({ isSponsored: true });
  if (query.flag === "featured") and.push({ isFeatured: true });
  return { AND: and };
}

export async function listProducts(query: ProductQuery) {
  const perPage = Math.min(Math.max(query.perPage ?? 24, 1), 60);
  const page = Math.max(query.page ?? 1, 1);
  const where = buildWhere(query);
  const sort = SORTS[(query.sort as keyof typeof SORTS) ?? "popular"] ?? SORTS.popular;
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [...sort.orderBy, { id: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardSelect,
    }),
  ]);
  return { items: rows.map(toCard), total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Parses URL search params (from pages or API routes) into a ProductQuery. */
export function queryFromParams(sp: Record<string, string | string[] | undefined> | URLSearchParams): ProductQuery {
  const get = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? undefined;
  };
  const num = (k: string) => {
    const v = get(k);
    return v !== undefined && v !== "" ? Number(v) : undefined;
  };
  const free = get("free");
  const flag = get("flag");
  return {
    q: get("q")?.slice(0, 100),
    category: get("category"),
    sub: get("sub"),
    designer: get("designer"),
    minPrice: num("min"),
    maxPrice: num("max"),
    rating: num("rating"),
    free: free === "free" || free === "paid" ? free : undefined,
    video: get("video") === "1",
    language: get("lang"),
    difficulty: get("difficulty"),
    sale: get("sale") === "1",
    flag: flag === "bestseller" || flag === "new" || flag === "sponsored" || flag === "featured" ? flag : undefined,
    sort: get("sort"),
    page: num("page"),
    perPage: num("perPage"),
  };
}

/** Loads cards by id keeping the given order (used by the homepage manager and favorites). */
export async function cardsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids }, ...PUBLISHED }, select: cardSelect });
  const map = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => map.get(id)).filter(Boolean) as ProductCardData[];
}

/** Uses the admin's hand-picked list for a homepage section, topped up by a fallback query. */
export async function sectionCards(pinned: string[], fallback: Prisma.ProductWhereInput, take: number, orderBy: Prisma.ProductOrderByWithRelationInput[]) {
  const picked = await cardsByIds(pinned.slice(0, take));
  if (picked.length >= take) return picked;
  const rest = await prisma.product.findMany({
    where: { AND: [PUBLISHED, fallback, { id: { notIn: picked.map((p) => p.id) } }] },
    orderBy,
    take: take - picked.length,
    select: cardSelect,
  });
  return [...picked, ...rest.map(toCard)];
}
