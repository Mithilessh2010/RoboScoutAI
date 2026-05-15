import { json, type RequestHandler } from "@sveltejs/kit";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const MAX_AUTOSCORE_UPLOAD_BYTES = Number(process.env.AUTOSCORE_MAX_UPLOAD_BYTES ?? 1024 * 1024 * 1024);
const ALLOWED_VIDEO_CONTENT_TYPES = ["video/*", "application/octet-stream"];

export const POST: RequestHandler = async ({ request }) => {
    let body = (await request.json()) as HandleUploadBody;

    try {
        let response = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: ALLOWED_VIDEO_CONTENT_TYPES,
                maximumSizeInBytes: MAX_AUTOSCORE_UPLOAD_BYTES,
                addRandomSuffix: true,
            }),
            onUploadCompleted: async ({ blob }) => {
                console.log("Autoscore video upload completed", blob.url);
            },
        });

        return json(response);
    } catch (err) {
        return json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
    }
};

export const GET: RequestHandler = async () => {
    return json({ ok: true, message: "Autoscore upload-video endpoint (GET)" });
};
