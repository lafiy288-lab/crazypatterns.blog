import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { startImport } from "@/lib/import/processor";

export const runtime = "nodejs";

const bodySchema = z.object({ duplicateMode: z.enum(["skip", "update"]).default("skip"), asDraft: z.boolean().default(false) });

/** POST { duplicateMode, asDraft }: starts background processing in batches of 100. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const options = await parseBody(req, bodySchema);
  const job = await prisma.importJob.findUnique({ where: { id } });
  if (!job) throw new ApiError("Import not found", 404);
  if (job.status !== "validated") throw new ApiError(job.status === "uploaded" ? "Validate the file before running the import" : "This import has already been run");

  // Atomic status flip guards against double-clicks starting two runs.
  const claimed = await prisma.importJob.updateMany({
    where: { id, status: "validated" },
    data: { status: "running", options: JSON.stringify(options), processedRows: 0, created: 0, updated: 0, skipped: 0, failed: 0, errors: "[]", imageFailures: "[]" },
  });
  if (!claimed.count) throw new ApiError("This import is already running");
  startImport(id);
  return ok({ started: true }, { status: 202 });
});
