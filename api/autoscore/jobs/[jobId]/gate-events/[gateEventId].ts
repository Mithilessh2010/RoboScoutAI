import type { NextApiRequest, NextApiResponse } from "next";
import { deleteGateEvent, updateGateEvent } from "../../../../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        let gateEventId = String(req.query.gateEventId ?? "");
        if (req.method === "PUT") return res.status(200).json({ gateEvent: await updateGateEvent(gateEventId, req.body ?? {}) });
        if (req.method === "DELETE") {
            await deleteGateEvent(gateEventId);
            return res.status(200).json({ deleted: true });
        }
        res.setHeader("Allow", "PUT, DELETE");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
