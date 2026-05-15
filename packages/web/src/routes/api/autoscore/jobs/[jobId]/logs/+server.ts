import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { ensureAutoscoreDb, getAutoscoreLogs } from "$lib/server/autoscore";

export const GET: RequestHandler = async ({ params }) => {
  const jobId = String(params.jobId ?? "");
  if (!jobId) return json({ error: "Missing jobId" }, { status: 400 });

  try {
    await ensureAutoscoreDb();
    const logs = await getAutoscoreLogs(jobId, 1000);
    return json({ logs });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};
