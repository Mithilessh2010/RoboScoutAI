"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_TIMEOUT = exports.FRONTEND_CODE = exports.LIVE_REFRESH_TTL_MS = exports.FTC_API_THROTTLE_MS = exports.CACHE_REQ = exports.SYNC_API = exports.SYNC_DB = exports.LOGGING = exports.SERVER_PORT = exports.FTC_API_BASE_URL = exports.FTC_API_KEY = exports.DATABASE_URL = exports.IS_DEV = exports.IS_PROD = void 0;
exports.IS_PROD = process.env.NODE_ENV === "production";
exports.IS_DEV = !exports.IS_PROD;
exports.DATABASE_URL = process.env.DATABASE_URL;
const FTC_EVENTS_USERNAME = process.env.FTC_EVENTS_USERNAME;
const FTC_EVENTS_AUTH_KEY = process.env.FTC_EVENTS_AUTH_KEY;
exports.FTC_API_KEY = process.env.FTC_API_KEY ||
    (FTC_EVENTS_USERNAME && FTC_EVENTS_AUTH_KEY
        ? Buffer.from(`${FTC_EVENTS_USERNAME}:${FTC_EVENTS_AUTH_KEY}`).toString("base64")
        : "");
exports.FTC_API_BASE_URL = process.env.FTC_EVENTS_API_BASE_URL || "https://ftc-api.firstinspires.org/v2.0";
exports.SERVER_PORT = +process.env.PORT;
exports.LOGGING = process.env.LOGGING === "1";
exports.SYNC_DB = process.env.SYNC_DB === "1";
exports.SYNC_API = process.env.SYNC_API !== "0";
exports.CACHE_REQ = process.env.CACHE_REQ === "1" && exports.IS_DEV;
exports.FTC_API_THROTTLE_MS = +((_a = process.env.FTC_API_THROTTLE_MS) !== null && _a !== void 0 ? _a : 75);
exports.LIVE_REFRESH_TTL_MS = +((_b = process.env.LIVE_REFRESH_TTL_MS) !== null && _b !== void 0 ? _b : 10000);
exports.FRONTEND_CODE = process.env.FRONTEND_CODE;
exports.DB_TIMEOUT = process.env.DB_TIMEOUT;
//# sourceMappingURL=constants.js.map