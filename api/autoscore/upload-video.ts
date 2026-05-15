import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const MAX_AUTOSCORE_UPLOAD_BYTES = Number(process.env.AUTOSCORE_MAX_UPLOAD_BYTES ?? 1024 * 1024 * 1024);
const ALLOWED_VIDEO_CONTENT_TYPES = ["video/*", "application/octet-stream"];

export default async function handler(request: Request) {
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

        return jsonResponse(response);
    } catch (err) {
        return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
    }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
}
