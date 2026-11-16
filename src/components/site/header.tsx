import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { getSettings } from "@/lib/settings";
import { HeaderClient, type NavCategory } from "./header-client";

export async function Header() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true, image: true, subcategories: true } }),
  ]);
  const nav: NavCategory[] = categories.map((c) => ({ name: c.name, slug: c.slug, image: c.image, subcategories: parseJson<string[]>(c.subcategories, []) }));
  return <HeaderClient siteName={settings.siteName} tagline={settings.tagline} logo={settings.logo} categories={nav} />;
}
