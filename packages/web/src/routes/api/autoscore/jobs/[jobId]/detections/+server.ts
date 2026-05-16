import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getAutoscoreDetections } from "$lib/server/decodeAutoscore";

export const GET: RequestHandler = async ({ params, url }) => {
  let limit = Math.min(Number(url.searchParams.get("limit") ?? 500), 50000);
  let from = url.searchParams.has("from") ? Number(url.searchParams.get("from")) : undefined;
  let to = url.searchParams.has("to") ? Number(url.searchParams.get("to")) : undefined;
  let window: { from?: number; to?: number } = {};
  if (typeof from === "number" && Number.isFinite(from)) window.from = from;
  if (typeof to === "number" && Number.isFinite(to)) window.to = to;
  let result = await getAutoscoreDetections(params.jobId!, limit, window);
  if (!result) throw error(404, "Autoscore job not found.");
  return json(result);
};
