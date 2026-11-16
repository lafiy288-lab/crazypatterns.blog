import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { ApiError } from "./api";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

/**
 * Ensures the single admin account exists. On first run the email/password from
 * .env are hashed with bcrypt and stored; after that the database is the source of truth.
 */
export async function ensureAdmin() {
  const count = await prisma.admin.count();
  if (count > 0) return;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  await prisma.admin.create({
    data: { email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) },
  });
}

let dummyHash: string | undefined;

export async function verifyCredentials(email: string, password: string) {
  await ensureAdmin();
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  // Always run a bcrypt compare to keep timing similar for unknown emails.
  const hash = admin?.passwordHash ?? (dummyHash ??= await bcrypt.hash("not-the-password", 12));
  const valid = await bcrypt.compare(password, hash);
  return valid && admin ? admin : null;
}

export async function createSessionCookie(adminId: string, email: string) {
  const token = await signSession({ sub: adminId, email });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Use at the top of every /api/admin handler (defence in depth on top of middleware). */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new ApiError("Unauthorized", 401);
  return session;
}
