"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, ImageIcon, Loader2, RotateCcw } from "lucide-react";
import { adminApi, useAdminUi } from "@/components/admin/toast";
import { IMPORT_FIELDS, type Mapping } from "@/lib/import/fields";
import { cn, formatDate } from "@/lib/utils";
import { Dropzone } from "./dropzone";

type Upload = { jobId: string; fileName: string; totalRows: number; headers: string[]; mapping: Mapping; sample: Record<string, string>[] };
type PreviewRow = { line: number; sku: string; title: string; category: string; designer: string; price: string; status: string; images: number; errors: { field: string; message: string }[] };
type Validation = { totalRows: number; validRows: number; invalidRows: number; errorCount: number; preview: PreviewRow[] };
type JobStatus = {
  id: string;
  status: string;
  running: boolean;
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errorCount: number;
  errors: { row: number; sku: string; field: string; message: string }[];
  imageFailureCount: number;
  imageFailures: { row: number; sku: string; url: string; error: string }[];
};
type HistoryJob = { id: string; fileName: string; status: string; totalRows: number; created: number; updated: number; skipped: number; failed: number; createdAt: string };

const STEPS = ["Upload", "Map columns", "Validate", "Options", "Run"];

export function ImportWizard() {
  const { toast, confirm } = useAdminUi();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [validation, setValidation] = useState<Validation | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");
  const [asDraft, setAsDraft] = useState(false);
  const [zipInfo, setZipInfo] = useState<{ files: number; matchedSkus: number; totalSkus: number } | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [history, setHistory] = useState<HistoryJob[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory((await adminApi<{ jobs: HistoryJob[] }>("/api/admin/import")).jobs);
    } catch {
      /* shown on next action */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Poll job progress every second while it runs.
  useEffect(() => {
    if (!job || !["running"].includes(job.status)) return;
    const t = setInterval(async () => {
      try {
        const next = await adminApi<JobStatus>(`/api/admin/import/${job.id}`);
        setJob(next);
        if (next.status !== "running") {
          loadHistory();
          if (next.status === "completed") toast(`Import finished: ${next.created} created, ${next.updated} updated`);
          else toast("Import failed – see the error report", "error");
        }
      } catch {
        /* keep polling */
      }
    }, 1000);
    return () => clearInterval(t);
  }, [job, loadHistory, toast]);

  const reset = () => {
    setStep(0);
    setUpload(null);
    setMapping({});
    setValidation(null);
    setZipInfo(null);
    setJob(null);
    setAsDraft(false);
    setDuplicateMode("skip");
  };

  const uploadFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast("File is larger than 20 MB", "error");
    if (!/\.(csv|xlsx|json)$/i.test(file.name)) return toast("Please upload a .csv, .xlsx or .json file", "error");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminApi<Upload>("/api/admin/import", { method: "POST", body: fd });
      setUpload(res);
      setMapping(res.mapping);
      setStep(1);
      toast(`${res.totalRows.toLocaleString()} rows found in ${res.fileName}`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const validate = async () => {
    if (!upload) return;
    setBusy(true);
    try {
      setValidation(await adminApi<Validation>(`/api/admin/import/${upload.jobId}/validate`, { method: "POST", json: { mapping } }));
      setStep(2);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const uploadZip = async (file: File) => {
    if (!upload) return;
    if (file.size > 20 * 1024 * 1024) return toast("ZIP is larger than 20 MB", "error");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminApi<{ files: number; matchedSkus: number; totalSkus: number }>(`/api/admin/import/${upload.jobId}/images`, { method: "POST", body: fd });
      setZipInfo(res);
      toast(`${res.files} images extracted, ${res.matchedSkus} SKUs matched`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    if (!upload) return;
    setBusy(true);
    try {
      await adminApi(`/api/admin/import/${upload.jobId}/run`, { method: "POST", json: { duplicateMode, asDraft } });
      setJob({ id: upload.jobId, status: "running", running: true, totalRows: upload.totalRows, processedRows: 0, created: 0, updated: 0, skipped: 0, failed: 0, errorCount: 0, errors: [], imageFailureCount: 0, imageFailures: [] });
      setStep(4);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (h: HistoryJob) => {
    const ok = await confirm({
      title: "Roll back this import?",
      message: `This deletes the ${h.created} products created by “${h.fileName}”, restores ${h.updated} updated products to their previous state, and removes auto-created categories/designers that are no longer used.`,
      confirmLabel: "Roll back",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await adminApi<{ deleted: number; restored: number }>(`/api/admin/import/${h.id}/rollback`, { method: "POST" });
      toast(`Rolled back: ${res.deleted} deleted, ${res.restored} restored`);
      loadHistory();
      if (job?.id === h.id) setJob({ ...job, status: "rolled_back" });
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const pct = job ? Math.round((job.processedRows / Math.max(job.totalRows, 1)) * 100) : 0;
  const done = job && job.status !== "running";

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap gap-2" aria-label="Import steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={cn("chip gap-2 px-3 py-1.5 text-sm", i === step ? "bg-primary text-white" : i < step ? "bg-primary/10 text-primary" : "bg-line/60 text-muted")}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-xs">{i + 1}</span> {s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="card space-y-4 p-6">
          <Dropzone accept=".csv,.xlsx,.json" label={busy ? "Reading file…" : "Drop your product file here, or click to browse"} hint="CSV, XLSX or JSON · up to 20 MB · first row must contain column names" disabled={busy} onFile={uploadFile} />
          {busy && <p className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Uploading and parsing…</p>}
        </section>
      )}

      {step === 1 && upload && (
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" aria-hidden />
            <div>
              <h2 className="font-heading text-lg font-semibold">Map columns</h2>
              <p className="text-sm text-muted">{upload.fileName} · {upload.totalRows.toLocaleString()} rows · we matched columns automatically, adjust if needed.</p>
            </div>
          </div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
            {IMPORT_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`map-${f.key}`} className="label">
                  {f.label} {f.required && <span className="text-accent-ink">*</span>}
                </label>
                <select id={`map-${f.key}`} className={cn("input", f.required && !mapping[f.key] && "border-red-400")} value={mapping[f.key] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}>
                  <option value="">— not imported —</option>
                  {upload.headers.map((h) => (
                    <option key={h} value={h}>{h}{upload.sample[0]?.[h] ? ` (e.g. ${upload.sample[0][h].slice(0, 24)})` : ""}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <button className="btn-outline" onClick={reset}>Start over</button>
            <button className="btn-primary" onClick={validate} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Validate rows
            </button>
          </div>
        </section>
      )}

      {step === 2 && upload && validation && (
        <section className="card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Validation preview</h2>
              <p className="text-sm text-muted">
                <strong className="text-primary">{validation.validRows.toLocaleString()}</strong> valid rows ·{" "}
                <strong className={validation.invalidRows ? "text-red-600" : ""}>{validation.invalidRows.toLocaleString()}</strong> rows with errors (they will be skipped) · showing first {validation.preview.length}
              </p>
            </div>
            {validation.errorCount > 0 && (
              <a href={`/api/admin/import/${upload.jobId}/errors`} className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Error report (CSV)</a>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-cream text-xs uppercase text-muted">
                <tr>
                  {["Line", "SKU", "Title", "Category", "Designer", "Price", "Status", "Images", "Problems"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validation.preview.map((r) => {
                  const bad = (f: string) => r.errors.some((e) => e.field === f) && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
                  return (
                    <tr key={r.line} className={cn("border-t border-line", r.errors.length && "bg-red-50/60 dark:bg-red-950/20")}>
                      <td className="px-3 py-2 text-muted">{r.line}</td>
                      <td className={cn("px-3 py-2 font-mono text-xs", bad("sku"))}>{r.sku || "—"}</td>
                      <td className={cn("max-w-[220px] truncate px-3 py-2", bad("title"))}>{r.title || "—"}</td>
                      <td className={cn("px-3 py-2", bad("category"))}>{r.category || "—"}</td>
                      <td className="px-3 py-2">{r.designer || "—"}</td>
                      <td className={cn("px-3 py-2", (bad("price") || bad("old_price")))}>{r.price || "—"}</td>
                      <td className={cn("px-3 py-2", bad("status"))}>{r.status || "published"}</td>
                      <td className={cn("px-3 py-2", bad("image_urls"))}>{r.images}</td>
                      <td className="px-3 py-2 text-xs">
                        {r.errors.length ? (
                          <ul className="space-y-0.5 text-red-700 dark:text-red-300">
                            {r.errors.map((e, i) => <li key={i}><strong>{e.field}</strong> {e.message}</li>)}
                          </ul>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-primary" aria-label="Valid" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <button className="btn-outline" onClick={() => setStep(1)}>Back to mapping</button>
            <button className="btn-primary" onClick={() => setStep(3)} disabled={!validation.validRows}>Continue</button>
          </div>
        </section>
      )}

      {step === 3 && upload && validation && (
        <section className="card space-y-6 p-6">
          <h2 className="font-heading text-lg font-semibold">Import options</h2>
          <fieldset>
            <legend className="label">When a product already exists (same SKU, or same slug)</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {([
                ["skip", "Skip duplicates", "Existing products stay untouched."],
                ["update", "Update existing", "Match by SKU, then by slug, and overwrite with the new data (rollback restores the old version)."],
              ] as const).map(([v, title, text]) => (
                <label key={v} className={cn("card flex cursor-pointer gap-3 p-4", duplicateMode === v && "border-primary ring-2 ring-primary/20")}>
                  <input type="radio" name="dup" value={v} checked={duplicateMode === v} onChange={() => setDuplicateMode(v)} className="mt-1 accent-[rgb(var(--color-primary))]" />
                  <span><span className="block font-semibold">{title}</span><span className="text-sm text-muted">{text}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={asDraft} onChange={(e) => setAsDraft(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--color-primary))]" />
            <span><span className="font-semibold">Import everything as draft</span> <span className="text-sm text-muted">– review products before publishing them</span></span>
          </label>
          <div>
            <p className="label flex items-center gap-2"><ImageIcon className="h-4 w-4" aria-hidden /> Optional: ZIP of images</p>
            <p className="mb-3 text-sm text-muted">Name files after the SKU: <code>SKU.jpg</code>, <code>SKU-2.png</code>, <code>SKU_3.webp</code>. ZIP images replace image_urls for matching SKUs. Images are converted to WebP in 300/600/1200px with blur placeholders.</p>
            <Dropzone accept=".zip" label={busy ? "Extracting…" : "Drop a .zip of images (optional)"} hint="Up to 20 MB" disabled={busy} onFile={uploadZip} />
            {zipInfo && <p className="mt-2 text-sm text-primary" role="status">{zipInfo.files} images extracted · {zipInfo.matchedSkus} of {zipInfo.totalSkus} SKUs have images</p>}
          </div>
          <div className="rounded-xl bg-cream p-4 text-sm">
            Ready to import <strong>{validation.validRows.toLocaleString()}</strong> rows{validation.invalidRows ? <> ({validation.invalidRows} invalid rows will be reported as failed)</> : null}. Missing categories and designers are created automatically; slugs and SEO fields are generated.
          </div>
          <div className="flex justify-between gap-2">
            <button className="btn-outline" onClick={() => setStep(2)}>Back</button>
            <button className="btn-accent" onClick={run} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Start import
            </button>
          </div>
        </section>
      )}

      {step === 4 && job && (
        <section className="card space-y-5 p-6" aria-live="polite">
          <div className="flex items-center gap-3">
            {!done ? <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden /> : job.status === "completed" ? <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden /> : <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />}
            <h2 className="font-heading text-lg font-semibold">
              {!done ? "Importing…" : job.status === "completed" ? "Import complete" : job.status === "rolled_back" ? "Import rolled back" : "Import failed"}
            </h2>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm"><span>{job.processedRows.toLocaleString()} / {job.totalRows.toLocaleString()} rows</span><span>{pct}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Import progress">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([["Created", job.created, "text-primary"], ["Updated", job.updated, "text-sky-600"], ["Skipped", job.skipped, "text-amber-600"], ["Failed", job.failed, "text-red-600"]] as const).map(([l, v, c]) => (
              <div key={l} className="rounded-xl bg-cream p-4 text-center">
                <dt className="text-xs text-muted">{l}</dt>
                <dd className={cn("font-heading text-2xl font-bold", c)}>{v.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          {done && (job.errorCount > 0 || job.imageFailureCount > 0) && (
            <div className="space-y-3">
              {job.imageFailureCount > 0 && (
                <details className="rounded-xl border border-line p-4">
                  <summary className="cursor-pointer text-sm font-semibold">{job.imageFailureCount} image(s) could not be imported</summary>
                  <ul className="mt-3 space-y-1 text-xs text-muted">
                    {job.imageFailures.map((f, i) => <li key={i}>Line {f.row} · {f.sku} · {f.url} — {f.error}</li>)}
                  </ul>
                </details>
              )}
              {job.errorCount > 0 && (
                <details className="rounded-xl border border-line p-4">
                  <summary className="cursor-pointer text-sm font-semibold">{job.errorCount} row error(s)</summary>
                  <ul className="mt-3 space-y-1 text-xs text-muted">
                    {job.errors.map((e, i) => <li key={i}>Line {e.row} · {e.sku || "—"} · {e.field}: {e.message}</li>)}
                  </ul>
                </details>
              )}
              <a href={`/api/admin/import/${job.id}/errors`} className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Download full report</a>
            </div>
          )}
          {done && (
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/products" className="btn-primary">View products</Link>
              <button className="btn-outline" onClick={reset}>Import another file</button>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="history-title">
        <h2 id="history-title" className="mb-3 font-heading text-lg font-semibold">Import history</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                {["File", "Date", "Status", "Rows", "Created", "Updated", "Skipped", "Failed", ""].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted">No imports yet.</td></tr>
              )}
              {history.map((h) => (
                <tr key={h.id} className="border-t border-line">
                  <td className="max-w-[220px] truncate px-4 py-3 font-medium">{h.fileName}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(h.createdAt)}</td>
                  <td className="px-4 py-3"><StatusChip status={h.status} /></td>
                  <td className="px-4 py-3">{h.totalRows}</td>
                  <td className="px-4 py-3">{h.created}</td>
                  <td className="px-4 py-3">{h.updated}</td>
                  <td className="px-4 py-3">{h.skipped}</td>
                  <td className="px-4 py-3">{h.failed}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {["completed", "failed"].includes(h.status) && (
                        <a href={`/api/admin/import/${h.id}/errors`} className="btn-ghost px-2 py-1 text-xs" aria-label={`Download report for ${h.fileName}`}><Download className="h-4 w-4" /></a>
                      )}
                      {["completed", "failed"].includes(h.status) && (
                        <button className="btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => rollback(h)}><RotateCcw className="h-4 w-4" aria-hidden /> Rollback</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-primary/10 text-primary",
    running: "bg-sky-100 text-sky-700",
    failed: "bg-red-100 text-red-700",
    rolled_back: "bg-line text-muted",
    uploaded: "bg-amber-100 text-amber-700",
    validated: "bg-amber-100 text-amber-700",
  };
  const label: Record<string, string> = { rolled_back: "rolled back", uploaded: "not run", validated: "not run" };
  return <span className={cn("chip capitalize", styles[status] ?? "bg-line text-muted")}>{label[status] ?? status}</span>;
}
