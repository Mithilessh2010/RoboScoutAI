import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    return new Response(
        JSON.stringify({
            error: "Watch realtime WebSocket support is not part of the one-project Vercel backend. Use /watch for local multi-stream viewing.",
        }),
        { status: 410, headers: { "content-type": "application/json" } }
    );
};
