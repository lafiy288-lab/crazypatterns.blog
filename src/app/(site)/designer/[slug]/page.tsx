import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { Listing } from "@/components/listing/listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const getDesigner = cache((slug: string) => prisma.designer.findUnique({ where: { slug } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDesigner((await params).slug);
  return d ? { title: `${d.name} – Patterns`, description: d.bio, alternates: { canonical: `/designer/${d.slug}` } } : {};
}

export default async function DesignerPage({ params, searchParams }: Props) {
  const d = await getDesigner((await params).slug);
  if (!d) notFound();
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="card mb-8 flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        {d.avatar && <Image src={d.avatar} alt="" width={96} height={96} className="h-24 w-24 rounded-full object-cover" priority />}
        <div>
          <p className="text-sm text-muted">Designer</p>
          <h1 className="text-3xl font-bold">{d.name}</h1>
          <p className="mt-2 max-w-2xl text-muted">{d.bio}</p>
        </div>
      </div>
      <Listing basePath={`/designer/${d.slug}`} searchParams={await searchParams} fixed={{ designer: d.slug }} />
    </div>
  );
}
