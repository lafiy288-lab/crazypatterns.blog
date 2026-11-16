import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { parseJson } from "@/lib/json";
import { flushRevalidation, isRunning } from "@/lib/import/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: job status and progress (polled by the wizard). */
export const GET = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  flushRevalidation();
  const { id } = await params;
  const job = await prisma.importJob.findUnique({ where: { id } });
  if (!job) return fail("Import not found", 404);
  const errors = parseJson<unknown[]>(job.errors, []);
  const imageFailures = parseJson<unknown[]>(job.imageFailures, []);
  return ok({
    id: job.id,
    fileName: job.fileName,
    status: job.status,
    running: isRunning(job.id),
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    created: job.created,
    updated: job.updated,
    skipped: job.skipped,
    failed: job.failed,
    hasImageZip: job.hasImageZip,
    options: parseJson(job.options, {}),
    errorCount: errors.length,
    errors: errors.slice(0, 50),
    imageFailureCount: imageFailures.length,
    imageFailures: imageFailures.slice(0, 50),
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
  });
});
