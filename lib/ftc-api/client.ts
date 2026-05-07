import "server-only";
import { getDb } from "@/lib/db";
import { endpointFor, cacheKeyFor } from "./endpoints";
import type { FtcApiCacheEnvelope, FtcApiRequestOptions, FtcApiStatus } from "./types";

const DEFAULT_BASE_URL = "https://ftc-events.firstinspires.org";
const MEMORY_CACHE = new Map<string, { data: unknown; fetchedAt: string }>();

export function getFtcApiStatus(): FtcApiStatus {
  return {
    configured: Boolean(process.env.FTC_API_USERNAME && process.env.FTC_API_TOKEN),
    baseUrl: process.env.FTC_API_BASE_URL || DEFAULT_BASE_URL,
    usernameConfigured: Boolean(process.env.FTC_API_USERNAME),
    tokenConfigured: Boolean(process.env.FTC_API_TOKEN),
  };
}

function getAuthHeader() {
  const username = process.env.FTC_API_USERNAME;
  const token = process.env.FTC_API_TOKEN;
  if (!username || !token) return undefined;
  return `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`;
}

function withQuery(path: string, params?: FtcApiRequestOptions["params"]) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }
  return query.size ? `${path}?${query.toString()}` : path;
}

async function readDbCache<T>(key: string): Promise<FtcApiCacheEnvelope<T> | undefined> {
  try {
    const db = getDb();
    const row = await db.ftcApiCache.findUnique({ where: { key } });
    if (!row) return undefined;
    return {
      source: "database-cache",
      cached: true,
      fetchedAt: row.fetchedAt.toISOString(),
      data: JSON.parse(row.payload) as T,
    };
  } catch {
    const memory = MEMORY_CACHE.get(key);
    if (!memory) return undefined;
    return {
      source: "database-cache",
      cached: true,
      fetchedAt: memory.fetchedAt,
      data: memory.data as T,
      warning: "Using in-memory cache because the database cache is unavailable.",
    };
  }
}

async function writeDbCache(key: string, endpoint: string, payload: unknown) {
  const fetchedAt = new Date();
  MEMORY_CACHE.set(key, { data: payload, fetchedAt: fetchedAt.toISOString() });
  try {
    const db = getDb();
    await db.ftcApiCache.upsert({
      where: { key },
      update: { endpoint, payload: JSON.stringify(payload), fetchedAt },
      create: { key, endpoint, payload: JSON.stringify(payload), fetchedAt },
    });
  } catch {
    // The mock-first MVP must remain usable when Prisma migrations have not run yet.
  }
}

export async function logFtcSync(scope: string, status: "success" | "error" | "skipped", message: string, options: FtcApiRequestOptions = {}) {
  try {
    const db = getDb();
    await db.ftcSyncLog.create({
      data: {
        scope,
        season: options.season ? String(options.season) : null,
        eventCode: options.eventCode ?? null,
        status,
        message,
      },
    });
  } catch {
    // Avoid failing user-facing routes when the sync-log table is not available.
  }
}

export async function getLastFtcSyncLog() {
  try {
    const db = getDb();
    const row = await db.ftcSyncLog.findFirst({ orderBy: { createdAt: "desc" } });
    return row
      ? {
          id: row.id,
          scope: row.scope,
          season: row.season ?? undefined,
          eventCode: row.eventCode ?? undefined,
          status: row.status as "success" | "error" | "skipped",
          message: row.message,
          createdAt: row.createdAt.toISOString(),
        }
      : undefined;
  } catch {
    return undefined;
  }
}

export async function requestFtcApi<T>(kind: string, options: FtcApiRequestOptions = {}, fallback?: T): Promise<FtcApiCacheEnvelope<T>> {
  const key = cacheKeyFor(kind, options);
  const endpoint = withQuery(endpointFor(kind, options), options.params);
  const cached = await readDbCache<T>(key);
  const status = getFtcApiStatus();
  const auth = getAuthHeader();

  if (!auth) {
    return (
      cached ?? {
        source: "mock-data",
        cached: false,
        fetchedAt: new Date().toISOString(),
        data: fallback as T,
        warning: "FTC API credentials are not configured. Showing mock data fallback.",
      }
    );
  }

  try {
    const response = await fetch(`${status.baseUrl}${endpoint}`, {
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
      next: { revalidate: 60 * 15 },
    });

    if (!response.ok) {
      const message = `FTC API request failed: ${response.status} ${response.statusText}`;
      await logFtcSync(kind, "error", message, options);
      return (
        cached ?? {
          source: fallback ? "mock-data" : "ftc-api",
          cached: false,
          fetchedAt: new Date().toISOString(),
          data: fallback as T,
          error: message,
        }
      );
    }

    const data = (await response.json()) as T;
    await writeDbCache(key, endpoint, data);
    await logFtcSync(kind, "success", `Fetched ${endpoint}`, options);
    return { source: "ftc-api", cached: false, fetchedAt: new Date().toISOString(), data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown FTC API request failure";
    await logFtcSync(kind, "error", message, options);
    return (
      cached ?? {
        source: fallback ? "mock-data" : "ftc-api",
        cached: false,
        fetchedAt: new Date().toISOString(),
        data: fallback as T,
        error: message,
      }
    );
  }
}
