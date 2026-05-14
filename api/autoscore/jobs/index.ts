import type { NextApiRequest, NextApiResponse } from "next";
import { createAutoscoreJob, listAutoscoreJobs } from "../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "GET") {
            return res.status(200).json({ jobs: await listAutoscoreJobs() });
        }
        if (req.method === "POST") {
            let job = await createAutoscoreJob(req.body ?? {});
            return res.status(201).json({ job });
        }
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
