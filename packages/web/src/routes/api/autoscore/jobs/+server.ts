import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async () => {
    return new Response(
        JSON.stringify({
            status: "not_implemented",
            message: "Autoscore jobs are reserved for the app-owned backend. Persistent job storage and video storage are not implemented yet.",
        }),
        { status: 501, headers: { "content-type": "application/json" } }
    );
};
