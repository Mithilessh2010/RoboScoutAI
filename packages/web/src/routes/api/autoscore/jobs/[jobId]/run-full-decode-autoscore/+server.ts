import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { runFullDecodeAutoscore } from "$lib/server/decodeAutoscore";

export const POST: RequestHandler = async ({ params }) =>
  json(await runFullDecodeAutoscore(params.jobId));
