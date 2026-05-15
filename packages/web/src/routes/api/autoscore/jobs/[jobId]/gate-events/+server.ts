import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { createGateEvent, getGateEvents } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) =>
  json({ gateEvents: await getGateEvents(params.jobId) });
export const POST: RequestHandler = async ({ params, request }) =>
  json(
    { gateEvent: await createGateEvent(params.jobId, await request.json()) },
    { status: 201 }
  );
