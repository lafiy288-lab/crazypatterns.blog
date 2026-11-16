"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { pickSrc } from "@/lib/image-src";
import { cn, formatMoney } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { AdminPagination } from "./admin-pagination";
import { adminApi, useAdminUi } from "./toast";

type Row = {
  id: string; title: string; slug: string; sku: string; price: number; oldPrice: number | null; discountPercent: number; isFree: boolean; status: string;
  image: ProductImage | null; isBestseller: boolean; isNew: boolean; isSponsored: boolean; isFeatured: boolean; hasVideo: boolean; rating: number; updatedAt: string;
  category: { name: string }; designer: { name: string };
};
type ListResponse = { items: Row[]; total: number; page: number; pages: number };

const FLAGS = [
  ["isBestseller", "Bestseller"],
  ["isNew", "New"],
  ["isSponsored", "Sponsored"],
  ["isFeatured", "Featured"],
  ["hasVideo", "Video"],
  ["isFree", "Free"],
] as const;

export function ProductsTable({ categories }: { categories: { id: string; name: string }[] }) {
  const { toast, confirm } = useAdminUi();
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(params.get("q") ?? "");
  const [bulk, setBulk] = useState("");
  const [bulkArg, setBulkArg] = useState("");

  const state = {
    q: params.get("q") ?? "",
    status: params.get("status") ?? "",
    categoryId: params.get("categoryId") ?? "",
    type: params.get("type") ?? "",
    flag: params.get("flag") ?? "",
    sort: params.get("sort") ?? "updatedAt",
    dir: params.get("dir") ?? "desc",
    page: Number(params.get("page") ?? 1),
  };

  const setParams = (changes: Record<string, string | number | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, String(v));
    }
    if (!("page" in changes)) sp.delete("page");
    router.replace(`/admin/products?${sp.toString()}`, { scroll: false });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams(params.toString());
      sp.set("perPage", "20");
      if (!sp.get("sort")) sp.set("sort", "updatedAt");
      setData(await adminApi<ListResponse>(`/api/admin/products?${sp.toString()}`));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [params, toast]);

  useEffect(() => {
    load();
    setSelected(new Set());
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => q !== state.q && setParams({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const allSelected = !!data?.items.length && data.items.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(data?.items.map((r) => r.id)));
  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  const runBulk = async () => {
    if (!bulk || !selected.size) return;
    const ids = [...selected];
    const payload: Record<string, unknown> = { ids };
    if (bulk === "delete") {
      if (!(await confirm({ title: `Delete ${ids.length} products?`, message: "This cannot be undone.", confirmLabel: "Delete", danger: true }))) return;
      payload.action = "delete";
    } else if (bulk === "publish" || bulk === "unpublish") {
      payload.action = bulk;
    } else if (bulk === "category") {
      if (!bulkArg) return toast("Choose a category", "error");
      Object.assign(payload, { action: "category", categoryId: bulkArg });
    } else if (bulk === "discount") {
      Object.assign(payload, { action: "discount", discountPercent: Number(bulkArg || 0) });
    } else if (bulk.startsWith("flag:")) {
      const [, flag, value] = bulk.split(":");
      Object.assign(payload, { action: "flag", flag, value: value === "on" });
    }
    try {
      const { count } = await adminApi<{ count: number }>("/api/admin/products/bulk", { method: "POST", json: payload });
      toast(`Updated ${count} products`);
      setBulk("");
      setBulkArg("");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const remove = async (row: Row) => {
    if (!(await confirm({ title: `Delete “${row.title}”?`, message: "This cannot be undone.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi(`/api/admin/products/${row.id}`, { method: "DELETE" });
      toast("Product deleted");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const duplicate = async (row: Row) => {
    try {
      const { id } = await adminApi<{ id: string }>(`/api/admin/products/${row.id}/duplicate`, { method: "POST" });
      toast("Draft copy created");
      router.push(`/admin/products/${id}`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const SortHead = ({ field, children, className }: { field: string; children: React.ReactNode; className?: string }) => (
    <th scope="col" className={cn("px-3 py-3 font-semibold", className)} aria-sort={state.sort === field ? (state.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button className="inline-flex items-center gap-1 hover:text-primary" onClick={() => setParams({ sort: field, dir: state.sort === field && state.dir === "desc" ? "asc" : "desc" })}>
        {children}
        {state.sort === field && (state.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader title="Products" description="Search, filter and manage your catalogue." actions={<Link href="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> New product</Link>} />

      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="p-search" className="sr-only">Search products</label>
          <input id="p-search" className="input pl-9" placeholder="Search title, SKU, designer…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select aria-label="Status" className="input" value={state.status} onChange={(e) => setParams({ status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select aria-label="Category" className="input" value={state.categoryId} onChange={(e) => setParams({ categoryId: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Type" className="input" value={state.type} onChange={(e) => setParams({ type: e.target.value })}>
          <option value="">Free & paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="sale">On sale</option>
        </select>
        <select aria-label="Flag" className="input" value={state.flag} onChange={(e) => setParams({ flag: e.target.value })}>
          <option value="">Any flag</option>
          {FLAGS.filter(([f]) => f !== "isFree").map(([f, l]) => <option key={f} value={f}>{l}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="card mb-4 flex flex-wrap items-center gap-3 border-primary/40 bg-primary/5 p-3">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <select aria-label="Bulk action" className="input w-auto py-2" value={bulk} onChange={(e) => { setBulk(e.target.value); setBulkArg(""); }}>
            <option value="">Choose action…</option>
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish (draft)</option>
            <option value="category">Change category</option>
            <option value="discount">Set discount %</option>
            <optgroup label="Flags">
              {FLAGS.map(([f, l]) => [
                <option key={`${f}on`} value={`flag:${f}:on`}>Mark as {l}</option>,
                <option key={`${f}off`} value={`flag:${f}:off`}>Remove {l}</option>,
              ])}
            </optgroup>
            <option value="delete">Delete</option>
          </select>
          {bulk === "category" && (
            <select aria-label="New category" className="input w-auto py-2" value={bulkArg} onChange={(e) => setBulkArg(e.target.value)}>
              <option value="">Category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {bulk === "discount" && (
            <input aria-label="Discount percent" type="number" min={0} max={95} className="input w-28 py-2" placeholder="% (0 = none)" value={bulkArg} onChange={(e) => setBulkArg(e.target.value)} />
          )}
          <button className={bulk === "delete" ? "btn bg-red-600 py-2 text-white" : "btn-primary py-2"} onClick={runBulk} disabled={!bulk}>Apply</button>
          <button className="btn-ghost py-2" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} className="h-4 w-4" /></th>
                <SortHead field="title">Product</SortHead>
                <SortHead field="sku">SKU</SortHead>
                <th className="px-3 py-3 font-semibold">Category</th>
                <SortHead field="price">Price</SortHead>
                <th className="px-3 py-3 font-semibold">Flags</th>
                <SortHead field="status">Status</SortHead>
                <SortHead field="updatedAt">Updated</SortHead>
                <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && !data && Array.from({ length: 8 }, (_, i) => (
                <tr key={i}><td colSpan={9} className="px-3 py-3"><div className="skeleton h-10" /></td></tr>
              ))}
              {data?.items.map((r) => (
                <tr key={r.id} className={cn("transition hover:bg-cream/50", selected.has(r.id) && "bg-primary/5", loading && "opacity-60")}>
                  <td className="px-3 py-2"><input type="checkbox" aria-label={`Select ${r.title}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4" /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Image src={pickSrc(r.image, "thumb")} alt="" width={36} height={45} className="h-[45px] w-9 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <Link href={`/admin/products/${r.id}`} className="block max-w-[260px] truncate font-medium hover:text-primary">{r.title}</Link>
                        <span className="text-xs text-muted">{r.designer.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                  <td className="px-3 py-2">{r.category.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.isFree ? <span className="font-semibold text-primary">Free</span> : formatMoney(r.price)}
                    {r.discountPercent > 0 && <span className="chip ml-1.5 bg-accent/15 text-accent-ink">-{r.discountPercent}%</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex max-w-[200px] flex-wrap gap-1">
                      {FLAGS.filter(([f]) => r[f]).map(([f, l]) => <span key={f} className="chip bg-line/70 text-[10px] text-ink">{l}</span>)}
                    </div>
                  </td>
                  <td className="px-3 py-2"><span className={cn("chip", r.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800")}>{r.status}</span></td>
                  <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">{new Date(r.updatedAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${r.id}`} className="btn-ghost p-2" aria-label={`Edit ${r.title}`}><Pencil className="h-4 w-4" /></Link>
                      <button className="btn-ghost p-2" onClick={() => duplicate(r)} aria-label={`Duplicate ${r.title}`}><Copy className="h-4 w-4" /></button>
                      {r.status === "published" && <a href={`/product/${r.slug}`} target="_blank" className="btn-ghost p-2" aria-label={`View ${r.title} on site`}><ExternalLink className="h-4 w-4" /></a>}
                      <button className="btn-ghost p-2 text-red-600" onClick={() => remove(r)} aria-label={`Delete ${r.title}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && !data.items.length && (
                <tr><td colSpan={9} className="px-3 py-12 text-center text-muted">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data && <AdminPagination page={data.page} pages={data.pages} total={data.total} onPage={(p) => setParams({ page: p })} />}
        {loading && data && <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-primary" aria-label="Loading" />}
      </div>
    </>
  );
}
