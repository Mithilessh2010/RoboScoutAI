export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_DEV = !IS_PROD;

export const DATABASE_URL = process.env.DATABASE_URL || "sqlite:./ftcscout.db";
export const FTC_API_KEY = process.env.FTC_API_KEY;
export const SERVER_PORT = +(process.env.PORT ?? (IS_PROD ? "8080" : "4000"));
export const DB_TYPE = DATABASE_URL.startsWith("sqlite") ? "sqlite" : "postgres";

// Hardcoded settings for consistent behavior
export const LOGGING = true;
export const SYNC_DB = true;
export const SYNC_API = true;
export const CACHE_REQ = false;
export const DB_TIMEOUT = 5000;
export const RESPONSE_CACHE_SECONDS = 0; // Always fetch fresh data on reload
