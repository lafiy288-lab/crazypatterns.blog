"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; message?: string }>({ status: "idle" });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rating) return setState({ status: "error", message: "Please choose a star rating." });
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setState({ status: "loading" });
    const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, rating, productId }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const first = json.issues ? Object.values(json.issues as Record<string, string[]>)[0]?.[0] : undefined;
      return setState({ status: "error", message: first || json.error || "Could not submit review" });
    }
    setState({ status: "done" });
  };

  if (state.status === "done") {
    return <p role="status" className="card p-5 text-sm">Thank you! Your review was submitted and will appear after moderation.</p>;
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5" noValidate>
      <h3 className="font-heading text-lg font-semibold">Write a review</h3>
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="p-0.5"
            >
              <Star className={cn("h-7 w-7 transition", (hover || rating) >= n ? "text-amber-400" : "text-line")} fill="currentColor" strokeWidth={0} />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="r-name" className="label">Name</label>
        <input id="r-name" name="name" className="input" required minLength={2} maxLength={60} autoComplete="given-name" />
      </div>
      <div>
        <label htmlFor="r-text" className="label">Review</label>
        <textarea id="r-text" name="text" rows={4} className="input" required minLength={10} maxLength={2000} />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.status === "error" && <p role="alert" className="text-sm font-medium text-red-600">{state.message}</p>}
      <button className="btn-primary" disabled={state.status === "loading"}>
        {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Submit review
      </button>
    </form>
  );
}
