import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok } from "@/lib/api";
import { isRunning, rollbackImport } from "@/lib/import/processor";

export const runtime = "nodejs";

/** POST: rolls back an entire completed (or failed) import. */
export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.importJob.findUnique({ where: { id }, select: { status: true } });
  if (!job) throw new ApiError("Import not found", 404);
  if (isRunning(id)) throw new ApiError("Wait for the import to finish before rolling back");
  // "running" without a live runner means the server restarted mid-import; allow undoing it.
  if (!["completed", "failed", "running"].includes(job.status)) throw new ApiError("Only completed or failed imports can be rolled back");
  const result = await rollbackImport(id);
  return ok(result);
});
