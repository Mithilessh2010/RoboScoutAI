import type { NextApiRequest, NextApiResponse } from "next";
import { deleteCalibrationZone, updateCalibrationZone } from "../../../../../packages/server/src/autoscore/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        let zoneId = String(req.query.zoneId ?? "");
        if (req.method === "PUT") return res.status(200).json({ zone: await updateCalibrationZone(zoneId, req.body ?? {}) });
        if (req.method === "DELETE") {
            await deleteCalibrationZone(zoneId);
            return res.status(200).json({ deleted: true });
        }
        res.setHeader("Allow", "PUT, DELETE");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
