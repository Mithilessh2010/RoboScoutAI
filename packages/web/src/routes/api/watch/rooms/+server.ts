import type { RequestHandler } from "./$types";

function disabled(): Response {
    return new Response(
        JSON.stringify({
            error: "Watch backend rooms are disabled. The Vercel deployment uses the simple local Watch page with browser localStorage only.",
        }),
        { status: 410, headers: { "content-type": "application/json" } }
    );
}

export const GET: RequestHandler = async () => disabled();
export const POST: RequestHandler = async () => disabled();
