import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params }) => {
    return new Response(
        JSON.stringify({
            jobId: params.jobId,
            status: "not_implemented",
            message: "Autoscore analysis will be triggered through this app-owned route. Long video processing is intentionally not run inside this Vercel function yet.",
        }),
        { status: 501, headers: { "content-type": "application/json" } }
    );
};
