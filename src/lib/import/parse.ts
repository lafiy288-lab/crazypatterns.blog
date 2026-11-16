import Papa from "papaparse";
import ExcelJS from "exceljs";
import type { RawRow } from "./store";

export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 50_000;

const cellText = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(cellText).join("|");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v).trim();
};

/** Parses CSV, XLSX or JSON into header list + string rows. */
export async function parseImportFile(buf: Buffer, fileName: string): Promise<{ headers: string[]; rows: RawRow[] }> {
  const ext = fileName.toLowerCase().split(".").pop();
  let headers: string[] = [];
  let rows: RawRow[] = [];

  if (ext === "csv" || ext === "txt") {
    const text = buf.toString("utf8").replace(/^﻿/, "");
    const res = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim() });
    headers = (res.meta.fields ?? []).filter(Boolean);
    rows = res.data.map((r) => Object.fromEntries(headers.map((h) => [h, cellText(r[h])])));
  } else if (ext === "xlsx") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new Error("The workbook has no sheets");
    const head = ws.getRow(1);
    const cols: { idx: number; name: string }[] = [];
    head.eachCell({ includeEmpty: false }, (cell, idx) => {
      const name = cell.text.trim();
      if (name) cols.push({ idx, name });
    });
    headers = cols.map((c) => c.name);
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      if (n === 1) return;
      const rec: RawRow = {};
      let any = false;
      for (const c of cols) {
        const t = row.getCell(c.idx).text?.trim() ?? "";
        if (t) any = true;
        rec[c.name] = t;
      }
      if (any) rows.push(rec);
    });
  } else if (ext === "json") {
    const parsed = JSON.parse(buf.toString("utf8").replace(/^﻿/, ""));
    const list: unknown = Array.isArray(parsed) ? parsed : parsed?.products ?? parsed?.items ?? parsed?.data;
    if (!Array.isArray(list)) throw new Error("JSON must be an array of products (or { products: [...] })");
    const set = new Set<string>();
    for (const item of list) if (item && typeof item === "object") Object.keys(item).forEach((k) => set.add(k));
    headers = [...set];
    rows = list.filter((i) => i && typeof i === "object").map((i: Record<string, unknown>) => Object.fromEntries(headers.map((h) => [h, cellText(i[h])])));
  } else {
    throw new Error("Unsupported file type. Use .csv, .xlsx or .json");
  }

  if (!headers.length) throw new Error("No column headers found");
  if (!rows.length) throw new Error("The file contains no data rows");
  if (rows.length > MAX_IMPORT_ROWS) throw new Error(`Too many rows (max ${MAX_IMPORT_ROWS.toLocaleString()})`);
  return { headers, rows };
}
