import type { RequestHandler } from "./$types";
import { jsonResponse, runArtifactDetection } from "$lib/server/autoscore";

export const config = {
  runtime: "nodejs24.x",
  maxDuration: 60,
  split: true,
};

export const POST: RequestHandler = async ({ params }) => {
  let result = await runArtifactDetection(params.jobId);
  return jsonResponse(result);
};
