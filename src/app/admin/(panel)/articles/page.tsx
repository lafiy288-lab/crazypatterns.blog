import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Articles" };

export default async function ArticlesAdminPage() {
  const items = await prisma.article.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, slug: true, status: true, cover: true, updatedAt: true } });
  return (
    <>
      <PageHeader title="Articles" description="Blog posts and guides." actions={<Link href="/admin/articles/new" className="btn-primary"><Plus className="h-4 w-4" /> New article</Link>} />
      <div className="card divide-y divide-line">
        {items.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-4">
            {a.cover ? <Image src={a.cover} alt="" width={96} height={54} className="h-[54px] w-24 rounded-lg object-cover" /> : <span className="h-[54px] w-24 rounded-lg bg-line" />}
            <div className="min-w-0 flex-1">
              <Link href={`/admin/articles/${a.id}`} className="block truncate font-medium hover:text-primary">{a.title}</Link>
              <p className="text-xs text-muted">Updated {formatDate(a.updatedAt)} · /articles/{a.slug}</p>
            </div>
            <span className={`chip ${a.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"}`}>{a.status}</span>
            <Link href={`/admin/articles/${a.id}`} className="btn-ghost p-2" aria-label={`Edit ${a.title}`}><Pencil className="h-4 w-4" /></Link>
          </div>
        ))}
        {!items.length && <p className="p-8 text-center text-muted">No articles yet.</p>}
      </div>
    </>
  );
}
