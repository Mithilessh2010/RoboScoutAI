import type { RequestHandler } from "./$types";
import { createHash } from "crypto";
import { ensureBackendReady } from "$lib/server/backend";

function browserName(userAgent: string): string {
    if (userAgent.includes("Firefox/")) return "Firefox";
    if (userAgent.includes("Edg/")) return "Edge";
    if (userAgent.includes("Chrome/")) return "Chrome";
    if (userAgent.includes("Safari/")) return "Safari";
    return "Unknown";
}

function deviceType(userAgent: string): string {
    return /Mobile|Android|iPhone|iPad/i.test(userAgent) ? "mobile" : "desktop";
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    try {
        const parsed = await request.json();
        const url = parsed.url;
        const fromUrl = parsed.from;
        const sessionId = parsed.sessionId;
        const pathChanged = !!parsed.pathChanged;
        const time = +parsed.time;

        if (
            !url ||
            !time ||
            !sessionId ||
            typeof url !== "string" ||
            (fromUrl != null && typeof fromUrl !== "string") ||
            typeof sessionId !== "string" ||
            Number.isNaN(time)
        ) {
            return new Response(null, { status: 204 });
        }

        const uaString = request.headers.get("user-agent");
        if (!uaString) return new Response(null, { status: 204 });

        const browser = browserName(uaString);
        const device = deviceType(uaString);

        await ensureBackendReady();
        const analyticsModule = await import("@ftc-scout/server/dist/db/entities/Analytics.js");
        const Analytics = analyticsModule.Analytics;

        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor ?? getClientAddress();
        const userId = createHash("md5").update("ftcscout" + uaString + ip).digest("hex");

        await Analytics.create({
            url,
            fromUrl,
            pathChanged,
            sessionId,
            userId,
            browser,
            deviceType: device,
            date: new Date(time),
        }).save();
    } catch {
        // Analytics must never break navigation.
    }

    return new Response(null, { status: 204 });
};
