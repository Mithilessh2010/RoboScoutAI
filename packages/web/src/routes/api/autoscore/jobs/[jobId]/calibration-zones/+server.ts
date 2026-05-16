import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import {
  getCalibrationZones,
  clearCalibrationZones,
  upsertCalibrationZone,
} from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params }) =>
  json({ zones: await getCalibrationZones(params.jobId) });
export const POST: RequestHandler = async ({ params, request }) =>
  json(
    { zone: await upsertCalibrationZone(params.jobId, await request.json()) },
    { status: 201 }
  );
export const DELETE: RequestHandler = async ({ params }) => {
  await clearCalibrationZones(params.jobId);
  return json({ ok: true });
};
