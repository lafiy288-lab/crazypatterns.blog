import { z } from "zod";
import { DIFFICULTIES } from "./utils";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), "Must be a URL")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const imageSchema = z.object({
  url: z.string().max(2000),
  thumb: z.string().max(2000).optional(),
  medium: z.string().max(2000).optional(),
  large: z.string().max(2000).optional(),
  blur: z.string().max(5000).optional(),
  alt: z.string().max(200).optional(),
});

export const productSchema = z.object({
  title: trimmed(160).min(2, "Title is required"),
  slug: trimmed(120).regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only").optional().default(""),
  sku: trimmed(64).min(1, "SKU is required"),
  description: z.string().max(50000).default(""),
  price: z.coerce.number().min(0).max(100000),
  oldPrice: z.coerce.number().min(0).max(100000).nullable().optional(),
  currency: z.enum(["USD", "EUR"]).default("USD"),
  images: z.array(imageSchema).max(20).default([]),
  categoryId: z.string().min(1, "Category is required"),
  subcategory: trimmed(80).nullable().optional(),
  designerId: z.string().min(1, "Designer is required"),
  difficulty: z.enum(DIFFICULTIES).default("beginner"),
  languages: z.array(trimmed(40)).max(10).default(["English"]),
  fileFormat: trimmed(40).default("PDF"),
  hasVideo: z.boolean().default(false),
  isFree: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isSponsored: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  getPatternUrl: optionalUrl,
  metaTitle: trimmed(70).nullable().optional(),
  metaDescription: trimmed(170).nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});
export type ProductInput = z.infer<typeof productSchema>;

export const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(1000),
  action: z.enum(["publish", "unpublish", "delete", "category", "discount", "flag"]),
  categoryId: z.string().optional(),
  discountPercent: z.coerce.number().int().min(0).max(95).optional(),
  flag: z.enum(["isFree", "isBestseller", "isNew", "isSponsored", "isFeatured", "hasVideo"]).optional(),
  value: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: trimmed(80).min(2),
  slug: trimmed(80).regex(/^[a-z0-9-]*$/).optional().default(""),
  description: trimmed(500).default(""),
  image: optionalUrl,
  subcategories: z.array(trimmed(60)).max(40).default([]),
  sortOrder: z.coerce.number().int().default(0),
});

export const designerSchema = z.object({
  name: trimmed(80).min(2),
  slug: trimmed(80).regex(/^[a-z0-9-]*$/).optional().default(""),
  bio: trimmed(2000).default(""),
  avatar: optionalUrl,
});

export const articleSchema = z.object({
  title: trimmed(160).min(2),
  slug: trimmed(120).regex(/^[a-z0-9-]*$/).optional().default(""),
  excerpt: trimmed(300).default(""),
  cover: optionalUrl,
  content: z.string().max(100000).default(""),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const subscribeSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

export const contactSchema = z.object({
  name: trimmed(100).min(2, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email").max(200),
  subject: trimmed(150).default(""),
  body: trimmed(5000).min(10, "Message should be at least 10 characters"),
  productId: z.string().max(40).optional().nullable(),
  // Honeypot: real users leave this empty
  website: z.string().max(0).optional().default(""),
});

export const reviewSchema = z.object({
  productId: z.string().min(1).max(40),
  name: trimmed(60).min(2, "Please enter your name"),
  rating: z.coerce.number().int().min(1).max(5),
  text: trimmed(2000).min(10, "Review should be at least 10 characters"),
  website: z.string().max(0).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #0F766E");

export const settingsSchema = z.object({
  siteName: trimmed(60).min(1),
  tagline: trimmed(120),
  logo: z.string().max(2000).nullable(),
  colors: z.object({ primary: hex, accent: hex, background: hex, text: hex }),
  hero: z.object({ title: trimmed(120), subtitle: trimmed(200) }),
  counters: z.object({ patterns: trimmed(20), designers: trimmed(20), downloads: trimmed(20), rating: trimmed(20) }),
  freeBanner: z.object({ title: trimmed(80), text: trimmed(300) }),
  footer: z
    .array(
      z.object({
        title: trimmed(40),
        links: z.array(z.object({ label: trimmed(60), href: trimmed(500) })).max(12),
      }),
    )
    .max(6),
});

export const homepageSchema = z.object({
  highlights: z.array(z.string()).max(24),
  bestsellers: z.array(z.string()).max(24),
  sale: z.array(z.string()).max(24),
  newArrivals: z.array(z.string()).max(24),
  sponsored: z.array(z.string()).max(24),
  free: z.array(z.string()).max(24),
});
