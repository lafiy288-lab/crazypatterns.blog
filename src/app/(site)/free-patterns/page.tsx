import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { Listing } from "@/components/listing/listing";

export const metadata: Metadata = {
  title: "Free Patterns",
  description: "Free crochet, knitting, sewing, felting, embroidery and craft patterns to download.",
  alternates: { canonical: "/free-patterns" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function FreePatternsPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-8 rounded-[28px] bg-gradient-to-br from-primary/15 to-accent/10 p-8">
        <span className="chip mb-3 gap-1 bg-primary text-white"><Gift className="h-3.5 w-3.5" aria-hidden /> Free</span>
        <h1 className="text-3xl font-bold sm:text-4xl">Free Patterns</h1>
        <p className="mt-2 max-w-2xl text-muted">Download and start today — no account, no cost. A great way to try a new designer or technique.</p>
      </div>
      <Listing basePath="/free-patterns" searchParams={sp} fixed={{ free: "free" }} hideFilters={["free"]} />
    </div>
  );
}
