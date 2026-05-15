import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getAutoscoreDetections } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params, url }) => {
  let limit = Math.min(Number(url.searchParams.get("limit") ?? 500), 2000);
  let result = await getAutoscoreDetections(params.jobId!, limit);
  if (!result) throw error(404, "Autoscore job not found.");
  return json(result);
};
