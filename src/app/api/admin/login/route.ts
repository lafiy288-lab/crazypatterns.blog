import { createSessionCookie, verifyCredentials } from "@/lib/auth";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

/** Rate limited: 5 attempts per 15 minutes per IP. */
export const POST = handle(async (req: Request) => {
  const key = `login:${clientIp(req)}`;
  const limit = rateLimit(key, 5, 15 * 60_000);
  if (!limit.ok) throw new ApiError(`Too many login attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`, 429);
  const { email, password } = await parseBody(req, loginSchema);
  const admin = await verifyCredentials(email, password);
  if (!admin) throw new ApiError("Invalid email or password", 401);
  resetRateLimit(key);
  await createSessionCookie(admin.id, admin.email);
  return ok({ ok: true });
});
