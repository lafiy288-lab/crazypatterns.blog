import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="card w-full max-w-sm p-8">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary font-heading font-bold text-white">PN</span>
        <h1 className="text-center text-2xl font-bold">Admin sign in</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">PatternNest control panel</p>
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
