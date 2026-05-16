import type { RequestHandler } from "./$types";
import { jsonResponse, runArtifactDetection } from "$lib/server/autoscore";

export const POST: RequestHandler = async ({ params }) =>
  jsonResponse(await runArtifactDetection(params.jobId));
