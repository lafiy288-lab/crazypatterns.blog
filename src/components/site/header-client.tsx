"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Menu, Moon, PlayCircle, Sun, Gift, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { usePrefs } from "./prefs";
import { cn } from "@/lib/utils";

export type NavCategory = { name: string; slug: string; image: string | null; subcategories: string[] };

type Props = { siteName: string; tagline: string; logo: string | null; categories: NavCategory[] };

export function HeaderClient({ siteName, tagline, logo, categories }: Props) {
  const { favorites, ready, currency, setCurrency, theme, toggleTheme } = usePrefs();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
      <div className="bg-primary text-white">
        <div className="container-page flex h-9 items-center justify-between text-xs font-medium">
          <nav aria-label="Quick links" className="flex items-center gap-5">
            <Link href="/free-patterns" className="inline-flex items-center gap-1.5 hover:underline">
              <Gift className="h-3.5 w-3.5" aria-hidden /> Free patterns
            </Link>
            <Link href="/search?video=1" className="inline-flex items-center gap-1.5 hover:underline">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden /> Patterns with video tutorial
            </Link>
          </nav>
          <span className="hidden opacity-90 md:block">Instant PDF downloads from independent designers</span>
        </div>
      </div>

      <div className="container-page flex h-[72px] items-center gap-3 md:gap-6">
        <button className="btn-ghost -ml-2 p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </button>
        <Logo siteName={siteName} tagline={tagline} logo={logo} />

        <div ref={menuRef} className="relative hidden lg:block">
          <button
            className={cn("btn-ghost px-3", menuOpen && "bg-primary/10 text-primary")}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mega-menu"
          >
            Browse <ChevronDown className={cn("h-4 w-4 transition", menuOpen && "rotate-180")} aria-hidden />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                id="mega-menu"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="card absolute left-0 top-14 z-50 grid w-[760px] grid-cols-3 gap-6 p-6"
              >
                {categories.map((c) => (
                  <div key={c.slug}>
                    <Link href={`/category/${c.slug}`} className="group mb-2 flex items-center gap-3">
                      {c.image && <Image src={c.image} alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />}
                      <span className="font-heading font-semibold group-hover:text-primary">{c.name}</span>
                    </Link>
                    <ul className="space-y-1 pl-1">
                      {c.subcategories.slice(0, 5).map((s) => (
                        <li key={s}>
                          <Link href={`/category/${c.slug}?sub=${encodeURIComponent(s)}`} className="text-sm text-muted hover:text-primary">
                            {s}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="col-span-3 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Link href="/categories" className="btn-outline py-2">All categories</Link>
                  <Link href="/search?flag=bestseller" className="btn-outline py-2">Bestsellers</Link>
                  <Link href="/search?flag=new&sort=newest" className="btn-outline py-2">New arrivals</Link>
                  <Link href="/search?sale=1" className="btn-outline py-2">On sale</Link>
                  <Link href="/articles" className="btn-outline py-2">Articles</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SearchBar className="hidden max-w-2xl flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <label className="sr-only" htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "USD" | "EUR")}
            className="hidden h-10 rounded-xl border border-line bg-card px-2 text-xs font-semibold sm:block"
            aria-label="Language and currency"
          >
            <option value="USD">EN · USD $</option>
            <option value="EUR">EN · EUR €</option>
          </select>
          <button className="btn-ghost p-2.5" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link href="/favorites" className="btn-ghost relative p-2.5" aria-label={`Favorites (${favorites.length})`}>
            <Heart className="h-5 w-5" />
            {ready && favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-strong px-1 text-[10px] font-bold text-white">
                {favorites.length > 99 ? "99+" : favorites.length}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchBar />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.nav
              aria-label="Main menu"
              className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm overflow-y-auto bg-cream p-5 shadow-lift"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo siteName={siteName} />
                <button className="btn-ghost p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`} className="flex items-center gap-3 rounded-xl p-2 font-medium hover:bg-primary/10">
                      {c.image && <Image src={c.image} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />}
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-1 border-t border-line pt-4 text-sm">
                {[
                  ["/free-patterns", "Free patterns"],
                  ["/search?video=1", "Patterns with video"],
                  ["/search?flag=bestseller", "Bestsellers"],
                  ["/articles", "Articles"],
                  ["/favorites", "Favorites"],
                  ["/contact", "Contact"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="block rounded-xl p-2 hover:bg-primary/10">
                    {label}
                  </Link>
                ))}
              </div>
              <div className="mt-6">
                <label htmlFor="currency-m" className="label">Currency</label>
                <select id="currency-m" value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "EUR")} className="input">
                  <option value="USD">English · USD $</option>
                  <option value="EUR">English · EUR €</option>
                </select>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
