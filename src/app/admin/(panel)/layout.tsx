import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminUiProvider } from "@/components/admin/toast";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const [messages, reviews] = await Promise.all([prisma.message.count({ where: { isRead: false } }), prisma.review.count({ where: { status: "pending" } })]);
  return (
    <AdminUiProvider>
      <div className="min-h-screen bg-cream">
        <AdminSidebar email={session.email} counts={{ messages, reviews }} />
        <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">{children}</main>
      </div>
    </AdminUiProvider>
  );
}
