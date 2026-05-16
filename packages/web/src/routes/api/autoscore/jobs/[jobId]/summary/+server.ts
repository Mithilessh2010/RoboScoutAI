import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { getAutoscoreJob } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) => {
  let result = await getAutoscoreJob(params.jobId);
  return json({ summary: result?.summary ?? null });
};
