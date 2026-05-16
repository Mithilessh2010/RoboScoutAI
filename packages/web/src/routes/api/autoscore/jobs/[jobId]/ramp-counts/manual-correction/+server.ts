import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { createManualRampCorrection } from "$lib/server/decodeAutoscore";

export const POST: RequestHandler = async ({ params, request }) =>
  json(
    {
      rampCount: await createManualRampCorrection(
        params.jobId,
        await request.json()
      ),
    },
    { status: 201 }
  );
