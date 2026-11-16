import type { Metadata } from "next";
import { Listing } from "@/components/listing/listing";

export const metadata: Metadata = { title: "Get Inspired", description: "Hand-picked featured patterns and ideas for your next project." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function InspirationPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Get Inspired</h1>
      <p className="mb-8 mt-2 max-w-2xl text-muted">Our editors’ favourite patterns right now — beautiful designs, clear instructions and happy makers.</p>
      <Listing basePath="/inspiration" searchParams={sp} fixed={{ flag: "featured" }} />
    </div>
  );
}
