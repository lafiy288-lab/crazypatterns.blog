import { prisma } from "./db";
import { parseJson } from "./json";

export async function productFormOptions() {
  const [categories, designers] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, subcategories: true } }),
    prisma.designer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories: categories.map((c) => ({ ...c, subcategories: parseJson<string[]>(c.subcategories, []) })), designers };
}
