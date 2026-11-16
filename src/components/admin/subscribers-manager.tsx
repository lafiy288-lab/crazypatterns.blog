"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { AdminPagination } from "./admin-pagination";
import { adminApi, useAdminUi } from "./toast";

type Sub = { id: string; email: string; createdAt: string };
type Res = { items: Sub[]; total: number; page: number; pages: number };

export function SubscribersManager() {
  const { toast, confirm } = useAdminUi();
  const [data, setData] = useState<Res | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const load = useCallback(() => adminApi<Res>(`/api/admin/subscribers?page=${page}&q=${encodeURIComponent(q)}`).then(setData).catch((e) => toast(e.message, "error")), [page, q, toast]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const remove = async (s: Sub) => {
    if (!(await confirm({ title: `Remove ${s.email}?`, confirmLabel: "Remove", danger: true }))) return;
    await adminApi(`/api/admin/subscribers/${s.id}`, { method: "DELETE" });
    toast("Subscriber removed");
    load();
  };

  return (
    <>
      <PageHeader title="Subscribers" description="Newsletter sign-ups from the homepage." actions={<a href="/api/admin/subscribers/export" className="btn-primary"><Download className="h-4 w-4" /> Export CSV</a>} />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Search email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search subscribers" />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Subscribed</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!data && <tr><td colSpan={3} className="p-4"><div className="skeleton h-20" /></td></tr>}
            {data?.items.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 text-muted">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3 text-right"><button className="btn-ghost p-2 text-red-600" onClick={() => remove(s)} aria-label={`Remove ${s.email}`}><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {data && !data.items.length && <tr><td colSpan={3} className="p-10 text-center text-muted">No subscribers yet.</td></tr>}
          </tbody>
        </table>
        {data && <AdminPagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
      </div>
    </>
  );
}
