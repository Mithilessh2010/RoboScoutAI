import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit";
import { getAutoscoreJob } from "$lib/server/decodeAutoscore";

const workerUrl =
  process.env.AUTOSCORE_WORKER_URL ||
  process.env.VIDEO_PROCESSING_API_URL ||
  "https://roboscoutai-autoscore-worker.fly.dev";

export const config = {
  runtime: "nodejs24.x",
  maxDuration: 60,
  split: true,
};

export const POST: RequestHandler = async ({ params }) => {
  let detail = await getAutoscoreJob(params.jobId);
  if (!detail) throw error(404, "Autoscore job not found.");
  let response = await fetch(`${workerUrl}/export-highlights`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.AUTOSCORE_WORKER_SECRET
        ? { authorization: `Bearer ${process.env.AUTOSCORE_WORKER_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      jobId: params.jobId,
      videoUrl: detail.job.videoUrl,
    }),
  });
  if (!response.ok) {
    let body = await response.json().catch(() => ({}));
    throw error(response.status, body.detail ?? "Could not export highlights.");
  }
  return new Response(await response.arrayBuffer(), {
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/zip",
      "content-disposition":
        response.headers.get("content-disposition") ??
        `attachment; filename="decode-highlights-${params.jobId}.zip"`,
    },
  });
};
