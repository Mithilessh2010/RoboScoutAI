import type { NextApiRequest, NextApiResponse } from "next";
import { runFullDecodeAutoscore } from "../../../../packages/server/src/autoscore/decode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }
    try {
        return res.status(200).json(await runFullDecodeAutoscore(String(req.query.jobId ?? "")));
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
