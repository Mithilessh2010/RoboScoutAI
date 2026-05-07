import { throttled } from "@ftc-scout/common";
import { CACHE_REQ, FTC_API_BASE_URL, FTC_API_KEY, FTC_API_THROTTLE_MS } from "../constants";
import { FtcApiReq } from "../db/entities/FtcApiReq";

async function makeRequest(url: string): Promise<any | null> {
    console.info(`Making a request to ${url}`);

    if (!FTC_API_KEY) {
        console.error(
            "FTC API credentials are missing. Set FTC_API_KEY or FTC_EVENTS_USERNAME/FTC_EVENTS_AUTH_KEY in packages/server/.env."
        );
        return null;
    }

    const headers = {
        Authorization: `Basic ${FTC_API_KEY}`,
    };
    let response = await fetch(url, { headers });

    try {
        // Sometimes the api returns the html for a page if it doesn't have data. Fun!
        let text = (await response.text()).trim();
        let json = JSON.parse(text);
        return json;
    } catch (e) {
        console.error(`Failure while making a request to ${url}. Received error ${e}.`);
        return null;
    }
}

export const throttledMakeRequest = throttled(makeRequest, FTC_API_THROTTLE_MS);

export async function getFromFtcApi(path: string, params: Record<string, any> = {}) {
    let paramsString = Object.entries(params)
        .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(String(x[1]))}`)
        .join("&");
    let url = `${FTC_API_BASE_URL}/${path}?${paramsString}`;

    if (CACHE_REQ) {
        let req = await FtcApiReq.findOneBy({ url });
        if (req) {
            console.info(`Using cached resp for ${url}`);
            return req.resp;
        }
    }

    let resp = await throttledMakeRequest(url);

    if (CACHE_REQ && !!resp) {
        await FtcApiReq.createQueryBuilder()
            .insert()
            .values({ url, resp })
            .orIgnore()
            .execute();
    }

    return resp;
}
