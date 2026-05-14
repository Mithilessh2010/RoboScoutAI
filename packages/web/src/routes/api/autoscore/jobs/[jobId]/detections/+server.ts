import { error, type RequestHandler } from "@sveltejs/kit";
import {
    AutoscoreDetection,
    AutoscoreJob,
    AutoscoreSummary,
    ensureAutoscoreDb,
    jsonResponse,
    serializeDoc,
} from "$lib/server/autoscore";

export const GET: RequestHandler = async ({ params, url }) => {
    await ensureAutoscoreDb();
    let job = await AutoscoreJob.findById(params.jobId);
    if (!job) {
        throw error(404, "Autoscore job not found.");
    }

    let limit = Math.min(Number(url.searchParams.get("limit") ?? 500), 2000);
    let detections = await AutoscoreDetection.find({ jobId: job._id })
        .sort({ frameNumber: 1, confidence: -1 })
        .limit(limit);
    let summary = await AutoscoreSummary.findOne({ jobId: job._id });

    return jsonResponse({
        job: serializeDoc(job),
        summary: summary ? serializeDoc(summary) : null,
        detections: detections.map(serializeDoc),
    });
};
