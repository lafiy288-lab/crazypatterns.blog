import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/api";

// Prefix cells that start with a formula character so spreadsheets don't execute them.
const csvCell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export const GET = handle(async () => {
  await requireAdmin();
  const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  const csv = ["email,subscribed_at", ...rows.map((r) => `${csvCell(r.email)},${r.createdAt.toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
});
