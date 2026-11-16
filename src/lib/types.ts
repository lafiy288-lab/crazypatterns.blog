export type ProductImage = {
  url: string;
  thumb?: string;
  medium?: string;
  large?: string;
  blur?: string;
  alt?: string;
};

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice: number | null;
  discountPercent: number;
  currency: string;
  image: ProductImage | null;
  designerName: string;
  designerSlug: string;
  rating: number;
  reviewCount: number;
  hasVideo: boolean;
  isFree: boolean;
  isNew: boolean;
  isSponsored: boolean;
};

export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export type SiteSettings = {
  siteName: string;
  tagline: string;
  logo: string | null;
  colors: { primary: string; accent: string; background: string; text: string };
  hero: { title: string; subtitle: string };
  counters: { patterns: string; designers: string; downloads: string; rating: string };
  freeBanner: { title: string; text: string };
  footer: FooterColumn[];
};

export type HomepageSections = {
  highlights: string[];
  bestsellers: string[];
  sale: string[];
  newArrivals: string[];
  sponsored: string[];
  free: string[];
};
