import crypto from "node:crypto";
import type { StorageAdapter } from "./index";

const env = () => {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("Cloudinary env vars are missing");
  return { cloud, key, secret };
};

const sign = (params: Record<string, string>, secret: string) =>
  crypto
    .createHash("sha1")
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&") + secret,
    )
    .digest("hex");

export const cloudinaryStorage: StorageAdapter = {
  async put(key, data, contentType) {
    const { cloud, key: apiKey, secret } = env();
    const publicId = `patternnest/${key.replace(/\.[a-z0-9]+$/i, "")}`;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params = { public_id: publicId, timestamp };
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(data)], { type: contentType }));
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("public_id", publicId);
    form.append("signature", sign(params, secret));
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
    const json = (await res.json()) as { secure_url: string };
    return json.secure_url;
  },
  async remove(url) {
    const { cloud, key: apiKey, secret } = env();
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (!match) return;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params = { public_id: match[1], timestamp };
    const form = new FormData();
    form.append("public_id", match[1]);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("signature", sign(params, secret));
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body: form }).catch(() => undefined);
  },
};
