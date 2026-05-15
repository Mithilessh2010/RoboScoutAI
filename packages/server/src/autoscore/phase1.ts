import { connectDB } from "../db/mongodb";
import { AutoscoreDetection } from "../db/schemas/AutoscoreDetection";
import { AutoscoreTimelineEvent } from "../db/schemas/AutoscoreTimelineEvent";
import { ManualCalibrationZone } from "../db/schemas/ManualCalibrationZone";

const POINTS: Record<string, number> = {
    artifact_green: 5,
    artifact_purple: 10,
};

export async function runPhase1Autoscore(jobId: string, options: { openRouterKey?: string } = {}) {
    await connectDB();

    const detections = await AutoscoreDetection.find({ jobId }).sort({ timestamp: 1 }).lean();
    const zones = await ManualCalibrationZone.find({ jobId }).lean();
    const normalizedZones = zones
        .map((zone) => ({
            zoneName: zone.zoneName,
            points: (zone.points || []).map((point: any) => ({ x: point.x, y: point.y })),
        }))
        .filter((zone) => zone.points.length >= 3);

    // Simple event generation: create artifact_detected + score events, and annotate zone transitions when possible.
    let lastScoreAt = -Infinity;
    const cooldownSeconds = 1.0;
    const createdEvents: any[] = [];
    const zoneState = new Map<string, boolean>();

    for (const det of detections) {
        const ts = det.timestamp ?? 0;
        const confidence = det.confidence ?? 0;
        if (confidence < 0.25) continue;

        const center = getDetectionCenter(det);
        const normalizedCenter = normalizeCenter(center, det.frameWidth ?? null, det.frameHeight ?? null);

        for (const zone of normalizedZones) {
            const zoneKey = zone.zoneName;
            const isInside = normalizedCenter ? pointInPolygon(normalizedCenter, zone.points) : false;
            const wasInside = zoneState.get(zoneKey) ?? false;
            if (isInside !== wasInside) {
                await AutoscoreTimelineEvent.create({
                    jobId,
                    timestamp: ts,
                    eventType: isInside ? "enter_zone" : "exit_zone",
                    details: { zoneName: zoneKey, className: det.className },
                    confidence,
                    detectionId: det._id,
                });
                zoneState.set(zoneKey, isInside);
            }
        }

        const artifactEvent = await AutoscoreTimelineEvent.create({
            jobId,
            timestamp: ts,
            eventType: "artifact_detected",
            details: { className: det.className, confidence },
            confidence,
            detectionId: det._id,
        });
        createdEvents.push(artifactEvent);

        if (ts - lastScoreAt >= cooldownSeconds) {
            const points = POINTS[det.className] ?? 0;
            if (points > 0) {
                const scoreEvent = await AutoscoreTimelineEvent.create({
                    jobId,
                    timestamp: ts + 0.001,
                    eventType: "score",
                    details: { points, reason: `detected_${det.className}` },
                    confidence,
                    detectionId: det._id,
                });
                createdEvents.push(scoreEvent);
                lastScoreAt = ts;
            }
        }
    }

    // Optionally ask OpenRouter for a short summary
    let summaryText: string | null = null;
    if (options.openRouterKey) {
        try {
            const counts = detections.reduce(
                (acc: any, d: any) => {
                    acc.total += 1;
                    acc[d.className] = (acc[d.className] || 0) + 1;
                    return acc;
                },
                { total: 0 }
            );

            const prompt = `Summarize this autoscore job ${jobId}: total_detections=${counts.total}, artifact_green=${counts.artifact_green||0}, artifact_purple=${counts.artifact_purple||0}. Provide 2-3 concise scoring suggestions.`;

            const resp = await fetch("https://api.openrouter.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${options.openRouterKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 256,
                }),
            });
            const body = await resp.json().catch(() => ({}));
            // Try common response shapes
            summaryText = body?.choices?.[0]?.message?.content || body?.output?.[0]?.content || body?.result || JSON.stringify(body);
            if (typeof summaryText !== "string") summaryText = String(summaryText ?? "");

            if (summaryText) {
                await AutoscoreTimelineEvent.create({
                    jobId,
                    timestamp: 0,
                    eventType: "note",
                    details: { summary: summaryText },
                });
            }
        } catch (err) {
            console.warn("OpenRouter summarization failed:", err instanceof Error ? err.message : String(err));
        }
    }

    return { created: createdEvents.length, summary: summaryText };
}

function getDetectionCenter(det: any) {
    return {
        x: (det.x ?? 0) + (det.width ?? 0) / 2,
        y: (det.y ?? 0) + (det.height ?? 0) / 2,
    };
}

function normalizeCenter(center: { x: number; y: number }, frameWidth: number | null, frameHeight: number | null) {
    if (!frameWidth || !frameHeight) {
        return null;
    }
    return { x: center.x / frameWidth, y: center.y / frameHeight };
}

function pointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersects =
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.0000001) + xi;
        if (intersects) inside = !inside;
    }
    return inside;
}
