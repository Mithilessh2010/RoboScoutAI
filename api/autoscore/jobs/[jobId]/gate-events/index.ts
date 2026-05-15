import type { NextApiRequest, NextApiResponse } from "next";
import { createGateEvent, getGateEvents } from "../../../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        let jobId = String(req.query.jobId ?? "");
        if (req.method === "GET") return res.status(200).json({ gateEvents: await getGateEvents(jobId) });
        if (req.method === "POST") return res.status(201).json({ gateEvent: await createGateEvent(jobId, req.body ?? {}) });
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
