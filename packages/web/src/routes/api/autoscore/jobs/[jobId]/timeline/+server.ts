import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { createTimelineEvent, getTimeline } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) =>
  json({ events: await getTimeline(params.jobId!) });

export const POST: RequestHandler = async ({ params, request }) => {
  return json(
    { event: await createTimelineEvent(params.jobId!, await request.json()) },
    { status: 201 }
  );
};
