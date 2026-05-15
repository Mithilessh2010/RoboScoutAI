import type { NextApiRequest, NextApiResponse } from "next";
import { getAutoscoreJob, updateAutoscoreJob } from "../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    let jobId = String(req.query.jobId ?? "");
    if (req.method === "GET") {
        let result = await getAutoscoreJob(jobId);
        if (!result) return res.status(404).json({ error: "Autoscore job not found" });
        return res.status(200).json(result);
    }
    if (req.method === "PUT") {
        let job = await updateAutoscoreJob(jobId, req.body ?? {});
        if (!job) return res.status(404).json({ error: "Autoscore job not found" });
        return res.status(200).json({ job });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
}
