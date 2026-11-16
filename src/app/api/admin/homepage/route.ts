import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, parseBody } from "@/lib/api";
import { parseJson } from "@/lib/json";
import { revalidatePublic } from "@/lib/revalidate";
import { getHomepageSections, getSettings, saveSetting } from "@/lib/settings";
import type { ProductImage } from "@/lib/types";
import { homepageSchema, settingsSchema } from "@/lib/validation";

/** Homepage manager: hand-picked products per section + hero text + counters. */
export const GET = handle(async () => {
  await requireAdmin();
  const [sections, settings] = await Promise.all([getHomepageSections(), getSettings()]);
  const ids = [...new Set(Object.values(sections).flat())];
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, sku: true, status: true, images: true } });
  const products = Object.fromEntries(rows.map((r) => [r.id, { id: r.id, title: r.title, sku: r.sku, status: r.status, image: parseJson<ProductImage[]>(r.images, [])[0] ?? null }]));
  return ok({ sections, products, hero: settings.hero, counters: settings.counters, freeBanner: settings.freeBanner });
});

const bodySchema = z.object({
  sections: homepageSchema,
  hero: settingsSchema.shape.hero,
  counters: settingsSchema.shape.counters,
  freeBanner: settingsSchema.shape.freeBanner,
});

export const PUT = handle(async (req: Request) => {
  await requireAdmin();
  const body = await parseBody(req, bodySchema);
  const settings = await getSettings();
  await saveSetting("homepage", body.sections);
  await saveSetting("site", { ...settings, hero: body.hero, counters: body.counters, freeBanner: body.freeBanner });
  revalidatePublic();
  return ok({ ok: true });
});
