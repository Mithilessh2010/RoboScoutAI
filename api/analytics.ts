import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../packages/server/src/db/mongodb";
import { Analytics } from "../../packages/server/src/db/schemas/Analytics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        await connectDB();

        const bodyText = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

        // Parse analytics data from body
        let analyticsData: any;
        try {
            analyticsData = JSON.parse(bodyText);
        } catch {
            analyticsData = { raw: bodyText };
        }

        // Create analytics record
        await Analytics.create({
            url: analyticsData.url || "unknown",
            fromUrl: analyticsData.fromUrl || null,
            pathChanged: analyticsData.pathChanged || false,
            sessionId: analyticsData.sessionId || "unknown",
            userId: analyticsData.userId || "unknown",
            browser: analyticsData.browser || "unknown",
            deviceType: analyticsData.deviceType || "unknown",
            date: new Date(),
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Analytics error:", error);
        return res.status(500).json({ error: String(error) });
    }
}
