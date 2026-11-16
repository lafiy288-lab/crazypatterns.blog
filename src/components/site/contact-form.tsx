"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

type Props = { productId?: string; defaultSubject?: string; compact?: boolean };

export function ContactForm({ productId, defaultSubject = "", compact }: Props) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; message?: string; issues?: Record<string, string[]> }>({ status: "idle" });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, productId }) });
      const json = await res.json();
      if (!res.ok) return setState({ status: "error", message: json.error, issues: json.issues });
      setState({ status: "done" });
    } catch {
      setState({ status: "error", message: "Network error, please try again." });
    }
  };

  if (state.status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden />
        <p className="font-heading text-lg font-semibold">Thanks, your message was sent!</p>
        <p className="text-sm text-muted">We usually reply within one business day.</p>
      </div>
    );
  }

  const err = (k: string) => state.issues?.[k]?.[0];

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label htmlFor="c-name" className="label">Name</label>
          <input id="c-name" name="name" required minLength={2} className="input" autoComplete="name" aria-invalid={!!err("name")} aria-describedby="c-name-err" />
          <p id="c-name-err" className="mt-1 text-xs text-red-600">{err("name")}</p>
        </div>
        <div>
          <label htmlFor="c-email" className="label">Email</label>
          <input id="c-email" name="email" type="email" required className="input" autoComplete="email" aria-invalid={!!err("email")} aria-describedby="c-email-err" />
          <p id="c-email-err" className="mt-1 text-xs text-red-600">{err("email")}</p>
        </div>
      </div>
      <div>
        <label htmlFor="c-subject" className="label">Subject</label>
        <input id="c-subject" name="subject" defaultValue={defaultSubject} className="input" />
      </div>
      <div>
        <label htmlFor="c-body" className="label">Message</label>
        <textarea id="c-body" name="body" required minLength={10} rows={compact ? 4 : 6} className="input" aria-invalid={!!err("body")} aria-describedby="c-body-err" />
        <p id="c-body-err" className="mt-1 text-xs text-red-600">{err("body")}</p>
      </div>
      {/* Honeypot field for bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.status === "error" && <p role="alert" className="text-sm font-medium text-red-600">{state.message}</p>}
      <button className="btn-primary w-full sm:w-auto" disabled={state.status === "loading"}>
        {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Send message
      </button>
    </form>
  );
}
