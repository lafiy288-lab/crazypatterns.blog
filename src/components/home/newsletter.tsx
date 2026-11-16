"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; message?: string }>({ status: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not subscribe");
      setState({ status: "done", message: json.message });
      setEmail("");
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  };

  return (
    <section aria-labelledby="newsletter-title" className="container-page py-10">
      <div className="relative overflow-hidden rounded-[28px] bg-primary px-6 py-12 text-white sm:px-12">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/40 blur-2xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <Mail className="mx-auto mb-4 h-10 w-10 opacity-90" aria-hidden />
          <h2 id="newsletter-title" className="text-3xl font-bold">Win shopping credit every month!</h2>
          <p className="mt-3 text-white">Subscribe for new releases, free patterns and a monthly draw for pattern credit. Unsubscribe any time.</p>
          <form onSubmit={submit} className="mt-7 flex flex-col gap-3 sm:flex-row" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="h-12 flex-1 rounded-xl border-0 bg-white px-4 text-ink placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-accent/50"
            />
            <button className="btn-accent h-12 px-7" disabled={state.status === "loading"}>
              {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Subscribe
            </button>
          </form>
          <p role="status" className="mt-3 min-h-5 text-sm">
            {state.status === "done" && state.message}
            {state.status === "error" && <span className="font-semibold text-amber-200">{state.message}</span>}
          </p>
        </div>
      </div>
    </section>
  );
}
