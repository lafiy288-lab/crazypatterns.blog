import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle } from "@/lib/api";
import { parseJson } from "@/lib/json";
import { errorsToCsv, type RowError } from "@/lib/import/validate";
import type { ImageFailure } from "@/lib/import/processor";

export const runtime = "nodejs";

/** GET: CSV error report (row errors + image failures) for download. */
export const GET = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.importJob.findUnique({ where: { id }, select: { errors: true, imageFailures: true, fileName: true } });
  if (!job) return fail("Import not found", 404);
  const errors = parseJson<RowError[]>(job.errors, []);
  const images = parseJson<ImageFailure[]>(job.imageFailures, []).map((f) => ({ row: f.row, sku: f.sku, field: "image", message: `${f.url}: ${f.error}` }));
  const csv = errorsToCsv([...errors, ...images].sort((a, b) => a.row - b.row));
  const name = job.fileName.replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "_");
  return new Response("﻿" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-errors.csv"`, "Cache-Control": "no-store" },
  });
});
