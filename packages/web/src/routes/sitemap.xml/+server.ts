import type { RequestHandler } from "./$types";
import { Season } from "@ftc-scout/common";
import { ensureBackendReady } from "$lib/server/backend";

export const GET: RequestHandler = async ({ url }) => {
    await ensureBackendReady();
    const eventModule = await import("@ftc-scout/server/dist/db/entities/Event.js");
    const teamModule = await import("@ftc-scout/server/dist/db/entities/Team.js");
    const Event = eventModule.Event;
    const Team = teamModule.Team;

    const origin = url.origin;
    const events = await Event.find({ select: { season: true, code: true } });
    const teams = await Team.find({ select: { number: true } });
    const staticPaths = ["/", "/teams", "/events", "/records", "/opr", "/watch", "/about"];

    const urls = [
        ...staticPaths.map((path) => `${origin}${path}`),
        ...Object.values(Season)
            .filter((season): season is Season => typeof season === "number")
            .map((season) => `${origin}/events/${season}`),
        ...events.map((event) => `${origin}/events/${event.season}/${event.code}`),
        ...teams.map((team) => `${origin}/teams/${team.number}`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}
</urlset>
`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml",
        },
    });
};
