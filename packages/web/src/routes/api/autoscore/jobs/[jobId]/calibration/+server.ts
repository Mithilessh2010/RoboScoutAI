import { error, type RequestHandler } from "@sveltejs/kit";
import {
  ensureAutoscoreDb,
  ManualCalibrationZone,
  jsonResponse,
} from "$lib/server/autoscore";

export const GET: RequestHandler = async ({ params }) => {
  await ensureAutoscoreDb();
  const zones = await ManualCalibrationZone.find({
    jobId: params.jobId,
  }).lean();
  return jsonResponse({ zones });
};

export const POST: RequestHandler = async ({ params, request }) => {
  await ensureAutoscoreDb();
  const body = await request.json().catch(() => ({}));
  const zoneName = String(body.zoneName ?? "").trim();
  if (!zoneName) {
    throw error(400, "zoneName is required.");
  }
  const points = Array.isArray(body.points) ? body.points : [];
  const zone = await ManualCalibrationZone.findOneAndUpdate(
    { jobId: params.jobId, zoneName },
    { jobId: params.jobId, zoneName, points },
    { upsert: true, new: true }
  );
  return jsonResponse({ zone }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ params, url }) => {
  await ensureAutoscoreDb();
  const zoneName = String(url.searchParams.get("zoneName") ?? "").trim();
  if (!zoneName) {
    throw error(400, "zoneName query parameter is required.");
  }
  await ManualCalibrationZone.deleteOne({ jobId: params.jobId, zoneName });
  return jsonResponse({ deleted: true });
};
