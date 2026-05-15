import { type RequestHandler } from "@sveltejs/kit";
import { runPhase1Autoscore } from "../../../../../../../../../packages/server/src/autoscore/phase1";

export const POST: RequestHandler = async ({ params }) => {
    try {
        const result = await runPhase1Autoscore(params.jobId, {
            openRouterKey: process.env.OPENROUTER_API_KEY || undefined,
        });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
            {
                status: 500,
                headers: { "content-type": "application/json" },
            }
        );
    }
};
