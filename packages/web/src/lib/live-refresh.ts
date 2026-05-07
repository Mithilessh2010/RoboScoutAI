import { env } from "$env/dynamic/public";
import { CURRENT_SEASON, type Season } from "@ftc-scout/common";
import { IS_DEV } from "./constants";

type RefreshOptions = {
    season: Season;
    eventCode?: string;
};

export async function refreshLiveStats(
    fetch: typeof globalThis.fetch,
    { season, eventCode }: RefreshOptions
): Promise<boolean> {
    if (season !== CURRENT_SEASON) return false;

    let protocol = IS_DEV ? "http" : "https";
    let url = new URL(`${protocol}://${env.PUBLIC_SERVER_ORIGIN}/rest/v1/live-refresh`);
    url.searchParams.set("season", `${season}`);
    if (eventCode) url.searchParams.set("eventCode", eventCode);

    try {
        let res = await fetch(url);
        return res.ok;
    } catch (e) {
        console.error("Unable to refresh live FTC stats.", e);
        return false;
    }
}
