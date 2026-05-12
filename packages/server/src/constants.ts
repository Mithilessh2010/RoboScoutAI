export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_DEV = !IS_PROD;

export const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/ftcscout";
export const FTC_API_KEY = process.env.FTC_API_KEY;
export const SERVER_PORT = +(process.env.PORT ?? (IS_PROD ? "8080" : "4000"));

// Public/runtime defaults (hard-coded non-secrets)
export const PUBLIC_SERVER_ORIGIN = process.env.PUBLIC_SERVER_ORIGIN || (IS_PROD ? "api.ftcscout.org" : "localhost:4000");
export const FRONTEND_CODE = process.env.FRONTEND_CODE || "local-dev-frontend-code";
export const FTC_EVENTS_API_BASE_URL = process.env.FTC_EVENTS_API_BASE_URL || "https://ftc-api.firstinspires.org/v2.0";

// Hardcoded settings for consistent behavior
export const LOGGING = true;
export const SYNC_DB = true;
export const SYNC_API = true;
export const CACHE_REQ = false;
export const DB_TIMEOUT = 5000;
export const RESPONSE_CACHE_SECONDS = 0; // Always fetch fresh data on reload
