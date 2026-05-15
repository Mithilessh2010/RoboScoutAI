import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { createPenalty, getPenalties } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) =>
  json({ penalties: await getPenalties(params.jobId) });
export const POST: RequestHandler = async ({ params, request }) =>
  json(
    { penalty: await createPenalty(params.jobId, await request.json()) },
    { status: 201 }
  );
