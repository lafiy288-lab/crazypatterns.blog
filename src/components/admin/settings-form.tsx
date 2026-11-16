"use client";

import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { PageHeader } from "./page-header";
import { ImageUploader } from "./image-uploader";
import { adminApi, useAdminUi } from "./toast";

const COLOR_LABELS: Record<keyof SiteSettings["colors"], string> = { primary: "Primary", accent: "Accent", background: "Background", text: "Text" };

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const { toast } = useAdminUi();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminApi("/api/admin/settings", { method: "PUT", json: s });
      toast("Settings saved — the site now uses the new branding");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const setCol = (i: number, col: SiteSettings["footer"][number]) => setS({ ...s, footer: s.footer.map((c, j) => (j === i ? col : c)) });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }}>
      <PageHeader title="Settings" description="Branding, colors and footer links." actions={<button className="btn-primary" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings</button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4 p-6">
          <h2 className="font-heading text-lg font-semibold">Brand</h2>
          <div>
            <label htmlFor="s-name" className="label">Site name</label>
            <input id="s-name" className="input" value={s.siteName} onChange={(e) => setS({ ...s, siteName: e.target.value })} />
          </div>
          <div>
            <label htmlFor="s-tag" className="label">Tagline</label>
            <input id="s-tag" className="input" value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} />
          </div>
          <ImageUploader single label="Logo (square works best)" value={s.logo ? [{ url: s.logo }] : []} onChange={(imgs) => setS({ ...s, logo: imgs[0] ? imgs[0].thumb || imgs[0].url : null })} />
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Brand colors</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(COLOR_LABELS) as (keyof SiteSettings["colors"])[]).map((k) => (
              <div key={k}>
                <label htmlFor={`col-${k}`} className="label">{COLOR_LABELS[k]}</label>
                <div className="flex gap-2">
                  <input type="color" aria-label={`${COLOR_LABELS[k]} color picker`} className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-card p-1" value={s.colors[k]} onChange={(e) => setS({ ...s, colors: { ...s.colors, [k]: e.target.value.toUpperCase() } })} />
                  <input id={`col-${k}`} className="input font-mono" value={s.colors[k]} onChange={(e) => setS({ ...s, colors: { ...s.colors, [k]: e.target.value } })} pattern="#[0-9a-fA-F]{6}" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl p-4" style={{ background: s.colors.background, color: s.colors.text }}>
            <span className="font-heading font-semibold">Preview</span>
            <span className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: s.colors.primary }}>Primary button</span>
            <span className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: s.colors.accent }}>Accent</span>
          </div>
          <button type="button" className="btn-ghost mt-3 text-sm" onClick={() => setS({ ...s, colors: { primary: "#0F766E", accent: "#F97316", background: "#FFFBF5", text: "#1E293B" } })}>Reset to default colors</button>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Footer links</h2>
          {s.footer.length < 6 && <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => setS({ ...s, footer: [...s.footer, { title: "New column", links: [] }] })}><Plus className="h-3.5 w-3.5" /> Column</button>}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {s.footer.map((col, i) => (
            <fieldset key={i} className="rounded-xl border border-line p-4">
              <legend className="sr-only">Footer column {i + 1}</legend>
              <div className="mb-3 flex gap-2">
                <input aria-label="Column title" className="input font-semibold" value={col.title} onChange={(e) => setCol(i, { ...col, title: e.target.value })} />
                <button type="button" className="btn-ghost p-2 text-red-600" onClick={() => setS({ ...s, footer: s.footer.filter((_, j) => j !== i) })} aria-label="Remove column"><Trash2 className="h-4 w-4" /></button>
              </div>
              <ul className="space-y-2">
                {col.links.map((l, k) => (
                  <li key={k} className="flex gap-1.5">
                    <input aria-label="Link label" className="input py-1.5 text-xs" value={l.label} onChange={(e) => setCol(i, { ...col, links: col.links.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) })} />
                    <input aria-label="Link URL" className="input py-1.5 font-mono text-xs" value={l.href} onChange={(e) => setCol(i, { ...col, links: col.links.map((x, j) => (j === k ? { ...x, href: e.target.value } : x)) })} />
                    <button type="button" className="btn-ghost p-1.5 text-red-600" onClick={() => setCol(i, { ...col, links: col.links.filter((_, j) => j !== k) })} aria-label="Remove link"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn-ghost mt-2 py-1 text-xs" onClick={() => setCol(i, { ...col, links: [...col.links, { label: "New link", href: "/" }] })}><Plus className="h-3.5 w-3.5" /> Link</button>
            </fieldset>
          ))}
        </div>
      </section>
    </form>
  );
}
