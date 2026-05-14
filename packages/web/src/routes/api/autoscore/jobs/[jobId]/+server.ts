import { error, type RequestHandler } from "@sveltejs/kit";
import { AutoscoreJob, AutoscoreSummary, ensureAutoscoreDb, jsonResponse, serializeDoc } from "$lib/server/autoscore";

export const GET: RequestHandler = async ({ params }) => {
    await ensureAutoscoreDb();
    let job = await AutoscoreJob.findById(params.jobId);
    if (!job) {
        throw error(404, "Autoscore job not found.");
    }
    let summary = await AutoscoreSummary.findOne({ jobId: job._id });

    return jsonResponse({
        job: serializeDoc(job),
        summary: summary ? serializeDoc(summary) : null,
    });
};
