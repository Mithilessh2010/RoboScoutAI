import { error, type RequestHandler } from "@sveltejs/kit";
import { ensureAutoscoreDb, AutoscoreTimelineEvent, jsonResponse } from "$lib/server/autoscore";

export const GET: RequestHandler = async ({ params }) => {
    await ensureAutoscoreDb();
    const events = await AutoscoreTimelineEvent.find({ jobId: params.jobId }).sort({ timestamp: 1 }).lean();
    return jsonResponse({ events });
};

export const POST: RequestHandler = async ({ params, request }) => {
    await ensureAutoscoreDb();
    const body = await request.json().catch(() => ({}));
    const timestamp = Number(body.timestamp);
    const eventType = String(body.eventType ?? "").trim();
    if (!Number.isFinite(timestamp) || !eventType) {
        throw error(400, "timestamp and eventType are required.");
    }

    const event = await AutoscoreTimelineEvent.create({
        jobId: params.jobId,
        timestamp,
        eventType,
        details: body.details ?? null,
        confidence: body.confidence ?? null,
        detectionId: body.detectionId ?? null,
    });

    return jsonResponse({ event }, { status: 201 });
};
