import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { deletePenalty, updatePenalty } from "$lib/server/decodeAutoscore";

export const PUT: RequestHandler = async ({ params, request }) =>
  json({
    penalty: await updatePenalty(params.penaltyId, await request.json()),
  });
export const DELETE: RequestHandler = async ({ params }) => {
  await deletePenalty(params.penaltyId);
  return json({ ok: true });
};
