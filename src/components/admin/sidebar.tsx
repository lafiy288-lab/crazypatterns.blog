"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, FolderTree, Home, Inbox, LayoutDashboard, LogOut, Mail, Menu, Package, Palette, Star, Upload, Users, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/import", label: "Bulk import", icon: Upload },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/designers", label: "Designers", icon: Users },
  { href: "/admin/articles", label: "Articles", icon: BookOpen },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Palette },
];

export function AdminSidebar({ email, counts }: { email: string; counts: { messages: number; reviews: number } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const badge = (href: string) => (href === "/admin/messages" ? counts.messages : href === "/admin/reviews" ? counts.reviews : 0);

  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-heading text-sm font-bold text-white">PN</span>
        <div>
          <p className="font-heading text-sm font-semibold">PatternNest</p>
          <p className="text-[11px] text-muted">Admin</p>
        </div>
      </div>
      <ul className="flex-1 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          const n = badge(href);
          return (
            <li key={href}>
              <Link href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition", active ? "bg-primary text-white" : "text-ink hover:bg-primary/10")}>
                <Icon className="h-4 w-4" aria-hidden />
                <span className="flex-1">{label}</span>
                {n > 0 && <span className={cn("chip", active ? "bg-white/20 text-white" : "bg-accent-strong text-white")}>{n}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 space-y-1 border-t border-line pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-primary/10"><ExternalLink className="h-4 w-4" aria-hidden /> View site</Link>
        <form action="/api/admin/logout" method="post">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-primary/10"><LogOut className="h-4 w-4" aria-hidden /> Log out</button>
        </form>
        <p className="truncate px-3 pt-2 text-xs text-muted">{email}</p>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-card px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-ghost p-2" aria-label="Open admin menu"><Menu className="h-5 w-5" /></button>
        <span className="font-heading font-semibold">PatternNest Admin</span>
      </div>
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-line bg-card p-4 lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-card p-4">
            <button onClick={() => setOpen(false)} className="btn-ghost absolute right-3 top-3 p-2" aria-label="Close menu"><X className="h-5 w-5" /></button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
