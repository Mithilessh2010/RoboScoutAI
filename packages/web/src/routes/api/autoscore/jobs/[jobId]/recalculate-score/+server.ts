import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { recalculateDecodeScore } from "$lib/server/decodeAutoscore";

export const POST: RequestHandler = async ({ params }) =>
  json({ summary: await recalculateDecodeScore(params.jobId) });
