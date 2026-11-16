import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { clientIp, rateLimit } from "./rate-limit";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export const fail = (message: string, status = 400, extra?: Record<string, unknown>) =>
  NextResponse.json({ error: message, ...extra }, { status });

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
  return schema.parse(body);
}

export class ApiError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Wraps a route handler with consistent error handling. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail("Validation failed", 422, { issues: err.flatten().fieldErrors });
      }
      if (err instanceof ApiError) return fail(err.message, err.status);
      console.error(err);
      return fail("Something went wrong", 500);
    }
  };
}

export function limitOrThrow(req: Request, name: string, limit: number, windowMs: number) {
  const res = rateLimit(`${name}:${clientIp(req)}`, limit, windowMs);
  if (!res.ok) throw new ApiError(`Too many requests. Try again in ${res.retryAfter}s.`, 429);
}
