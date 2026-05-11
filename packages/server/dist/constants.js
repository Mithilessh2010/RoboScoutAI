"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_TIMEOUT = exports.FRONTEND_CODE = exports.CACHE_REQ = exports.SYNC_API = exports.SYNC_DB = exports.LOGGING = exports.SERVER_PORT = exports.FTC_API_KEY = exports.DATABASE_URL = exports.IS_DEV = exports.IS_PROD = void 0;
exports.IS_PROD = process.env.NODE_ENV === "production";
exports.IS_DEV = !exports.IS_PROD;
exports.DATABASE_URL = process.env.DATABASE_URL;
exports.FTC_API_KEY = process.env.FTC_API_KEY;
exports.SERVER_PORT = +process.env.PORT;
exports.LOGGING = process.env.LOGGING === "1";
exports.SYNC_DB = process.env.SYNC_DB === "1";
exports.SYNC_API = process.env.SYNC_API !== "0";
exports.CACHE_REQ = process.env.CACHE_REQ === "1" && exports.IS_DEV;
exports.FRONTEND_CODE = process.env.FRONTEND_CODE;
exports.DB_TIMEOUT = process.env.DB_TIMEOUT;
//# sourceMappingURL=constants.js.map