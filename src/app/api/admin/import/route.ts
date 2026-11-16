import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok } from "@/lib/api";
import { autoMap } from "@/lib/import/fields";
import { MAX_IMPORT_BYTES, parseImportFile } from "@/lib/import/parse";
import { flushRevalidation } from "@/lib/import/processor";
import { writeRows } from "@/lib/import/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: recent import jobs (history). */
export const GET = handle(async () => {
  await requireAdmin();
  flushRevalidation();
  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, fileName: true, status: true, totalRows: true, processedRows: true, created: true, updated: true, skipped: true, failed: true, createdAt: true, finishedAt: true },
  });
  return ok({ jobs });
});

/** POST multipart (file): parses CSV/XLSX/JSON, stores rows on disk and creates an ImportJob. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError("Please choose a file to upload");
  if (file.size > MAX_IMPORT_BYTES) throw new ApiError("File is larger than 20 MB", 413);
  const name = file.name.slice(0, 200);
  if (!/\.(csv|xlsx|json)$/i.test(name)) throw new ApiError("Unsupported file type. Use .csv, .xlsx or .json", 415);

  let parsed;
  try {
    parsed = await parseImportFile(Buffer.from(await file.arrayBuffer()), name);
  } catch (e) {
    throw new ApiError(`Could not read file: ${(e as Error).message}`, 422);
  }
  const mapping = autoMap(parsed.headers);
  const job = await prisma.importJob.create({
    data: { fileName: name, totalRows: parsed.rows.length, headers: JSON.stringify(parsed.headers), mapping: JSON.stringify(mapping) },
  });
  await writeRows(job.id, parsed.rows);
  return ok({ jobId: job.id, fileName: name, totalRows: parsed.rows.length, headers: parsed.headers, mapping, sample: parsed.rows.slice(0, 3) }, { status: 201 });
});
