import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { getDecodeWalkthrough } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) =>
  json(await getDecodeWalkthrough(params.jobId));
