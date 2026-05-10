import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
    return new Response(
        JSON.stringify({
            jobId: params.jobId,
            status: "not_implemented",
            message: "Autoscore result retrieval is scaffolded but no processing pipeline has produced results yet.",
        }),
        { status: 501, headers: { "content-type": "application/json" } }
    );
};
