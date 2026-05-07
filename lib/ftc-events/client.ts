import "server-only";

export type FtcEventsErrorCode =
  | "MISSING_CREDENTIALS"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "UNSUPPORTED"
  | "SERVICE_UNAVAILABLE"
  | "HTTP_ERROR"
  | "NETWORK_ERROR";

export class FtcEventsApiError extends Error {
  code: FtcEventsErrorCode;
  status: number;

  constructor(code: FtcEventsErrorCode, message: string, status: number) {
    super(message);
    this.name = "FtcEventsApiError";
    this.code = code;
    this.status = status;
  }
}

const DEFAULT_BASE_URL = "https://ftc-api.firstinspires.org/v2.0";

export function getFtcEventsBaseUrl() {
  return (process.env.FTC_EVENTS_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function hasFtcEventsCredentials(): boolean {
  return Boolean(process.env.FTC_EVENTS_USERNAME && process.env.FTC_EVENTS_AUTH_KEY);
}

function authHeader() {
  const username = process.env.FTC_EVENTS_USERNAME;
  const authKey = process.env.FTC_EVENTS_AUTH_KEY;
  if (!username || !authKey) {
    throw new FtcEventsApiError("MISSING_CREDENTIALS", "FTC Events API credentials are missing. Set FTC_EVENTS_USERNAME and FTC_EVENTS_AUTH_KEY server-side.", 401);
  }
  const token = Buffer.from(`${username}:${authKey}`).toString("base64");
  return `Basic ${token}`;
}

function codeForStatus(status: number): FtcEventsErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 500) return "SERVER_ERROR";
  if (status === 501) return "UNSUPPORTED";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  return "HTTP_ERROR";
}

function messageForStatus(status: number, statusText: string) {
  switch (status) {
    case 400:
      return "Invalid FTC Events API season, parameter, or API version.";
    case 401:
      return "Unauthorized FTC Events API request. Check FTC_EVENTS_USERNAME and FTC_EVENTS_AUTH_KEY.";
    case 404:
      return "FTC Events API resource was not found. Check the event code and season.";
    case 500:
      return "FTC Events API server error.";
    case 501:
      return "Unsupported FTC Events API endpoint pattern or parameter combination.";
    case 503:
      return "FTC Events API service is unavailable.";
    default:
      return `FTC Events API request failed: ${status} ${statusText}`;
  }
}

export async function ftcEventsFetch<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${getFtcEventsBaseUrl()}${normalizedPath}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
      Authorization: authHeader(),
    },
    cache: "no-store",
  }).catch((error) => {
    throw new FtcEventsApiError("NETWORK_ERROR", error instanceof Error ? error.message : "FTC Events API network request failed.", 503);
  });

  if (response.status === 304) return null;

  if (!response.ok) {
    throw new FtcEventsApiError(codeForStatus(response.status), messageForStatus(response.status, response.statusText), response.status);
  }

  const text = await response.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as T;
}
