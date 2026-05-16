import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { getAutoscoreRobotDetections } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params, url }) =>
  json({
    robotDetections: await getAutoscoreRobotDetections(
      params.jobId,
      Number(url.searchParams.get("limit") ?? 500)
    ),
  });
