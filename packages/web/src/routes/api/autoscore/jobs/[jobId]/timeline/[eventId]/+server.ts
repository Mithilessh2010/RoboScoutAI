import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import {
  deleteTimelineEvent,
  updateTimelineEvent,
} from "$lib/server/decodeAutoscore";

export const PUT: RequestHandler = async ({ params, request }) =>
  json({
    event: await updateTimelineEvent(params.eventId, await request.json()),
  });
export const DELETE: RequestHandler = async ({ params }) => {
  await deleteTimelineEvent(params.eventId);
  return json({ ok: true });
};
