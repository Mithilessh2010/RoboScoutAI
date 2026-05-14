import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../packages/server/src/db/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        await connectDB();
        return res.status(200).json({ status: "ok", db: "connected" });
    } catch (error) {
        return res.status(500).json({ status: "error", error: String(error) });
    }
}
