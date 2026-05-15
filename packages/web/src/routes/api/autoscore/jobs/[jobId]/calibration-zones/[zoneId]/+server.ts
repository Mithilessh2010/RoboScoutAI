import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import {
  deleteCalibrationZone,
  updateCalibrationZone,
} from "$lib/server/decodeAutoscore";

export const PUT: RequestHandler = async ({ params, request }) =>
  json({
    zone: await updateCalibrationZone(params.zoneId, await request.json()),
  });
export const DELETE: RequestHandler = async ({ params }) => {
  await deleteCalibrationZone(params.zoneId);
  return json({ ok: true });
};
