import { cache } from "react";
import { prisma } from "./db";
import { parseJson } from "./json";
import type { HomepageSections, SiteSettings } from "./types";

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "PatternNest",
  tagline: "Your creative ideas",
  logo: null,
  colors: { primary: "#0F766E", accent: "#F97316", background: "#FFFBF5", text: "#1E293B" },
  hero: { title: "Everything for Your Craft", subtitle: "Patterns, Tutorials, Videos & Courses" },
  counters: { patterns: "117,900+", designers: "3,300+", downloads: "53M+", rating: "4.8★" },
  freeBanner: {
    title: "4,300+ Free Patterns",
    text: "Try a new technique without spending a cent. Fresh free patterns from our designers every week.",
  },
  footer: [
    {
      title: "Crochet",
      links: [
        { label: "Amigurumi", href: "/category/crochet?sub=Amigurumi" },
        { label: "Blankets", href: "/category/crochet?sub=Blankets" },
        { label: "Flowers", href: "/search?q=crochet+flowers" },
        { label: "Free crochet patterns", href: "/free-patterns?category=crochet" },
      ],
    },
    {
      title: "Knitting",
      links: [
        { label: "Sweaters", href: "/category/knitting?sub=Sweaters" },
        { label: "Socks", href: "/category/knitting?sub=Socks" },
        { label: "Shawls", href: "/category/knitting?sub=Shawls" },
        { label: "Free knitting patterns", href: "/free-patterns?category=knitting" },
      ],
    },
    {
      title: "Sewing",
      links: [
        { label: "Bags", href: "/category/sewing?sub=Bags" },
        { label: "Dresses", href: "/category/sewing?sub=Dresses" },
        { label: "Kids", href: "/category/sewing?sub=Kids" },
        { label: "Patterns with video", href: "/search?video=1" },
      ],
    },
    {
      title: "Crafts",
      links: [
        { label: "Embroidery", href: "/category/embroidery" },
        { label: "Felting", href: "/category/felting" },
        { label: "Paper & decor", href: "/category/crafts" },
        { label: "Articles", href: "/articles" },
      ],
    },
    {
      title: "Help & Support",
      links: [
        { label: "Contact us", href: "/contact" },
        { label: "Your favorites", href: "/favorites" },
        { label: "Free patterns", href: "/free-patterns" },
        { label: "Sitemap", href: "/sitemap.xml" },
      ],
    },
  ],
};

export const EMPTY_HOMEPAGE: HomepageSections = {
  highlights: [],
  bestsellers: [],
  sale: [],
  newArrivals: [],
  sponsored: [],
  free: [],
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await prisma.setting.findUnique({ where: { key: "site" } }).catch(() => null);
  const saved = parseJson<Partial<SiteSettings>>(row?.value, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    colors: { ...DEFAULT_SETTINGS.colors, ...saved.colors },
    hero: { ...DEFAULT_SETTINGS.hero, ...saved.hero },
    counters: { ...DEFAULT_SETTINGS.counters, ...saved.counters },
    freeBanner: { ...DEFAULT_SETTINGS.freeBanner, ...saved.freeBanner },
    footer: saved.footer?.length ? saved.footer : DEFAULT_SETTINGS.footer,
  };
});

export const getHomepageSections = cache(async (): Promise<HomepageSections> => {
  const row = await prisma.setting.findUnique({ where: { key: "homepage" } }).catch(() => null);
  return { ...EMPTY_HOMEPAGE, ...parseJson<Partial<HomepageSections>>(row?.value, {}) };
});

export async function saveSetting(key: string, value: unknown) {
  const json = JSON.stringify(value);
  await prisma.setting.upsert({ where: { key }, create: { key, value: json }, update: { value: json } });
}

/** "#0F766E" -> "15 118 110" for use in CSS rgb() variables. */
export function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function darken(hex: string, amount = 0.18) {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  return `${f((n >> 16) & 255)} ${f((n >> 8) & 255)} ${f(n & 255)}`;
}
