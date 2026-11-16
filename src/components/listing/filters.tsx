"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { DIFFICULTIES, LANGUAGES, cn } from "@/lib/utils";

type Props = { subcategories?: string[]; hide?: ("free" | "category")[] };

/** URL-driven filter sidebar: every change updates the query string so results are shareable. */
export function Filters({ subcategories = [], hide = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  useEffect(() => {
    setMin(params.get("min") ?? "");
    setMax(params.get("max") ?? "");
  }, [params]);

  const update = (changes: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
  };

  const activeCount = ["min", "max", "rating", "free", "video", "lang", "difficulty", "sub"].filter((k) => params.get(k)).length;

  const body = (
    <div className={cn("space-y-6 transition", pending && "opacity-60")}>
      {subcategories.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-heading text-sm font-semibold">Type</legend>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((s) => {
              const active = params.get("sub") === s;
              return (
                <button key={s} type="button" aria-pressed={active} onClick={() => update({ sub: active ? null : s })} className={cn("chip border px-3 py-1.5 text-xs", active ? "border-primary bg-primary text-white" : "border-line bg-card hover:border-primary")}>
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 font-heading text-sm font-semibold">Price (USD)</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min, max });
          }}
        >
          <label className="sr-only" htmlFor="f-min">Minimum price</label>
          <input id="f-min" inputMode="decimal" className="input py-2" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))} />
          <span className="text-muted">–</span>
          <label className="sr-only" htmlFor="f-max">Maximum price</label>
          <input id="f-max" inputMode="decimal" className="input py-2" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))} />
          <button className="btn-outline px-3 py-2">Go</button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-heading text-sm font-semibold">Rating</legend>
        {[
          ["", "Any rating"],
          ["4.5", "4.5 ★ & up"],
          ["4", "4 ★ & up"],
        ].map(([v, label]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
            <input type="radio" name="rating" className="accent-[rgb(var(--color-primary))]" checked={(params.get("rating") ?? "") === v} onChange={() => update({ rating: v })} />
            {label}
          </label>
        ))}
      </fieldset>

      {!hide.includes("free") && (
        <fieldset>
          <legend className="mb-2 font-heading text-sm font-semibold">Price type</legend>
          {[
            ["", "All"],
            ["free", "Free only"],
            ["paid", "Paid only"],
          ].map(([v, label]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="radio" name="free" className="accent-[rgb(var(--color-primary))]" checked={(params.get("free") ?? "") === v} onChange={() => update({ free: v })} />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend className="sr-only">Video</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--color-primary))]" checked={params.get("video") === "1"} onChange={(e) => update({ video: e.target.checked ? "1" : null })} />
          With video tutorial
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-heading text-sm font-semibold">Difficulty</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => {
            const active = params.get("difficulty") === d;
            return (
              <button key={d} type="button" aria-pressed={active} onClick={() => update({ difficulty: active ? null : d })} className={cn("chip border px-3 py-1.5 text-xs capitalize", active ? "border-primary bg-primary text-white" : "border-line bg-card hover:border-primary")}>
                {d}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-heading text-sm font-semibold">
          <label htmlFor="f-lang">Language</label>
        </legend>
        <select id="f-lang" className="input" value={params.get("lang") ?? ""} onChange={(e) => update({ lang: e.target.value })}>
          <option value="">Any language</option>
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </fieldset>

      {activeCount > 0 && (
        <button type="button" className="btn-ghost w-full text-accent-ink" onClick={() => update({ min: null, max: null, rating: null, free: null, video: null, lang: null, difficulty: null, sub: null })}>
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <button type="button" className="btn-outline w-full lg:hidden" onClick={() => setMobileOpen(true)} aria-expanded={mobileOpen}>
        <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters {activeCount > 0 && `(${activeCount})`}
      </button>
      <aside aria-label="Filters" className="card sticky top-32 hidden p-5 lg:block">
        {body}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-cream p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Filters</h2>
              <button className="btn-ghost p-2" onClick={() => setMobileOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            {body}
            <button className="btn-primary mt-6 w-full" onClick={() => setMobileOpen(false)}>Show results</button>
          </div>
        </div>
      )}
    </>
  );
}
