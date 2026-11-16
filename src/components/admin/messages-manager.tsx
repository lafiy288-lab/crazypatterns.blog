"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { AdminPagination } from "./admin-pagination";
import { adminApi, useAdminUi } from "./toast";

type Msg = { id: string; name: string; email: string; subject: string; body: string; isRead: boolean; productId: string | null; createdAt: string };
type Res = { items: Msg[]; total: number; page: number; pages: number };

export function MessagesManager() {
  const { toast, confirm } = useAdminUi();
  const [data, setData] = useState<Res | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => adminApi<Res>(`/api/admin/messages?filter=${filter}&page=${page}`).then(setData).catch((e) => toast(e.message, "error")), [filter, page, toast]);
  useEffect(() => { load(); }, [load]);

  const markRead = async (m: Msg, isRead: boolean) => {
    await adminApi(`/api/admin/messages/${m.id}`, { method: "PATCH", json: { isRead } });
    setData((d) => d && { ...d, items: d.items.map((x) => (x.id === m.id ? { ...x, isRead } : x)) });
  };

  const open = (m: Msg) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.isRead) markRead(m, true);
  };

  const remove = async (m: Msg) => {
    if (!(await confirm({ title: "Delete this message?", confirmLabel: "Delete", danger: true }))) return;
    await adminApi(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    toast("Message deleted");
    load();
  };

  return (
    <>
      <PageHeader title="Messages" description="Contact form and pattern request submissions." />
      <div className="mb-4 flex gap-2" role="tablist">
        {[["", "All"], ["unread", "Unread"]].map(([v, l]) => (
          <button key={v} role="tab" aria-selected={filter === v} onClick={() => { setFilter(v); setPage(1); }} className={cn("btn py-2", filter === v ? "bg-primary text-white" : "btn-outline")}>{l}</button>
        ))}
      </div>
      <div className="card">
        <ul className="divide-y divide-line">
          {!data && <li className="p-4"><div className="skeleton h-24" /></li>}
          {data?.items.map((m) => (
            <li key={m.id}>
              <button onClick={() => open(m)} aria-expanded={openId === m.id} className={cn("flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-cream/50", !m.isRead && "bg-primary/5")}>
                {m.isRead ? <MailOpen className="h-4 w-4 shrink-0 text-muted" /> : <Mail className="h-4 w-4 shrink-0 text-primary" />}
                <span className={cn("w-40 shrink-0 truncate text-sm", !m.isRead && "font-semibold")}>{m.name}</span>
                <span className="min-w-0 flex-1 truncate text-sm"><span className={cn(!m.isRead && "font-semibold")}>{m.subject || "(no subject)"}</span> <span className="text-muted">— {m.body}</span></span>
                <span className="shrink-0 text-xs text-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
              </button>
              {openId === m.id && (
                <div className="border-t border-line bg-cream/40 px-5 py-4">
                  <p className="text-sm text-muted">From <strong className="text-ink">{m.name}</strong> &lt;{m.email}&gt; · {new Date(m.createdAt).toLocaleString()}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{m.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a className="btn-primary py-2" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}><Reply className="h-4 w-4" /> Reply by email</a>
                    <button className="btn-outline py-2" onClick={() => markRead(m, false)}>Mark unread</button>
                    <button className="btn-outline py-2 text-red-600" onClick={() => remove(m)}><Trash2 className="h-4 w-4" /> Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {data && !data.items.length && <li className="p-10 text-center text-muted">No messages.</li>}
        </ul>
        {data && <AdminPagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
      </div>
    </>
  );
}
