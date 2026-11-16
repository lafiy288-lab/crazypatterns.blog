"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { slugify } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { ImageUploader } from "./image-uploader";
import { adminApi, useAdminUi } from "./toast";

type Designer = { id: string; name: string; slug: string; bio: string; avatar: string | null; productCount: number };
type Form = Omit<Designer, "id" | "productCount"> & { id?: string };

export function DesignersManager() {
  const { toast, confirm } = useAdminUi();
  const [items, setItems] = useState<Designer[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => adminApi<{ items: Designer[] }>("/api/admin/designers").then((r) => setItems(r.items)).catch((e) => toast(e.message, "error")), [toast]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await adminApi(form.id ? `/api/admin/designers/${form.id}` : "/api/admin/designers", { method: form.id ? "PUT" : "POST", json: form });
      toast("Designer saved");
      setForm(null);
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: Designer) => {
    if (!(await confirm({ title: `Delete “${d.name}”?`, message: "Only designers without products can be deleted.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi(`/api/admin/designers/${d.id}`, { method: "DELETE" });
      toast("Designer deleted");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const visible = items?.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Designers" description="People and studios behind the patterns." actions={<button className="btn-primary" onClick={() => setForm({ name: "", slug: "", bio: "", avatar: null })}><Plus className="h-4 w-4" /> New designer</button>} />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Filter designers…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter designers" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {!items && Array.from({ length: 6 }, (_, i) => <li key={i} className="skeleton h-28" />)}
        {visible?.map((d) => (
          <li key={d.id} className="card flex gap-4 p-4">
            {d.avatar ? <Image src={d.avatar} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" /> : <span className="h-14 w-14 rounded-full bg-line" />}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted">{d.productCount} products · /{d.slug}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{d.bio}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button className="btn-ghost p-2" onClick={() => setForm({ ...d })} aria-label={`Edit ${d.name}`}><Pencil className="h-4 w-4" /></button>
              <button className="btn-ghost p-2 text-red-600" onClick={() => remove(d)} aria-label={`Delete ${d.name}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit designer" : "New designer"}>
        {form && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div>
              <label htmlFor="d-name" className="label">Name</label>
              <input id="d-name" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="d-slug" className="label">Slug</label>
              <input id="d-slug" className="input" placeholder={slugify(form.name)} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </div>
            <div>
              <label htmlFor="d-bio" className="label">Bio</label>
              <textarea id="d-bio" rows={3} className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <ImageUploader single label="Avatar" value={form.avatar ? [{ url: form.avatar }] : []} onChange={(imgs) => setForm({ ...form, avatar: imgs[0] ? imgs[0].thumb || imgs[0].url : null })} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
