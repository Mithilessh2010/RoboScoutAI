import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
    return new Response(
        JSON.stringify({
            jobId: params.jobId,
            status: "not_implemented",
            message: "Autoscore job lookup is scaffolded but not connected to persistent job storage yet.",
        }),
        { status: 501, headers: { "content-type": "application/json" } }
    );
};
