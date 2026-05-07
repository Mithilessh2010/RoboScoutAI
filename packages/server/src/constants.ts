export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_DEV = !IS_PROD;

export const DATABASE_URL = process.env.DATABASE_URL;
const FTC_EVENTS_USERNAME = process.env.FTC_EVENTS_USERNAME;
const FTC_EVENTS_AUTH_KEY = process.env.FTC_EVENTS_AUTH_KEY;

export const FTC_API_KEY =
	process.env.FTC_API_KEY ||
	(FTC_EVENTS_USERNAME && FTC_EVENTS_AUTH_KEY
		? Buffer.from(`${FTC_EVENTS_USERNAME}:${FTC_EVENTS_AUTH_KEY}`).toString("base64")
		: "");
export const FTC_API_BASE_URL =
	process.env.FTC_EVENTS_API_BASE_URL || "https://ftc-api.firstinspires.org/v2.0";
export const SERVER_PORT = +process.env.PORT;

export const LOGGING = process.env.LOGGING === "1";
export const SYNC_DB = process.env.SYNC_DB === "1";
export const SYNC_API = process.env.SYNC_API !== "0";
export const CACHE_REQ = process.env.CACHE_REQ === "1" && IS_DEV;
export const FTC_API_THROTTLE_MS = +(process.env.FTC_API_THROTTLE_MS ?? 75);
export const LIVE_REFRESH_TTL_MS = +(process.env.LIVE_REFRESH_TTL_MS ?? 10_000);

export const FRONTEND_CODE = process.env.FRONTEND_CODE;
export const DB_TIMEOUT = process.env.DB_TIMEOUT;
