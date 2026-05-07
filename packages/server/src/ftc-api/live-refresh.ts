import { CURRENT_SEASON, Season } from "@ftc-scout/common";
import { LIVE_REFRESH_TTL_MS } from "../constants";
import { loadAllMatches } from "../db/loaders/load-all-matches";
import { LoadType } from "./watch";

type RefreshResult = {
    refreshed: boolean;
    skippedReason?: string;
};

const lastRefresh = new Map<string, number>();
const inFlight = new Map<string, Promise<RefreshResult>>();

export async function refreshLiveStats(
    season: Season,
    eventCode?: string
): Promise<RefreshResult> {
    if (season !== CURRENT_SEASON) {
        return { refreshed: false, skippedReason: "not-current-season" };
    }

    let key = `${season}:${eventCode ?? "active-events"}`;
    let now = Date.now();
    let last = lastRefresh.get(key);

    if (last && now - last < LIVE_REFRESH_TTL_MS) {
        return { refreshed: false, skippedReason: "recently-refreshed" };
    }

    let existing = inFlight.get(key);
    if (existing) return existing;

    let refresh = (async () => {
        try {
            await loadAllMatches(season, LoadType.Partial, eventCode ? [eventCode] : undefined);
            lastRefresh.set(key, Date.now());
            return { refreshed: true };
        } finally {
            inFlight.delete(key);
        }
    })();

    inFlight.set(key, refresh);
    return refresh;
}
