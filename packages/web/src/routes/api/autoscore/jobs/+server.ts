import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import {
  createAutoscoreJob,
  listAutoscoreJobs,
} from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async () =>
  json({ jobs: await listAutoscoreJobs() });

export const POST: RequestHandler = async (event) => {
  let body = await event.request.json();
  return json({ job: await createAutoscoreJob(body) }, { status: 201 });
};
