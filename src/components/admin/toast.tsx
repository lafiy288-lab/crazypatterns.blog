"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; type: "success" | "error"; message: string };
type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; danger?: boolean };

type Ctx = {
  toast: (message: string, type?: Toast["type"]) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
};

const AdminUiContext = createContext<Ctx | null>(null);

/** Toast notifications and promise-based confirm dialogs for the admin area. */
export function AdminUiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setDialog({ ...opts, resolve })), []);

  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <AdminUiContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="card pointer-events-auto flex items-start gap-3 p-3.5" role={t.type === "error" ? "alert" : "status"}>
              {t.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />}
              <p className="flex-1 text-sm">{t.message}</p>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss" className="text-muted hover:text-ink"><X className="h-4 w-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50" onClick={() => close(false)} />
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="card relative w-full max-w-md p-6">
            <h2 id="confirm-title" className="font-heading text-lg font-semibold">{dialog.title}</h2>
            {dialog.message && <p className="mt-2 text-sm text-muted">{dialog.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-outline" onClick={() => close(false)}>Cancel</button>
              <button autoFocus className={dialog.danger ? "btn bg-red-600 text-white hover:bg-red-700" : "btn-primary"} onClick={() => close(true)}>
                {dialog.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminUiContext.Provider>
  );
}

export function useAdminUi() {
  const ctx = useContext(AdminUiContext);
  if (!ctx) throw new Error("useAdminUi must be used inside AdminUiProvider");
  return ctx;
}

/** fetch wrapper for /api/admin that throws readable errors. */
export async function adminApi<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401) {
    window.location.href = `/admin/login?next=${encodeURIComponent(location.pathname)}`;
    throw new Error("Session expired");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issues = data.issues ? Object.entries(data.issues as Record<string, string[]>).map(([k, v]) => `${k}: ${v[0]}`).join(", ") : "";
    throw new Error([data.error || `Request failed (${res.status})`, issues].filter(Boolean).join(" – "));
  }
  return data as T;
}
