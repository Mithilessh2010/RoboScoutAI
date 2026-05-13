"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESPONSE_CACHE_SECONDS = exports.DB_TIMEOUT = exports.CACHE_REQ = exports.SYNC_API = exports.SYNC_DB = exports.LOGGING = exports.FTC_EVENTS_API_BASE_URL = exports.FRONTEND_CODE = exports.PUBLIC_SERVER_ORIGIN = exports.SERVER_PORT = exports.FTC_API_KEY = exports.DATABASE_URL = exports.IS_DEV = exports.IS_PROD = void 0;
exports.IS_PROD = process.env.NODE_ENV === "production";
exports.IS_DEV = !exports.IS_PROD;
exports.DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/ftcscout";
exports.FTC_API_KEY = process.env.FTC_API_KEY;
exports.SERVER_PORT = +((_a = process.env.PORT) !== null && _a !== void 0 ? _a : (exports.IS_PROD ? "8080" : "4000"));
exports.PUBLIC_SERVER_ORIGIN = process.env.PUBLIC_SERVER_ORIGIN || (exports.IS_PROD ? "api.ftcscout.org" : "localhost:4000");
exports.FRONTEND_CODE = process.env.FRONTEND_CODE || "local-dev-frontend-code";
exports.FTC_EVENTS_API_BASE_URL = process.env.FTC_EVENTS_API_BASE_URL || "https://ftc-api.firstinspires.org/v2.0";
exports.LOGGING = true;
exports.SYNC_DB = true;
exports.SYNC_API = true;
exports.CACHE_REQ = false;
exports.DB_TIMEOUT = 5000;
exports.RESPONSE_CACHE_SECONDS = 0;
//# sourceMappingURL=constants.js.map