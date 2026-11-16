import { lookup } from "node:dns/promises";
import { readFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/** True for loopback, private, link-local, CGNAT, multicast and other non-public ranges. */
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb") || v6.startsWith("ff");
}

async function assertPublicHost(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http(s) URLs are allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) throw new Error("Private host not allowed");
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("Private network address not allowed");
}

async function fetchOnce(src: string): Promise<Buffer> {
  let url = new URL(src);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicHost(url);
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { "User-Agent": "PatternNest-Importer/1.0", Accept: "image/*" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (type && !type.startsWith("image/") && !type.startsWith("application/octet-stream")) throw new Error(`Not an image (${type.split(";")[0]})`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_IMAGE_BYTES) throw new Error("Image larger than 15 MB");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) throw new Error("Image larger than 15 MB");
    return buf;
  }
  throw new Error("Too many redirects");
}

/** Reads a /path from ./public, or downloads an http(s) URL with SSRF protection and up to 3 attempts. */
export async function loadImageSource(src: string): Promise<Buffer> {
  if (src.startsWith("/") && !src.startsWith("//")) {
    const file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(src.split("?")[0])));
    if (!file.startsWith(PUBLIC_DIR + path.sep)) throw new Error("Invalid path");
    return readFile(file).catch(() => {
      throw new Error("File not found in /public");
    });
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetchOnce(src);
    } catch (e) {
      lastError = e;
      const msg = (e as Error).message;
      if (/not allowed|Only http|Not an image|larger than|HTTP 4\d\d/.test(msg)) break; // permanent errors
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Download failed");
}
