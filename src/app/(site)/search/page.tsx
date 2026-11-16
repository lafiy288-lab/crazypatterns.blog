import type { Metadata } from "next";
import { Listing } from "@/components/listing/listing";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const titleFor = (sp: Record<string, string | string[] | undefined>) => {
  if (typeof sp.q === "string" && sp.q) return `Results for “${sp.q.slice(0, 80)}”`;
  if (sp.flag === "bestseller") return "Bestsellers";
  if (sp.flag === "new") return "New Arrivals";
  if (sp.flag === "featured") return "Featured patterns";
  if (sp.sale === "1") return "On Sale";
  if (sp.video === "1") return "Patterns with video tutorial";
  return "All patterns";
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  return { title: titleFor(sp).replace(/[“”]/g, '"'), robots: sp.q ? { index: false, follow: true } : undefined };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">{titleFor(sp)}</h1>
      <Listing basePath="/search" searchParams={sp} />
    </div>
  );
}
