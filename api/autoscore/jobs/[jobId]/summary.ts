import type { NextApiRequest, NextApiResponse } from "next";
import { getAutoscoreJob } from "../../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method not allowed" });
    }
    let result = await getAutoscoreJob(String(req.query.jobId ?? ""));
    if (!result) return res.status(404).json({ error: "Autoscore job not found." });
    return res.status(200).json({ summary: result.summary });
}
