import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { deleteGateEvent, updateGateEvent } from "$lib/server/decodeAutoscore";

export const PUT: RequestHandler = async ({ params, request }) =>
  json({
    gateEvent: await updateGateEvent(params.gateEventId, await request.json()),
  });
export const DELETE: RequestHandler = async ({ params }) => {
  await deleteGateEvent(params.gateEventId);
  return json({ ok: true });
};
