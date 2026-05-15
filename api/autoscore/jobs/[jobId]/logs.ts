import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";

async function ensureDbConnection() {
    if (mongoose.connection && mongoose.connection.readyState === 1) return;
    const databaseUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/ftcscout";
    await mongoose.connect(databaseUrl, {
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        await ensureDbConnection();
        const jobId = String(req.query.jobId ?? "");
        if (!jobId) return res.status(400).json({ error: "Missing jobId" });

        const ObjectId = mongoose.Types.ObjectId;
        const db = mongoose.connection.db;

        const logs = await db
            .collection("autoscorelogs")
            .find({ jobId: new ObjectId(jobId) })
            .sort({ createdAt: 1 })
            .limit(1000)
            .toArray();

        return res.status(200).json({ logs });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
