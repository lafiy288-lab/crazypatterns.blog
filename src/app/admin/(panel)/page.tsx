import Link from "next/link";
import { Gift, Inbox, Mail, Package, Star, Upload } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";

export const metadata = { title: { absolute: "Dashboard · Admin" } };

export default async function DashboardPage() {
  const [total, published, free, subscribers, unread, pendingReviews, categories, recent] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "published" } }),
    prisma.product.count({ where: { isFree: true } }),
    prisma.subscriber.count(),
    prisma.message.count({ where: { isRead: false } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, _count: { select: { products: true } } } }),
    prisma.product.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select: { id: true, title: true, status: true, updatedAt: true } }),
  ]);
  const paid = total - free;
  const max = Math.max(1, ...categories.map((c) => c._count.products));
  const stats = [
    { label: "Total products", value: total, sub: `${published} published`, icon: Package, href: "/admin/products" },
    { label: "Free vs paid", value: `${free} / ${paid}`, sub: `${total ? Math.round((free / total) * 100) : 0}% free`, icon: Gift, href: "/admin/products?type=free" },
    { label: "Subscribers", value: subscribers, sub: "Newsletter", icon: Mail, href: "/admin/subscribers" },
    { label: "New messages", value: unread, sub: `${pendingReviews} reviews pending`, icon: Inbox, href: "/admin/messages" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your catalogue and community."
        actions={
          <>
            <Link href="/admin/import" className="btn-outline"><Upload className="h-4 w-4" /> Import</Link>
            <Link href="/admin/products/new" className="btn-primary"><Package className="h-4 w-4" /> New product</Link>
          </>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ icon: Icon, ...s }) => (
          <li key={s.label}>
            <Link href={s.href} className="card flex items-center gap-4 p-5 transition hover:shadow-lift">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" aria-hidden /></span>
              <span>
                <span className="block text-sm text-muted">{s.label}</span>
                <span className="block font-heading text-2xl font-bold">{s.value}</span>
                <span className="block text-xs text-muted">{s.sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-6" aria-labelledby="chart-title">
          <h2 id="chart-title" className="mb-5 font-heading text-lg font-semibold">Products per category</h2>
          <ul className="space-y-3">
            {categories.map((c) => (
              <li key={c.name} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-sm">
                <span className="truncate">{c.name}</span>
                <span className="h-3 overflow-hidden rounded-full bg-cream" role="img" aria-label={`${c.name}: ${c._count.products} products`}>
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(c._count.products / max) * 100}%` }} />
                </span>
                <span className="text-right font-semibold tabular-nums">{c._count.products}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6" aria-labelledby="recent-title">
          <h2 id="recent-title" className="mb-4 font-heading text-lg font-semibold">Recently updated</h2>
          <ul className="divide-y divide-line">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link href={`/admin/products/${p.id}`} className="truncate font-medium hover:text-primary">{p.title}</Link>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`chip ${p.status === "published" ? "bg-primary/10 text-primary" : "bg-line text-muted"}`}>{p.status}</span>
                  <span className="text-xs text-muted">{formatDate(p.updatedAt)}</span>
                </span>
              </li>
            ))}
          </ul>
          {pendingReviews > 0 && (
            <Link href="/admin/reviews?status=pending" className="btn-outline mt-4 w-full"><Star className="h-4 w-4" /> Moderate {pendingReviews} pending reviews</Link>
          )}
        </section>
      </div>
    </>
  );
}
