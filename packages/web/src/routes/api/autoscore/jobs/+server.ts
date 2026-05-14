import type { RequestHandler } from "./$types";
import {
    AutoscoreJob,
    AutoscoreSummary,
    ensureAutoscoreDb,
    jsonResponse,
    parseCreateJobRequest,
    serializeDoc,
} from "$lib/server/autoscore";

export const GET: RequestHandler = async () => {
    await ensureAutoscoreDb();
    let jobs = await AutoscoreJob.find({}).sort({ createdAt: -1 }).limit(50);
    let summaries = await AutoscoreSummary.find({
        jobId: { $in: jobs.map((job) => job._id) },
    });
    let summaryByJobId = new Map(summaries.map((summary) => [String(summary.jobId), serializeDoc(summary)]));

    return jsonResponse({
        jobs: jobs.map((job) => ({
            ...serializeDoc(job),
            summary: summaryByJobId.get(String(job._id)) ?? null,
        })),
    });
};

export const POST: RequestHandler = async (event) => {
    await ensureAutoscoreDb();
    let { videoName, videoPath, videoUrl } = await parseCreateJobRequest(event);
    let job = await AutoscoreJob.create({
        videoName,
        videoPath: videoPath || null,
        videoUrl: videoUrl || null,
        status: "pending",
        phase: "artifact_detection",
    });

    return jsonResponse({ job: serializeDoc(job) }, { status: 201 });
};
