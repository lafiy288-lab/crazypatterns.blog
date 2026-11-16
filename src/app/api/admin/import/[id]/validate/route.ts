import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { parseJson } from "@/lib/json";
import { IMPORT_FIELDS } from "@/lib/import/fields";
import { readRows } from "@/lib/import/store";
import { lineOf, validateAll } from "@/lib/import/validate";

export const runtime = "nodejs";

const bodySchema = z.object({ mapping: z.record(z.string().max(60), z.string().max(200)) });

/** POST { mapping }: validates every row; returns a 50-row preview and error totals. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.importJob.findUnique({ where: { id } });
  if (!job) throw new ApiError("Import not found", 404);
  if (!["uploaded", "validated"].includes(job.status)) throw new ApiError("This import has already been run");

  const { mapping: rawMapping } = await parseBody(req, bodySchema);
  const headers = parseJson<string[]>(job.headers, []);
  const known = new Set(IMPORT_FIELDS.map((f) => f.key));
  const mapping = Object.fromEntries(Object.entries(rawMapping).filter(([k, v]) => known.has(k) && v && headers.includes(v)));
  const missing = IMPORT_FIELDS.filter((f) => f.required && !mapping[f.key]).map((f) => f.label);
  if (missing.length) throw new ApiError(`Please map the required columns: ${missing.join(", ")}`, 422);

  const rows = await readRows(id);
  const { results, errors } = validateAll(rows, mapping);
  const invalidRows = results.filter((r) => !r.row).length;

  await prisma.importJob.update({ where: { id }, data: { mapping: JSON.stringify(mapping), errors: JSON.stringify(errors.slice(0, 5000)), status: "validated" } });

  const preview = results.slice(0, 50).map((r, i) => {
    const get = (k: string) => (mapping[k] ? rows[i][mapping[k]] ?? "" : "");
    return {
      line: lineOf(i),
      sku: get("sku"),
      title: get("title"),
      category: get("category"),
      designer: get("designer"),
      price: get("price"),
      status: get("status"),
      images: get("image_urls") ? get("image_urls").split("|").filter(Boolean).length : 0,
      errors: r.errors.map((e) => ({ field: e.field, message: e.message })),
    };
  });
  return ok({ totalRows: rows.length, validRows: rows.length - invalidRows, invalidRows, errorCount: errors.length, preview });
});
