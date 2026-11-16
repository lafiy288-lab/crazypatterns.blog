import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const absoluteUrl = (path = "/") => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

export const EUR_RATE = Number(process.env.NEXT_PUBLIC_EUR_RATE || 0.92);

export function formatMoney(amount: number, currency: "USD" | "EUR" = "USD") {
  const value = currency === "EUR" ? amount * EUR_RATE : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function discountFrom(price: number, oldPrice?: number | null) {
  if (!oldPrice || oldPrice <= price || oldPrice <= 0) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(date));
}

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const LANGUAGES = ["English", "German", "French", "Spanish", "Dutch", "Italian"] as const;
