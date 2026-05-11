import { IS_DEV } from "$lib/constants";
import { getServerOrigin } from "$lib/util/server-origin";

export const GET = async () => {
    let s = IS_DEV ? "" : "s";
    const endpoint = `http${s}://${getServerOrigin()}/sitemap.xml`;
    const res = await fetch(endpoint);
    const xml = await res.text();

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml",
        },
    });
};
