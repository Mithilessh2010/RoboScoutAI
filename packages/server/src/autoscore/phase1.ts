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

    // Simple event generation: create an artifact_detected + immediate score event per detection
    let lastScoreAt = -Infinity;
    const cooldownSeconds = 1.0;
    const createdEvents: any[] = [];

    for (const det of detections) {
        const ts = det.timestamp ?? 0;
        const confidence = det.confidence ?? 0;
        if (confidence < 0.25) continue;

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
