import { prisma } from "@/lib/db";
import { getHomepageSections, getSettings } from "@/lib/settings";
import { sectionCards, PUBLISHED } from "@/lib/products";
import { Hero } from "@/components/home/hero";
import { ProductSection } from "@/components/home/product-section";
import { FreeBanner } from "@/components/home/free-banner";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { InfoBoxes } from "@/components/home/info-boxes";
import { WhySection } from "@/components/home/why-section";
import { Newsletter } from "@/components/home/newsletter";

// ISR: regenerated at most every 5 minutes, and immediately when the admin saves changes.
export const revalidate = 300;

export default async function HomePage() {
  const [settings, sections, categories] = await Promise.all([
    getSettings(),
    getHomepageSections(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      take: 6,
      select: { name: true, slug: true, image: true, _count: { select: { products: { where: PUBLISHED } } } },
    }),
  ]);

  const [highlights, bestsellers, sale, newArrivals, sponsored, free, reviews] = await Promise.all([
    sectionCards(sections.highlights, { isFeatured: true }, 8, [{ rating: "desc" }]),
    sectionCards(sections.bestsellers, { isBestseller: true }, 8, [{ reviewCount: "desc" }]),
    sectionCards(sections.sale, { discountPercent: { gt: 0 }, isFree: false }, 4, [{ discountPercent: "desc" }]),
    sectionCards(sections.newArrivals, { isNew: true }, 8, [{ createdAt: "desc" }]),
    sectionCards(sections.sponsored, { isSponsored: true }, 8, [{ updatedAt: "desc" }]),
    sectionCards(sections.free, { isFree: true }, 4, [{ reviewCount: "desc" }]),
    prisma.review.findMany({
      where: { status: "approved", rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: { id: true, name: true, rating: true, text: true, product: { select: { title: true, slug: true } } },
    }),
  ]);

  return (
    <>
      <Hero title={settings.hero.title} subtitle={settings.hero.subtitle} categories={categories.map((c) => ({ ...c, count: c._count.products }))} />
      <ProductSection id="highlights" title="Craft Highlights" subtitle="A personal selection tailored to what might interest you" products={highlights} />
      <ProductSection id="bestsellers" title="Current Bestsellers" href="/search?flag=bestseller" linkLabel="All bestsellers" products={bestsellers} />
      <ProductSection id="sale" title="On Sale, Save now!" href="/search?sale=1" linkLabel="All deals" products={sale} />
      <ProductSection id="new" title="New Arrivals" href="/search?flag=new&sort=newest" linkLabel="All new arrivals" products={newArrivals} />
      <ProductSection id="sponsored" title="Sponsored Products" subtitle="Promoted by our designers" products={sponsored} showAd />
      <FreeBanner title={settings.freeBanner.title} text={settings.freeBanner.text} products={free} />
      <ReviewsCarousel reviews={reviews.map((r) => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, productTitle: r.product.title, productSlug: r.product.slug }))} />
      <InfoBoxes />
      <WhySection siteName={settings.siteName} counters={settings.counters} />
      <Newsletter />
    </>
  );
}
