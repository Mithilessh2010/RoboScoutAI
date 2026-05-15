import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { connectDB } from "$lib/server/db/mongodb";

export const GET: RequestHandler = async ({ params }) => {
    const jobId = String(params.jobId ?? "");
    if (!jobId) return json({ error: "Missing jobId" }, { status: 400 });

    try {
        await connectDB();
        // Use the existing mongoose connection
        const mongoose = await import("mongoose");
        const ObjectId = mongoose.Types.ObjectId;
        const db = mongoose.connection.db;

        const logs = await db
            .collection("autoscorelogs")
            .find({ jobId: new ObjectId(jobId) })
            .sort({ createdAt: 1 })
            .limit(1000)
            .toArray();

        return json({ logs });
    } catch (err) {
        return json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
};
