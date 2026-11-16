import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { page: number; pages: number; basePath: string; params: Record<string, string | undefined> };

export function Pagination({ page, pages, basePath, params }: Props) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const list = [...nums].sort((a, b) => a - b);
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <PageLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - list[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn("grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-medium transition", n === page ? "bg-primary text-white" : "border border-line bg-card hover:border-primary")}
          >
            {n}
          </Link>
        </span>
      ))}
      <PageLink href={href(page + 1)} disabled={page >= pages} label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled className="grid h-10 w-10 place-items-center rounded-xl border border-line text-muted opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-card hover:border-primary">
      {children}
    </Link>
  );
}
