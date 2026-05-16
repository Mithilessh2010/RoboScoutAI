import type { NextApiRequest, NextApiResponse } from "next";
import {
  createAutoscoreJob,
  createGateEvent,
  createPenalty,
  createTimelineEvent,
  deleteTimelineEvent,
  getAutoscoreDetections,
  getAutoscoreJob,
  getCalibrationZones,
  getTimeline,
  listAutoscoreJobs,
  runBackendArtifactDetection,
  updateAutoscoreJob,
  updateTimelineEvent,
  upsertCalibrationZone,
} from "../packages/server/src/autoscore/service";
import {
  recalculateDecodeScore,
  runFullDecodeAutoscore,
} from "../packages/server/src/autoscore/decode";

function pathParts(req: NextApiRequest): string[] {
  let raw = Array.isArray(req.query.path) ? req.query.path.join("/") : String(req.query.path ?? "");
  return raw.split("/").filter(Boolean);
}

function methodNotAllowed(res: NextApiResponse, allow: string) {
  res.setHeader("Allow", allow);
  return res.status(405).json({ error: "Method not allowed" });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let parts = pathParts(req);

    if (parts.length === 1 && parts[0] === "jobs") {
      if (req.method === "GET") return res.status(200).json({ jobs: await listAutoscoreJobs() });
      if (req.method === "POST") return res.status(201).json({ job: await createAutoscoreJob(req.body ?? {}) });
      return methodNotAllowed(res, "GET, POST");
    }

    if (parts[0] !== "jobs" || !parts[1]) {
      return res.status(404).json({ error: "Autoscore route not found" });
    }

    let jobId = parts[1];

    if (parts.length === 2) {
      if (req.method === "GET") {
        let result = await getAutoscoreJob(jobId);
        if (!result) return res.status(404).json({ error: "Autoscore job not found" });
        return res.status(200).json(result);
      }
      if (req.method === "PUT") {
        let job = await updateAutoscoreJob(jobId, req.body ?? {});
        if (!job) return res.status(404).json({ error: "Autoscore job not found" });
        return res.status(200).json({ job });
      }
      return methodNotAllowed(res, "GET, PUT");
    }

    let resource = parts[2];
    if (resource === "calibration-zones") {
      if (req.method === "GET") return res.status(200).json({ zones: await getCalibrationZones(jobId) });
      if (req.method === "POST") return res.status(201).json({ zone: await upsertCalibrationZone(jobId, req.body ?? {}) });
      return methodNotAllowed(res, "GET, POST");
    }

    if (resource === "detections") {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      let limit = Number(req.query.limit ?? 500);
      let result = await getAutoscoreDetections(jobId, limit);
      if (!result) return res.status(404).json({ error: "Autoscore job not found" });
      return res.status(200).json(result);
    }

    if (resource === "run-artifact-detection") {
      if (req.method !== "POST") return methodNotAllowed(res, "POST");
      return res.status(200).json(await runBackendArtifactDetection(jobId));
    }

    if (resource === "run-full-decode-autoscore") {
      if (req.method !== "POST") return methodNotAllowed(res, "POST");
      return res.status(200).json(await runFullDecodeAutoscore(jobId));
    }

    if (resource === "recalculate-score") {
      if (req.method !== "POST") return methodNotAllowed(res, "POST");
      return res.status(200).json({ summary: await recalculateDecodeScore(jobId) });
    }

    if (resource === "timeline") {
      if (parts[3]) {
        if (req.method === "PUT") return res.status(200).json({ event: await updateTimelineEvent(parts[3], req.body ?? {}) });
        if (req.method === "DELETE") {
          await deleteTimelineEvent(parts[3]);
          return res.status(200).json({ deleted: true });
        }
        return methodNotAllowed(res, "PUT, DELETE");
      }
      if (req.method === "GET") return res.status(200).json({ events: await getTimeline(jobId) });
      if (req.method === "POST") return res.status(201).json({ event: await createTimelineEvent(jobId, req.body ?? {}) });
      return methodNotAllowed(res, "GET, POST");
    }

    if (resource === "penalties") {
      if (req.method === "POST") return res.status(201).json({ penalty: await createPenalty(jobId, req.body ?? {}) });
      return methodNotAllowed(res, "POST");
    }

    if (resource === "gate-events") {
      if (req.method === "POST") return res.status(201).json({ gateEvent: await createGateEvent(jobId, req.body ?? {}) });
      return methodNotAllowed(res, "POST");
    }

    return res.status(404).json({ error: "Autoscore route not found" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
