import type { NextApiRequest, NextApiResponse } from "next";
import { runBackendArtifactDetection } from "../../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        let jobId = String(req.query.jobId ?? "");
        return res.status(200).json(await runBackendArtifactDetection(jobId));
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
