import type { RequestHandler } from "./$types";
import { jsonResponse, runFullFrameArtifactDetection } from "$lib/server/autoscore";

export const POST: RequestHandler = async ({ params }) =>
  jsonResponse(await runFullFrameArtifactDetection(params.jobId));
