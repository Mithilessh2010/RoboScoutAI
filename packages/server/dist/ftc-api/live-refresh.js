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
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshLiveStats = void 0;
const common_1 = require("@ftc-scout/common");
const constants_1 = require("../constants");
const load_all_matches_1 = require("../db/loaders/load-all-matches");
const watch_1 = require("./watch");
const lastRefresh = new Map();
const inFlight = new Map();
function refreshLiveStats(season, eventCode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (season !== common_1.CURRENT_SEASON) {
            return { refreshed: false, skippedReason: "not-current-season" };
        }
        let key = `${season}:${eventCode !== null && eventCode !== void 0 ? eventCode : "active-events"}`;
        let now = Date.now();
        let last = lastRefresh.get(key);
        if (last && now - last < constants_1.LIVE_REFRESH_TTL_MS) {
            return { refreshed: false, skippedReason: "recently-refreshed" };
        }
        let existing = inFlight.get(key);
        if (existing)
            return existing;
        let refresh = (() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, load_all_matches_1.loadAllMatches)(season, watch_1.LoadType.Partial, eventCode ? [eventCode] : undefined);
                lastRefresh.set(key, Date.now());
                return { refreshed: true };
            }
            finally {
                inFlight.delete(key);
            }
        }))();
        inFlight.set(key, refresh);
        return refresh;
    });
}
exports.refreshLiveStats = refreshLiveStats;
//# sourceMappingURL=live-refresh.js.map