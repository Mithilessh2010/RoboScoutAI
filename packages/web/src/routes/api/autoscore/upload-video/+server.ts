import { json, type RequestHandler } from "@sveltejs/kit";

const AUTOSCORE_WORKER_URL = (
  process.env.AUTOSCORE_WORKER_URL || process.env.VIDEO_PROCESSING_API_URL
)?.replace(/\/$/, "");

export const GET: RequestHandler = async () => {
  if (!AUTOSCORE_WORKER_URL) {
    return json(
      { error: "Autoscore worker is not configured." },
      { status: 500 }
    );
  }
  return json({ uploadUrl: `${AUTOSCORE_WORKER_URL}/upload-video` });
};
