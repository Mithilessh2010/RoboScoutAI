import type { RequestHandler } from "./$types";
import { jsonResponse, runArtifactDetection } from "$lib/server/autoscore";

export const POST: RequestHandler = async ({ params }) => {
    let result = await runArtifactDetection(params.jobId);
    return jsonResponse(result);
};
