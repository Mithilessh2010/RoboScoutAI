import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../../../packages/server/src/db/mongodb";
import { AutoscoreTimelineEvent } from "../../../../packages/server/src/db/schemas/AutoscoreTimelineEvent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        await connectDB();
        const jobId = String(req.query.jobId ?? "");

        if (req.method === "GET") {
            const events = await AutoscoreTimelineEvent.find({ jobId }).sort({ timestamp: 1 }).lean();
            return res.status(200).json({ events });
        }

        if (req.method === "POST") {
            const { timestamp, eventType, details, confidence, detectionId } = req.body ?? {};
            if (typeof timestamp !== "number" || !eventType) {
                return res.status(400).json({ error: "timestamp (number) and eventType required" });
            }
            const ev = await AutoscoreTimelineEvent.create({
                jobId,
                timestamp,
                eventType,
                details: details ?? null,
                confidence: confidence ?? null,
                detectionId: detectionId ?? null,
            });
            return res.status(201).json({ event: ev });
        }

        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
