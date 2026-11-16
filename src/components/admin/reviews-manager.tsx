"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Trash2, Undo2 } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { AdminPagination } from "./admin-pagination";
import { adminApi, useAdminUi } from "./toast";

type Review = { id: string; name: string; rating: number; text: string; status: string; createdAt: string; product: { title: string; slug: string } };
type Res = { items: Review[]; total: number; page: number; pages: number };

export function ReviewsManager({ initialStatus }: { initialStatus: string }) {
  const { toast, confirm } = useAdminUi();
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Res | null>(null);

  const load = useCallback(() => adminApi<Res>(`/api/admin/reviews?status=${status}&page=${page}`).then(setData).catch((e) => toast(e.message, "error")), [status, page, toast]);
  useEffect(() => { load(); }, [load]);

  const setReviewStatus = async (r: Review, next: "approved" | "pending") => {
    try {
      await adminApi(`/api/admin/reviews/${r.id}`, { method: "PATCH", json: { status: next } });
      toast(next === "approved" ? "Review approved and published" : "Review moved back to pending");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const remove = async (r: Review) => {
    if (!(await confirm({ title: "Delete this review?", message: "Rejecting a review deletes it permanently.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
      toast("Review deleted");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Reviews" description="Approve reviews to publish them on product pages. Reject deletes them." />
      <div className="mb-4 flex gap-2" role="tablist">
        {[["pending", "Pending"], ["approved", "Approved"], ["", "All"]].map(([v, l]) => (
          <button key={v} role="tab" aria-selected={status === v} onClick={() => { setStatus(v); setPage(1); }} className={cn("btn py-2", status === v ? "bg-primary text-white" : "btn-outline")}>{l}</button>
        ))}
      </div>
      <div className="card">
        <ul className="divide-y divide-line">
          {!data && <li className="p-4"><div className="skeleton h-24" /></li>}
          {data?.items.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.name}</span>
                  <Stars rating={r.rating} />
                  <span className={cn("chip", r.status === "approved" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800")}>{r.status}</span>
                </div>
                <p className="mt-1.5 text-sm">{r.text}</p>
                <p className="mt-1.5 text-xs text-muted">
                  {formatDate(r.createdAt)} · on <Link href={`/product/${r.product.slug}`} target="_blank" className="text-primary hover:underline">{r.product.title}</Link>
                </p>
              </div>
              <div className="flex gap-2">
                {r.status === "pending" ? (
                  <button className="btn-primary py-2" onClick={() => setReviewStatus(r, "approved")}><Check className="h-4 w-4" /> Approve</button>
                ) : (
                  <button className="btn-outline py-2" onClick={() => setReviewStatus(r, "pending")}><Undo2 className="h-4 w-4" /> Unpublish</button>
                )}
                <button className="btn-outline py-2 text-red-600" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /> Reject</button>
              </div>
            </li>
          ))}
          {data && !data.items.length && <li className="p-10 text-center text-muted">Nothing here — all caught up!</li>}
        </ul>
        {data && <AdminPagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
      </div>
    </>
  );
}
