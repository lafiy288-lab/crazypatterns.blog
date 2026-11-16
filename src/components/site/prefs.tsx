"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Currency = "USD" | "EUR";
type Prefs = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  ready: boolean;
};

const PrefsContext = createContext<Prefs | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) – keep in memory only */
  }
};

/** Favorites, currency and theme live in localStorage – visitors have no accounts. */
export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(read<string[]>("pn-favorites", []).filter((x) => typeof x === "string").slice(0, 500));
    setCurrencyState(read<Currency>("pn-currency", "USD") === "EUR" ? "EUR" : "USD");
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pn-favorites") setFavorites(read<string[]>("pn-favorites", []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      write("pn-favorites", next);
      return next;
    });
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    write("pn-currency", c);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("pn-theme", next);
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo<Prefs>(
    () => ({ favorites, isFavorite: (id) => favorites.includes(id), toggleFavorite, currency, setCurrency, theme, toggleTheme, ready }),
    [favorites, toggleFavorite, currency, setCurrency, theme, toggleTheme, ready],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
