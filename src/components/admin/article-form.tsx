"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";
import { RichText } from "./rich-text";
import { adminApi, useAdminUi } from "./toast";

export type ArticleValue = { id?: string; title: string; slug: string; excerpt: string; cover: string | null; content: string; status: "draft" | "published" };

export function ArticleForm({ initial }: { initial: ArticleValue }) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (v.id) {
        await adminApi(`/api/admin/articles/${v.id}`, { method: "PUT", json: v });
        toast("Article saved");
      } else {
        const { id } = await adminApi<{ id: string }>("/api/admin/articles", { method: "POST", json: v });
        toast("Article created");
        router.replace(`/admin/articles/${id}`);
      }
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: "Delete this article?", confirmLabel: "Delete", danger: true }))) return;
    await adminApi(`/api/admin/articles/${v.id}`, { method: "DELETE" });
    toast("Article deleted");
    router.push("/admin/articles");
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/articles" className="btn-ghost p-2" aria-label="Back to articles"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold">{v.id ? "Edit article" : "New article"}</h1>
        </div>
        <div className="flex gap-2">
          {v.id && v.status === "published" && <a href={`/articles/${v.slug}`} target="_blank" className="btn-outline"><ExternalLink className="h-4 w-4" /> View</a>}
          {v.id && <button type="button" className="btn-outline text-red-600" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</button>}
          <button className="btn-primary" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card space-y-4 p-6">
          <div>
            <label htmlFor="a-title" className="label">Title</label>
            <input id="a-title" required className="input" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
          </div>
          <div>
            <label htmlFor="a-slug" className="label">Slug</label>
            <input id="a-slug" className="input" placeholder={slugify(v.title)} value={v.slug} onChange={(e) => setV({ ...v, slug: slugify(e.target.value) })} />
          </div>
          <div>
            <label htmlFor="a-excerpt" className="label">Excerpt</label>
            <textarea id="a-excerpt" rows={2} maxLength={300} className="input" value={v.excerpt} onChange={(e) => setV({ ...v, excerpt: e.target.value })} />
          </div>
          <div>
            <label htmlFor="a-content" className="label">Content</label>
            <RichText id="a-content" value={v.content} onChange={(content) => setV((p) => ({ ...p, content }))} minHeight={360} />
          </div>
        </section>
        <aside className="space-y-6">
          <section className="card p-5">
            <label htmlFor="a-status" className="label">Status</label>
            <select id="a-status" className="input" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as ArticleValue["status"] })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </section>
          <section className="card p-5">
            <ImageUploader single label="Cover image" value={v.cover ? [{ url: v.cover }] : []} onChange={(imgs) => setV({ ...v, cover: imgs[0] ? imgs[0].large || imgs[0].url : null })} />
          </section>
        </aside>
      </div>
    </form>
  );
}
