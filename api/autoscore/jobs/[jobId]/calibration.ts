import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../../../packages/server/src/db/mongodb";
import { AutoscoreCalibrationZone } from "../../../../packages/server/src/db/schemas/AutoscoreCalibrationZone";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        await connectDB();
        const jobId = String(req.query.jobId ?? "");

        if (req.method === "GET") {
            const zones = await AutoscoreCalibrationZone.find({ jobId }).lean();
            return res.status(200).json({ zones });
        }

        if (req.method === "POST") {
            const { zoneName, points } = req.body ?? {};
            if (!zoneName) return res.status(400).json({ error: "zoneName required" });
            const doc = await AutoscoreCalibrationZone.findOneAndUpdate(
                { jobId, zoneType: zoneName },
                { jobId, zoneType: zoneName, coordinates: points || [], shapeType: "polygon" },
                { upsert: true, new: true }
            );
            return res.status(201).json({ zone: doc });
        }

        if (req.method === "DELETE") {
            const zoneName = String(req.query.zoneName ?? "");
            if (!zoneName) return res.status(400).json({ error: "zoneName query param required" });
            await AutoscoreCalibrationZone.deleteOne({ jobId, zoneType: zoneName });
            return res.status(200).json({ deleted: true });
        }

        res.setHeader("Allow", "GET, POST, DELETE");
        return res.status(405).json({ error: "Method not allowed" });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
