import type { NextApiRequest, NextApiResponse } from "next";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const MAX_AUTOSCORE_UPLOAD_BYTES = Number(process.env.AUTOSCORE_MAX_UPLOAD_BYTES ?? 1024 * 1024 * 1024);
const ALLOWED_VIDEO_CONTENT_TYPES = ["video/*", "application/octet-stream"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        return res.status(200).json({ ok: true, message: "Autoscore upload-video endpoint (GET)" });
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        let response = await handleUpload({
            body: req.body as HandleUploadBody,
            request: req,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: ALLOWED_VIDEO_CONTENT_TYPES,
                maximumSizeInBytes: MAX_AUTOSCORE_UPLOAD_BYTES,
                addRandomSuffix: true,
            }),
            onUploadCompleted: async ({ blob }) => {
                console.log("Autoscore video upload completed", blob.url);
            },
        });

        return res.status(200).json(response);
    } catch (err) {
        return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
}
