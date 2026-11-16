"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ProductCardData } from "@/lib/types";
import { pickSrc } from "@/lib/image-src";
import { usePrefs } from "./prefs";
import { formatMoney, cn } from "@/lib/utils";

/** Search input with debounced live suggestions (ARIA combobox pattern). */
export function SearchBar({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const { currency } = usePrefs();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&perPage=6`, { signal: ctrl.signal });
        const json = await res.json();
        setItems(json.items ?? []);
        setOpen(true);
        setActive(-1);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) {
      router.push(`/product/${items[active].slug}`);
    } else if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <form ref={boxRef} role="search" onSubmit={submit} className={cn("relative w-full", className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search patterns
      </label>
      <input
        id={`${listId}-input`}
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search everything, e.g. crochet flowers"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className="input h-11 rounded-full pl-11 pr-24"
      />
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <button type="submit" className="btn-primary absolute right-1 top-1 h-9 rounded-full px-4 py-0 text-xs">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Searching" /> : "Search"}
      </button>
      {open && q.trim().length >= 2 && (
        <ul id={listId} role="listbox" className="card absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-auto p-2">
          {items.length === 0 && !loading && <li className="px-3 py-4 text-sm text-muted">No patterns found for “{q}”.</li>}
          {items.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                router.push(`/product/${p.slug}`);
                setOpen(false);
              }}
              className={cn("flex cursor-pointer items-center gap-3 rounded-xl p-2", i === active && "bg-primary/10")}
            >
              <Image src={pickSrc(p.image, "thumb")} alt="" width={44} height={55} className="h-[55px] w-11 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.title}</span>
                <span className="block text-xs text-muted">by {p.designerName}</span>
              </span>
              <span className="text-sm font-semibold">{p.isFree ? "Free" : formatMoney(p.price, currency)}</span>
            </li>
          ))}
          {items.length > 0 && (
            <li className="border-t border-line pt-1">
              <button type="submit" className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-primary/10">
                See all results for “{q.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}
    </form>
  );
}
