import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./index";

// DATA_DIR lets production keep uploads outside the app folder so redeploys don't wipe them.
export const UPLOAD_ROOT = path.join(process.env.DATA_DIR || path.join(process.cwd(), "storage"), "uploads");

export const localStorage: StorageAdapter = {
  async put(key, data) {
    const safeKey = key.replace(/\.\.+/g, "").replace(/^\/+/, "");
    const file = path.join(UPLOAD_ROOT, safeKey);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
    return `/media/${safeKey}`;
  },
  async remove(url) {
    if (!url.startsWith("/media/")) return;
    const file = path.join(UPLOAD_ROOT, url.slice("/media/".length));
    if (!file.startsWith(UPLOAD_ROOT)) return;
    await unlink(file).catch(() => undefined);
  },
};
