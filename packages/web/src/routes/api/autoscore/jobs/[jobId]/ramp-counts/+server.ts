import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { getRampCountStates } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) =>
  json({ rampCounts: await getRampCountStates(params.jobId) });
