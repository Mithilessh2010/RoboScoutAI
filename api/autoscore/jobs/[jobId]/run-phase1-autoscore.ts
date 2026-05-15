import type { NextApiRequest, NextApiResponse } from "next";
import { runPhase1Autoscore } from "../../../../packages/server/src/autoscore/phase1";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const jobId = String(req.query.jobId ?? "");
        const openRouterKey = process.env.OPENROUTER_API_KEY || null;
        const result = await runPhase1Autoscore(jobId, { openRouterKey: openRouterKey ?? undefined });
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
