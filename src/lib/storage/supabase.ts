import type { StorageAdapter } from "./index";

const env = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || "patternnest";
  if (!url || !key) throw new Error("Supabase env vars are missing");
  return { url, key, bucket };
};

export const supabaseStorage: StorageAdapter = {
  async put(key, data, contentType) {
    const { url, key: serviceKey, bucket } = env();
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": contentType, "x-upsert": "true" },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Supabase upload failed: ${res.status}`);
    return `${url}/storage/v1/object/public/${bucket}/${key}`;
  },
  async remove(fileUrl) {
    const { url, key: serviceKey, bucket } = env();
    const prefix = `${url}/storage/v1/object/public/${bucket}/`;
    if (!fileUrl.startsWith(prefix)) return;
    await fetch(`${url}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [fileUrl.slice(prefix.length)] }),
    }).catch(() => undefined);
  },
};
