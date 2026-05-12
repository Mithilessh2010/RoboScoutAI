"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseCachePlugin = void 0;
const server_1 = require("@apollo/server");
const crypto_1 = __importDefault(require("crypto"));
const CACHE_CONFIG = {
    homepage: { maxAge: 120, scope: "PUBLIC" },
    teprecords: { maxAge: 120, scope: "PUBLIC" },
    matchrecords: { maxAge: 120, scope: "PUBLIC" },
    eventbycode: { maxAge: 300, scope: "PUBLIC" },
    eventssearch: { maxAge: 300, scope: "PUBLIC" },
    activeteamscount: { maxAge: 600, scope: "PUBLIC" },
    teamsregionsearch: { maxAge: 300, scope: "PUBLIC" },
};
function generateCacheKey(operationName, query, variables) {
    const hash = crypto_1.default.createHash("sha256");
    hash.update(operationName);
    hash.update(query);
    hash.update(JSON.stringify(variables));
    return `gql:${operationName}:${hash.digest("hex")}`;
}
function responseCachePlugin(cache, ttlOverrideSeconds) {
    console.log("[RESPONSE CACHE PLUGIN] Initialized with cache config:", Object.keys(CACHE_CONFIG));
    return {
        requestDidStart() {
            return __awaiter(this, void 0, void 0, function* () {
                let cacheKey = null;
                let operationName = null;
                let shouldCache = false;
                let ttl = 0;
                let cachedResponse = null;
                return {
                    didResolveOperation(requestContext) {
                        return __awaiter(this, void 0, void 0, function* () {
                            operationName = requestContext.operationName || null;
                            if (!operationName) {
                                return;
                            }
                            const config = CACHE_CONFIG[operationName.toLowerCase()];
                            if (!config) {
                                return;
                            }
                            ttl = config.maxAge || 0;
                            if (typeof ttlOverrideSeconds === "number") {
                                ttl = Math.min(ttl, Math.max(0, ttlOverrideSeconds));
                            }
                            shouldCache = ttl > 0;
                            if (!shouldCache) {
                                return;
                            }
                            cacheKey = generateCacheKey(operationName, requestContext.request.query || "", requestContext.request.variables || {});
                            try {
                                const cached = yield cache.get(cacheKey);
                                if (cached) {
                                    cachedResponse = JSON.parse(cached);
                                }
                            }
                            catch (error) {
                                console.error(`[CACHE ERROR] ${operationName}:`, error);
                            }
                        });
                    },
                    responseForOperation() {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (cachedResponse) {
                                const headers = new server_1.HeaderMap();
                                headers.set("cache-control", `public, max-age=${ttl}`);
                                headers.set("x-cache", "HIT");
                                return {
                                    body: {
                                        kind: "single",
                                        singleResult: cachedResponse,
                                    },
                                    http: {
                                        headers,
                                    },
                                };
                            }
                            return null;
                        });
                    },
                    willSendResponse(requestContext) {
                        var _a, _b, _c, _d, _e;
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!shouldCache || !cacheKey || !operationName || cachedResponse) {
                                return;
                            }
                            if (((_b = (_a = requestContext.response) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.kind) === "single" &&
                                requestContext.response.body.singleResult.errors) {
                                return;
                            }
                            try {
                                const responseBody = ((_d = (_c = requestContext.response) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.kind) === "single"
                                    ? requestContext.response.body.singleResult
                                    : null;
                                if (responseBody) {
                                    yield cache.set(cacheKey, JSON.stringify(responseBody), { ttl });
                                    if ((_e = requestContext.response.http) === null || _e === void 0 ? void 0 : _e.headers) {
                                        requestContext.response.http.headers.set("cache-control", `public, max-age=${ttl}`);
                                        requestContext.response.http.headers.set("x-cache", "MISS");
                                    }
                                }
                            }
                            catch (error) {
                                console.error(`[CACHE SET ERROR] ${operationName}:`, error);
                            }
                        });
                    },
                };
            });
        },
    };
}
exports.responseCachePlugin = responseCachePlugin;
//# sourceMappingURL=response-cache-plugin.js.map