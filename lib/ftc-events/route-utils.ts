import "server-only";
import { NextResponse } from "next/server";
import { FtcEventsApiError } from "./client";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 500) {
  return NextResponse.json({ ok: false, error: { code, message, status } }, { status });
}

export async function ftcRoute(handler: () => Promise<unknown>) {
  try {
    return ok(await handler());
  } catch (error) {
    if (error instanceof FtcEventsApiError) return fail(error.code, error.message, error.status);
    if (error instanceof Error) return fail("BAD_REQUEST", error.message, 400);
    return fail("UNKNOWN_ERROR", "Unknown FTC Events API route error.", 500);
  }
}

export function num(params: URLSearchParams, name: string) {
  const value = params.get(name);
  return value ? Number(value) : undefined;
}

export function bool(params: URLSearchParams, name: string) {
  const value = params.get(name);
  if (value === null) return undefined;
  return value === "true" || value === "1";
}

export function requiredNum(params: URLSearchParams, name: string) {
  const value = num(params, name);
  if (!value || Number.isNaN(value)) throw new Error(`${name} is required.`);
  return value;
}

export function requiredString(params: URLSearchParams, name: string) {
  const value = params.get(name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
