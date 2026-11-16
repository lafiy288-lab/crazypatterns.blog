"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Plus, Save, Search, X } from "lucide-react";
import type { HomepageSections, ProductImage, SiteSettings } from "@/lib/types";
import { pickSrc } from "@/lib/image-src";
import { cn } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { adminApi, useAdminUi } from "./toast";

type Mini = { id: string; title: string; sku: string; status: string; image: ProductImage | null };
type Data = { sections: HomepageSections; products: Record<string, Mini>; hero: SiteSettings["hero"]; counters: SiteSettings["counters"]; freeBanner: SiteSettings["freeBanner"] };

const SECTIONS: { key: keyof HomepageSections; title: string; size: number; hint: string }[] = [
  { key: "highlights", title: "Craft Highlights", size: 8, hint: "Falls back to products flagged Featured" },
  { key: "bestsellers", title: "Current Bestsellers", size: 8, hint: "Falls back to products flagged Bestseller" },
  { key: "sale", title: "On Sale", size: 4, hint: "Falls back to discounted products" },
  { key: "newArrivals", title: "New Arrivals", size: 8, hint: "Falls back to products flagged New" },
  { key: "sponsored", title: "Sponsored Products", size: 8, hint: "Falls back to products flagged Sponsored" },
  { key: "free", title: "Free Patterns", size: 4, hint: "Falls back to free products" },
];

export function HomepageManager() {
  const { toast } = useAdminUi();
  const [data, setData] = useState<Data | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<keyof HomepageSections | null>(null);

  useEffect(() => {
    adminApi<Data>("/api/admin/homepage").then(setData).catch((e) => toast(e.message, "error"));
  }, [toast]);

  if (!data) return <div className="space-y-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-32" />)}</div>;

  const setSection = (key: keyof HomepageSections, ids: string[]) => setData({ ...data, sections: { ...data.sections, [key]: ids } });
  const move = (key: keyof HomepageSections, from: number, to: number) => {
    const ids = [...data.sections[key]];
    if (to < 0 || to >= ids.length) return;
    const [x] = ids.splice(from, 1);
    ids.splice(to, 0, x);
    setSection(key, ids);
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi("/api/admin/homepage", { method: "PUT", json: { sections: data.sections, hero: data.hero, counters: data.counters, freeBanner: data.freeBanner } });
      toast("Homepage saved — changes are live");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Pick and order products for each section, and edit the hero text and counters."
        actions={<button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save homepage</button>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4 p-6">
          <h2 className="font-heading text-lg font-semibold">Hero</h2>
          <div>
            <label htmlFor="hero-title" className="label">Headline</label>
            <input id="hero-title" className="input" value={data.hero.title} onChange={(e) => setData({ ...data, hero: { ...data.hero, title: e.target.value } })} />
          </div>
          <div>
            <label htmlFor="hero-sub" className="label">Subtitle</label>
            <input id="hero-sub" className="input" value={data.hero.subtitle} onChange={(e) => setData({ ...data, hero: { ...data.hero, subtitle: e.target.value } })} />
          </div>
          <h2 className="pt-2 font-heading text-lg font-semibold">Free patterns banner</h2>
          <div>
            <label htmlFor="free-title" className="label">Title</label>
            <input id="free-title" className="input" value={data.freeBanner.title} onChange={(e) => setData({ ...data, freeBanner: { ...data.freeBanner, title: e.target.value } })} />
          </div>
          <div>
            <label htmlFor="free-text" className="label">Text</label>
            <textarea id="free-text" rows={2} className="input" value={data.freeBanner.text} onChange={(e) => setData({ ...data, freeBanner: { ...data.freeBanner, text: e.target.value } })} />
          </div>
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">“Why PatternNest” counters</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(data.counters) as (keyof Data["counters"])[]).map((k) => (
              <div key={k}>
                <label htmlFor={`c-${k}`} className="label capitalize">{k}</label>
                <input id={`c-${k}`} className="input" value={data.counters[k]} onChange={(e) => setData({ ...data, counters: { ...data.counters, [k]: e.target.value } })} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Numbers animate on the homepage. Examples: 117,900+ · 53M+ · 4.8★</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {SECTIONS.map((s) => {
          const ids = data.sections[s.key];
          return (
            <section key={s.key} className="card p-6" aria-labelledby={`sec-${s.key}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 id={`sec-${s.key}`} className="font-heading text-lg font-semibold">{s.title}</h2>
                  <p className="text-xs text-muted">{ids.length}/{s.size} picked · {s.hint}</p>
                </div>
                <button className="btn-outline py-1.5 text-xs" onClick={() => setPicker(s.key)} disabled={ids.length >= s.size}><Plus className="h-3.5 w-3.5" /> Add</button>
              </div>
              {ids.length === 0 ? (
                <p className="rounded-xl bg-cream p-4 text-sm text-muted">No products picked — automatic selection is used.</p>
              ) : (
                <ol className="space-y-2">
                  {ids.map((id, i) => {
                    const p = data.products[id];
                    return (
                      <li
                        key={id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => move(s.key, Number(e.dataTransfer.getData("text/plain")), i)}
                        className="flex items-center gap-3 rounded-xl border border-line bg-card p-2"
                      >
                        <GripVertical className="h-4 w-4 cursor-grab text-muted" aria-hidden />
                        <span className="w-5 text-xs text-muted">{i + 1}</span>
                        <Image src={pickSrc(p?.image, "thumb")} alt="" width={32} height={40} className="h-10 w-8 rounded-md object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p?.title ?? "Deleted product"}</span>
                          <span className={cn("text-xs", p?.status === "published" ? "text-muted" : "text-amber-700")}>{p ? `${p.sku}${p.status !== "published" ? " · draft (hidden)" : ""}` : id}</span>
                        </span>
                        <button className="btn-ghost p-1.5" onClick={() => move(s.key, i, i - 1)} aria-label="Move up" disabled={i === 0}><ArrowUp className="h-4 w-4" /></button>
                        <button className="btn-ghost p-1.5" onClick={() => move(s.key, i, i + 1)} aria-label="Move down" disabled={i === ids.length - 1}><ArrowDown className="h-4 w-4" /></button>
                        <button className="btn-ghost p-1.5 text-red-600" onClick={() => setSection(s.key, ids.filter((x) => x !== id))} aria-label="Remove"><X className="h-4 w-4" /></button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>

      {picker && (
        <ProductPicker
          exclude={data.sections[picker]}
          onClose={() => setPicker(null)}
          onPick={(p) => {
            setData({ ...data, products: { ...data.products, [p.id]: p }, sections: { ...data.sections, [picker]: [...data.sections[picker], p.id] } });
            const max = SECTIONS.find((s) => s.key === picker)!.size;
            if (data.sections[picker].length + 1 >= max) setPicker(null);
          }}
        />
      )}
    </>
  );
}

function ProductPicker({ exclude, onPick, onClose }: { exclude: string[]; onPick: (p: Mini) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Mini[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminApi<{ items: Mini[] }>(`/api/admin/products?status=published&perPage=20&q=${encodeURIComponent(q)}`);
        setItems(res.items);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Add product" className="card relative flex max-h-[80vh] w-full max-w-lg flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Add product</h2>
          <button className="btn-ghost p-2" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input autoFocus className="input pl-9" placeholder="Search published products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
        <ul className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
          {loading && <li className="py-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></li>}
          {!loading && items.filter((p) => !exclude.includes(p.id)).map((p) => (
            <li key={p.id}>
              <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-primary/10" onClick={() => onPick(p)}>
                <Image src={pickSrc(p.image, "thumb")} alt="" width={32} height={40} className="h-10 w-8 rounded-md object-cover" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.title}</span><span className="text-xs text-muted">{p.sku}</span></span>
                <Plus className="h-4 w-4 text-primary" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
