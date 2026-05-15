import { error, json, type RequestHandler } from "@sveltejs/kit";
import {
  getAutoscoreJob,
  updateAutoscoreJob,
} from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) => {
  let result = await getAutoscoreJob(params.jobId!);
  if (!result) throw error(404, "Autoscore job not found.");
  return json(result);
};

export const PUT: RequestHandler = async ({ params, request }) => {
  let job = await updateAutoscoreJob(params.jobId!, await request.json());
  if (!job) throw error(404, "Autoscore job not found.");
  return json({ job });
};
