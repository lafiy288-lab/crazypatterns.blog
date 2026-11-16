"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { slugify } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { ImageUploader } from "./image-uploader";
import { adminApi, useAdminUi } from "./toast";

type Category = { id: string; name: string; slug: string; description: string; image: string | null; subcategories: string[]; sortOrder: number; productCount: number };
type Form = Omit<Category, "id" | "productCount"> & { id?: string };
const EMPTY: Form = { name: "", slug: "", description: "", image: null, subcategories: [], sortOrder: 0 };

export function CategoriesManager() {
  const { toast, confirm } = useAdminUi();
  const [items, setItems] = useState<Category[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [subs, setSubs] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => adminApi<{ items: Category[] }>("/api/admin/categories").then((r) => setItems(r.items)).catch((e) => toast(e.message, "error")), [toast]);
  useEffect(() => { load(); }, [load]);

  const open = (c?: Category) => {
    setForm(c ? { ...c } : { ...EMPTY, sortOrder: items?.length ?? 0 });
    setSubs(c ? c.subcategories.join(", ") : "");
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = { ...form, subcategories: subs.split(",").map((s) => s.trim()).filter(Boolean) };
      await adminApi(form.id ? `/api/admin/categories/${form.id}` : "/api/admin/categories", { method: form.id ? "PUT" : "POST", json: body });
      toast("Category saved");
      setForm(null);
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!(await confirm({ title: `Delete “${c.name}”?`, message: "Only empty categories can be deleted.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      toast("Category deleted");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <>
      <PageHeader title="Categories" description="Top-level craft categories and their subcategories." actions={<button className="btn-primary" onClick={() => open()}><Plus className="h-4 w-4" /> New category</button>} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Subcategories</th><th className="px-4 py-3">Products</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!items && <tr><td colSpan={5} className="p-4"><div className="skeleton h-24" /></td></tr>}
            {items?.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-muted">{c.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.image && <Image src={c.image} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />}
                    <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted">/{c.slug}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{c.subcategories.join(", ")}</td>
                <td className="px-4 py-3">{c.productCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="btn-ghost p-2" onClick={() => open(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-4 w-4" /></button>
                    <button className="btn-ghost p-2 text-red-600" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit category" : "New category"}>
        {form && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div>
              <label htmlFor="cat-name" className="label">Name</label>
              <input id="cat-name" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
              <div>
                <label htmlFor="cat-slug" className="label">Slug</label>
                <input id="cat-slug" className="input" placeholder={slugify(form.name)} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="cat-order" className="label">Order</label>
                <input id="cat-order" type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label htmlFor="cat-desc" className="label">Description</label>
              <textarea id="cat-desc" rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label htmlFor="cat-subs" className="label">Subcategories (comma separated)</label>
              <input id="cat-subs" className="input" value={subs} onChange={(e) => setSubs(e.target.value)} placeholder="Amigurumi, Blankets, Bags" />
            </div>
            <ImageUploader single label="Image" value={form.image ? [{ url: form.image }] : []} onChange={(imgs) => setForm({ ...form, image: imgs[0] ? imgs[0].medium || imgs[0].url : null })} />
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
