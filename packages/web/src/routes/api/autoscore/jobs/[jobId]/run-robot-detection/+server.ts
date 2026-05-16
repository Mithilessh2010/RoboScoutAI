import type { RequestHandler } from "./$types";
import { jsonResponse, runRobotDetection } from "$lib/server/autoscore";

export const POST: RequestHandler = async ({ params }) =>
  jsonResponse(await runRobotDetection(params.jobId));
