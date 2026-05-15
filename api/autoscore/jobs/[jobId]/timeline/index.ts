import type { NextApiRequest, NextApiResponse } from "next";
import { createTimelineEvent, getTimeline } from "../../../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        let jobId = String(req.query.jobId ?? "");
        if (req.method === "GET") return res.status(200).json({ events: await getTimeline(jobId) });
        if (req.method === "POST") return res.status(201).json({ event: await createTimelineEvent(jobId, req.body ?? {}) });
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
