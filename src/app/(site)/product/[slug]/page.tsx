import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FileText, Gauge, Globe, PlayCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { cardSelect, PUBLISHED, toCard } from "@/lib/products";
import type { ProductImage } from "@/lib/types";
import { absoluteUrl, formatDate, stripHtml, truncate } from "@/lib/utils";
import { Gallery } from "@/components/product/gallery";
import { Price } from "@/components/product/price";
import { FavoriteButton } from "@/components/product/favorite-button";
import { GetPattern } from "@/components/product/get-pattern";
import { ReviewForm } from "@/components/product/review-form";
import { ProductSection } from "@/components/home/product-section";
import { Stars } from "@/components/ui/stars";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await prisma.product.findMany({ where: PUBLISHED, orderBy: { reviewCount: "desc" }, take: 50, select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const getProduct = cache((slug: string) =>
  prisma.product.findFirst({
    where: { slug, ...PUBLISHED },
    include: { category: true, designer: true, reviews: { where: { status: "approved" }, orderBy: { createdAt: "desc" }, take: 20 } },
  }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const images = parseJson<ProductImage[]>(p.images, []);
  const description = p.metaDescription || truncate(stripHtml(p.description), 160);
  return {
    // The layout template appends the site name, so strip it if an imported meta title already has it.
    title: (p.metaTitle || `${p.title} – ${p.category.name} Pattern`).replace(/\s*[|–-]\s*PatternNest$/i, ""),
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: "website", title: p.title, description, images: images[0] ? [{ url: images[0].large || images[0].url, alt: images[0].alt || p.title }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const images = parseJson<ProductImage[]>(p.images, []);
  const languages = parseJson<string[]>(p.languages, []);
  const [moreFromDesigner, related] = await Promise.all([
    prisma.product.findMany({ where: { ...PUBLISHED, designerId: p.designerId, id: { not: p.id } }, take: 4, orderBy: { reviewCount: "desc" }, select: cardSelect }),
    prisma.product.findMany({ where: { ...PUBLISHED, categoryId: p.categoryId, id: { not: p.id }, designerId: { not: p.designerId } }, take: 4, orderBy: { rating: "desc" }, select: cardSelect }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    sku: p.sku,
    image: images.map((i) => absoluteUrl(i.large || i.url)),
    description: stripHtml(p.description).slice(0, 500),
    brand: { "@type": "Brand", name: p.designer.name },
    aggregateRating: p.reviewCount ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } : undefined,
    offers: { "@type": "Offer", price: p.price, priceCurrency: p.currency, availability: "https://schema.org/InStock", url: absoluteUrl(`/product/${p.slug}`) },
  };

  const facts = [
    { icon: Gauge, label: "Difficulty", value: <span className="capitalize">{p.difficulty}</span> },
    { icon: Globe, label: "Language", value: languages.join(", ") },
    { icon: FileText, label: "File format", value: p.fileFormat },
    { icon: PlayCircle, label: "Video tutorial", value: p.hasVideo ? "Included" : "No" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-page py-8 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
          <Link href="/" className="hover:text-primary">Home</Link> / <Link href={`/category/${p.category.slug}`} className="hover:text-primary">{p.category.name}</Link>
          {p.subcategory && <> / <Link href={`/category/${p.category.slug}?sub=${encodeURIComponent(p.subcategory)}`} className="hover:text-primary">{p.subcategory}</Link></>}
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Gallery images={images} title={p.title} />

          <div className="space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {p.isFree && <span className="chip bg-primary text-white">FREE</span>}
                {p.discountPercent > 0 && !p.isFree && <span className="chip bg-accent-strong text-white">-{p.discountPercent}%</span>}
                {p.isBestseller && <span className="chip bg-amber-100 text-amber-800">Bestseller</span>}
                {p.isNew && <span className="chip bg-primary/10 text-primary">New</span>}
                {p.hasVideo && <span className="chip gap-1 bg-ink/80 text-white"><PlayCircle className="h-3.5 w-3.5" aria-hidden /> Video</span>}
              </div>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{p.title}</h1>
              <p className="mt-2 text-muted">
                by <Link href={`/designer/${p.designer.slug}`} className="font-semibold text-primary hover:underline">{p.designer.name}</Link>
              </p>
              <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
                <Stars rating={p.rating} size={16} /> {p.rating.toFixed(1)} · {p.reviewCount} reviews
              </a>
            </div>

            <Price price={p.price} oldPrice={p.oldPrice} isFree={p.isFree} from={false} size="lg" />

            <div className="flex flex-col gap-3 sm:flex-row">
              <GetPattern productId={p.id} title={p.title} url={p.getPatternUrl} isFree={p.isFree} />
              <FavoriteButton id={p.id} title={p.title} withLabel className="py-3.5" />
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="card p-3.5">
                  <dt className="flex items-center gap-1.5 text-xs text-muted">
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden /> {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="desc-title">
              <h2 id="desc-title" className="mb-2 font-heading text-lg font-semibold">About this pattern</h2>
              <div className="prose prose-slate max-w-none text-[15px] dark:prose-invert prose-headings:font-heading prose-a:text-primary" dangerouslySetInnerHTML={{ __html: p.description }} />
            </section>
            <p className="text-xs text-muted">SKU {p.sku}</p>
          </div>
        </div>

        <section id="reviews" aria-labelledby="reviews-heading" className="mt-16 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 id="reviews-heading" className="mb-4 text-2xl font-semibold">Reviews ({p.reviews.length})</h2>
            {p.reviews.length === 0 && <p className="text-muted">No reviews yet — be the first to share your thoughts!</p>}
            <ul className="space-y-4">
              {p.reviews.map((r) => (
                <li key={r.id} className="card p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{r.name}</span>
                    <time className="text-xs text-muted" dateTime={r.createdAt.toISOString()}>{formatDate(r.createdAt)}</time>
                  </div>
                  <Stars rating={r.rating} size={14} />
                  <p className="mt-2 text-[15px] leading-relaxed">{r.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <ReviewForm productId={p.id} />
        </section>

        <section aria-labelledby="designer-heading" className="mt-16 card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
          {p.designer.avatar && <Image src={p.designer.avatar} alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />}
          <div className="flex-1">
            <h2 id="designer-heading" className="font-heading text-lg font-semibold">About {p.designer.name}</h2>
            <p className="mt-1 text-sm text-muted">{p.designer.bio}</p>
          </div>
          <Link href={`/designer/${p.designer.slug}`} className="btn-outline">All patterns</Link>
        </section>
      </div>

      <ProductSection id="more-designer" title="More from this designer" href={`/designer/${p.designer.slug}`} products={moreFromDesigner.map(toCard)} />
      <ProductSection id="related" title="You might also like" href={`/category/${p.category.slug}`} linkLabel={`More ${p.category.name}`} products={related.map(toCard)} />
    </>
  );
}
