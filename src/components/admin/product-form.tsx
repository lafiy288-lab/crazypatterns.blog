"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { DIFFICULTIES, LANGUAGES, cn, discountFrom, slugify, stripHtml, truncate } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import { ImageUploader } from "./image-uploader";
import { RichText } from "./rich-text";
import { adminApi, useAdminUi } from "./toast";

export type ProductFormValue = {
  id?: string;
  title: string; slug: string; sku: string; description: string; price: number; oldPrice: number | null; currency: "USD" | "EUR";
  images: ProductImage[]; categoryId: string; subcategory: string | null; designerId: string; difficulty: (typeof DIFFICULTIES)[number];
  languages: string[]; fileFormat: string; hasVideo: boolean; isFree: boolean; isBestseller: boolean; isNew: boolean; isSponsored: boolean; isFeatured: boolean;
  rating: number; reviewCount: number; getPatternUrl: string | null; metaTitle: string | null; metaDescription: string | null; status: "draft" | "published";
};

type Option = { id: string; name: string };
type Props = { initial: ProductFormValue; categories: (Option & { subcategories: string[] })[]; designers: Option[] };

const FLAG_FIELDS = [
  ["isFree", "Free"],
  ["isBestseller", "Bestseller"],
  ["isNew", "New"],
  ["isSponsored", "Sponsored"],
  ["isFeatured", "Featured"],
  ["hasVideo", "Video tutorial"],
] as const;

export function ProductForm({ initial, categories, designers }: Props) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const [v, setV] = useState<ProductFormValue>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) => setV((p) => ({ ...p, [k]: val }));

  const category = categories.find((c) => c.id === v.categoryId);
  const designer = designers.find((d) => d.id === v.designerId);
  const discount = v.isFree ? 0 : discountFrom(v.price, v.oldPrice);

  const preview = useMemo(
    () => ({
      id: v.id ?? "preview", slug: v.slug || "preview", title: v.title || "Product title", price: v.isFree ? 0 : v.price, oldPrice: discount ? v.oldPrice : null,
      discountPercent: discount, currency: v.currency, image: v.images[0] ?? null, designerName: designer?.name ?? "Designer", designerSlug: "", rating: v.rating,
      reviewCount: v.reviewCount, hasVideo: v.hasVideo, isFree: v.isFree, isNew: v.isNew, isSponsored: v.isSponsored,
    }),
    [v, discount, designer],
  );

  const save = async (status?: "draft" | "published") => {
    const body = { ...v, status: status ?? v.status, getPatternUrl: v.getPatternUrl || null, oldPrice: v.oldPrice || null };
    const errs: Record<string, string> = {};
    if (body.title.trim().length < 2) errs.title = "Title is required";
    if (!body.sku.trim()) errs.sku = "SKU is required";
    if (!body.categoryId) errs.categoryId = "Choose a category";
    if (!body.designerId) errs.designerId = "Choose a designer";
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Please fix the highlighted fields", "error");
    setSaving(true);
    try {
      if (v.id) {
        await adminApi(`/api/admin/products/${v.id}`, { method: "PUT", json: body });
        setV((p) => ({ ...p, status: body.status }));
        toast("Product saved");
        router.refresh();
      } else {
        const { id } = await adminApi<{ id: string }>("/api/admin/products", { method: "POST", json: body });
        toast("Product created");
        router.replace(`/admin/products/${id}`);
      }
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    try {
      const { id } = await adminApi<{ id: string }>(`/api/admin/products/${v.id}/duplicate`, { method: "POST" });
      toast("Draft copy created");
      router.push(`/admin/products/${id}`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: "Delete this product?", message: "This cannot be undone.", confirmLabel: "Delete", danger: true }))) return;
    try {
      await adminApi(`/api/admin/products/${v.id}`, { method: "DELETE" });
      toast("Product deleted");
      router.push("/admin/products");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const field = (k: string) => (errors[k] ? "border-red-500" : "");

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="btn-ghost p-2" aria-label="Back to products"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold">{v.id ? "Edit product" : "New product"}</h1>
          <span className={cn("chip", v.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800")}>{v.status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {v.id && (
            <>
              {v.status === "published" && <a href={`/product/${v.slug}`} target="_blank" className="btn-outline"><ExternalLink className="h-4 w-4" /> View</a>}
              <button type="button" className="btn-outline" onClick={duplicate}><Copy className="h-4 w-4" /> Duplicate</button>
              <button type="button" className="btn-outline text-red-600" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</button>
            </>
          )}
          <button type="button" className="btn-outline" disabled={saving} onClick={() => save("draft")}>Save as draft</button>
          <button type="button" className="btn-primary" disabled={saving} onClick={() => save("published")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {v.status === "published" ? "Save & publish" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="font-heading text-lg font-semibold">Basics</h2>
            <div>
              <label htmlFor="title" className="label">Title *</label>
              <input id="title" className={cn("input", field("title"))} value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={160} aria-invalid={!!errors.title} />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="slug" className="label">URL slug</label>
                <input id="slug" className="input" value={v.slug} placeholder={slugify(v.title) || "auto-generated"} onChange={(e) => set("slug", slugify(e.target.value))} />
              </div>
              <div>
                <label htmlFor="sku" className="label">SKU *</label>
                <input id="sku" className={cn("input font-mono", field("sku"))} value={v.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} maxLength={64} aria-invalid={!!errors.sku} />
                {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="description" className="label">Description</label>
              <RichText id="description" value={v.description} onChange={(html) => set("description", html)} />
            </div>
          </section>

          <section className="card p-6">
            <ImageUploader value={v.images} onChange={(imgs) => set("images", imgs)} label="Images (drag to reorder — first is the cover)" />
          </section>

          <section className="card grid gap-4 p-6 sm:grid-cols-2">
            <h2 className="font-heading text-lg font-semibold sm:col-span-2">Organisation</h2>
            <div>
              <label htmlFor="category" className="label">Category *</label>
              <select id="category" className={cn("input", field("categoryId"))} value={v.categoryId} onChange={(e) => setV((p) => ({ ...p, categoryId: e.target.value, subcategory: null }))}>
                <option value="">Choose…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
            </div>
            <div>
              <label htmlFor="subcategory" className="label">Subcategory</label>
              <select id="subcategory" className="input" value={v.subcategory ?? ""} onChange={(e) => set("subcategory", e.target.value || null)} disabled={!category}>
                <option value="">None</option>
                {category?.subcategories.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="designer" className="label">Designer *</label>
              <select id="designer" className={cn("input", field("designerId"))} value={v.designerId} onChange={(e) => set("designerId", e.target.value)}>
                <option value="">Choose…</option>
                {designers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.designerId && <p className="mt-1 text-xs text-red-600">{errors.designerId}</p>}
            </div>
            <div>
              <label htmlFor="difficulty" className="label">Difficulty</label>
              <select id="difficulty" className="input capitalize" value={v.difficulty} onChange={(e) => set("difficulty", e.target.value as ProductFormValue["difficulty"])}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="label">Languages</legend>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const on = v.languages.includes(l);
                  return (
                    <button key={l} type="button" aria-pressed={on} onClick={() => set("languages", on ? v.languages.filter((x) => x !== l) : [...v.languages, l])} className={cn("chip border px-3 py-1.5", on ? "border-primary bg-primary text-white" : "border-line bg-card")}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="fileFormat" className="label">File format</label>
              <input id="fileFormat" className="input" value={v.fileFormat} onChange={(e) => set("fileFormat", e.target.value)} list="formats" />
              <datalist id="formats"><option value="PDF" /><option value="PDF + Video" /><option value="PDF + SVG" /><option value="ZIP" /></datalist>
            </div>
            <div>
              <label htmlFor="getPatternUrl" className="label">External “Get Pattern” link</label>
              <input id="getPatternUrl" type="url" className="input" placeholder="https://… (optional; otherwise a request form is shown)" value={v.getPatternUrl ?? ""} onChange={(e) => set("getPatternUrl", e.target.value)} />
            </div>
          </section>

          <section className="card grid gap-4 p-6 sm:grid-cols-3">
            <h2 className="font-heading text-lg font-semibold sm:col-span-3">Pricing</h2>
            <div>
              <label htmlFor="price" className="label">Price</label>
              <input id="price" type="number" min={0} step="0.01" className="input" value={v.isFree ? 0 : v.price} disabled={v.isFree} onChange={(e) => set("price", Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="oldPrice" className="label">Old price (optional)</label>
              <input id="oldPrice" type="number" min={0} step="0.01" className="input" value={v.oldPrice ?? ""} disabled={v.isFree} onChange={(e) => set("oldPrice", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <label htmlFor="currency" className="label">Currency</label>
              <select id="currency" className="input" value={v.currency} onChange={(e) => set("currency", e.target.value as "USD" | "EUR")}>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
            <p className="text-sm text-muted sm:col-span-3" aria-live="polite">
              {discount > 0 ? <>Discount auto-calculated: <strong className="text-accent-ink">-{discount}%</strong></> : "Set an old price higher than the price to show a discount badge."}
            </p>
          </section>

          <section className="card grid gap-4 p-6 sm:grid-cols-2">
            <h2 className="font-heading text-lg font-semibold sm:col-span-2">SEO</h2>
            <div className="sm:col-span-2">
              <label htmlFor="metaTitle" className="label">Meta title <span className="font-normal text-muted">({(v.metaTitle ?? "").length}/70)</span></label>
              <input id="metaTitle" className="input" maxLength={70} placeholder={truncate(`${v.title} Pattern`, 70)} value={v.metaTitle ?? ""} onChange={(e) => set("metaTitle", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="metaDescription" className="label">Meta description <span className="font-normal text-muted">({(v.metaDescription ?? "").length}/170)</span></label>
              <textarea id="metaDescription" rows={3} className="input" maxLength={170} placeholder={truncate(stripHtml(v.description), 160)} value={v.metaDescription ?? ""} onChange={(e) => set("metaDescription", e.target.value)} />
            </div>
            <div>
              <label htmlFor="rating" className="label">Rating (0–5)</label>
              <input id="rating" type="number" min={0} max={5} step="0.1" className="input" value={v.rating} onChange={(e) => set("rating", Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="reviewCount" className="label">Review count</label>
              <input id="reviewCount" type="number" min={0} className="input" value={v.reviewCount} onChange={(e) => set("reviewCount", Number(e.target.value))} />
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="card space-y-3 p-5">
            <h2 className="font-heading font-semibold">Status</h2>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Published</span>
              <input type="checkbox" role="switch" className="h-5 w-9 accent-[rgb(var(--color-primary))]" checked={v.status === "published"} onChange={(e) => set("status", e.target.checked ? "published" : "draft")} />
            </label>
          </section>
          <section className="card space-y-2 p-5">
            <h2 className="mb-1 font-heading font-semibold">Flags</h2>
            {FLAG_FIELDS.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 py-0.5 text-sm">
                <span>{label}</span>
                <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--color-primary))]" checked={v[k]} onChange={(e) => set(k, e.target.checked)} />
              </label>
            ))}
          </section>
          <section aria-label="Live preview">
            <h2 className="mb-2 font-heading text-sm font-semibold text-muted">Live card preview</h2>
            <div className="pointer-events-none max-w-[280px]">
              <ProductCard product={preview} showAd={v.isSponsored} />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
