import type { NextApiRequest, NextApiResponse } from "next";
import {
  createAutoscoreJob,
  clearCalibrationZones,
  createGateEvent,
  createManualRampCorrection,
  createPenalty,
  createTimelineEvent,
  deleteTimelineEvent,
  deleteCalibrationZone,
  deleteGateEvent,
  deletePenalty,
  getAutoscoreDetections,
  getAutoscoreRobotDetections,
  getAutoscoreJob,
  getCalibrationZones,
  getGateEvents,
  getPenalties,
  getRampCountStates,
  getTimeline,
  listAutoscoreJobs,
  runBackendArtifactDetection,
  updateAutoscoreJob,
  updateCalibrationZone,
  updateGateEvent,
  updatePenalty,
  updateTimelineEvent,
  upsertCalibrationZone,
} from "../packages/server/src/autoscore/service";
import {
  recalculateDecodeScore,
  runFullDecodeAutoscore,
} from "../packages/server/src/autoscore/decode";
import { connectDB } from "../packages/server/src/db/mongodb";
import mongoose from "mongoose";

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
      if (parts[3]) {
        if (req.method === "PUT") return res.status(200).json({ zone: await updateCalibrationZone(parts[3], req.body ?? {}) });
        if (req.method === "DELETE") {
          await deleteCalibrationZone(parts[3]);
          return res.status(200).json({ deleted: true });
        }
        return methodNotAllowed(res, "PUT, DELETE");
      }
      if (req.method === "GET") return res.status(200).json({ zones: await getCalibrationZones(jobId) });
      if (req.method === "POST") return res.status(201).json({ zone: await upsertCalibrationZone(jobId, req.body ?? {}) });
      if (req.method === "DELETE") {
        await clearCalibrationZones(jobId);
        return res.status(200).json({ deleted: true });
      }
      return methodNotAllowed(res, "GET, POST, DELETE");
    }

    if (resource === "detections") {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      let limit = Number(req.query.limit ?? 500);
      let result = await getAutoscoreDetections(jobId, limit);
      if (!result) return res.status(404).json({ error: "Autoscore job not found" });
      return res.status(200).json(result);
    }

    if (resource === "robot-detections") {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      return res.status(200).json({ robotDetections: await getAutoscoreRobotDetections(jobId, Number(req.query.limit ?? 500)) });
    }

    if (resource === "run-artifact-detection") {
      if (req.method !== "POST") return methodNotAllowed(res, "POST");
      return res.status(200).json(await runBackendArtifactDetection(jobId));
    }

    if (resource === "run-robot-detection") {
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
      if (parts[3]) {
        if (req.method === "PUT") return res.status(200).json({ penalty: await updatePenalty(parts[3], req.body ?? {}) });
        if (req.method === "DELETE") {
          await deletePenalty(parts[3]);
          return res.status(200).json({ deleted: true });
        }
        return methodNotAllowed(res, "PUT, DELETE");
      }
      if (req.method === "GET") return res.status(200).json({ penalties: await getPenalties(jobId) });
      if (req.method === "POST") return res.status(201).json({ penalty: await createPenalty(jobId, req.body ?? {}) });
      return methodNotAllowed(res, "GET, POST");
    }

    if (resource === "gate-events") {
      if (parts[3]) {
        if (req.method === "PUT") return res.status(200).json({ gateEvent: await updateGateEvent(parts[3], req.body ?? {}) });
        if (req.method === "DELETE") {
          await deleteGateEvent(parts[3]);
          return res.status(200).json({ deleted: true });
        }
        return methodNotAllowed(res, "PUT, DELETE");
      }
      if (req.method === "GET") return res.status(200).json({ gateEvents: await getGateEvents(jobId) });
      if (req.method === "POST") return res.status(201).json({ gateEvent: await createGateEvent(jobId, req.body ?? {}) });
      return methodNotAllowed(res, "GET, POST");
    }

    if (resource === "ramp-counts") {
      if (parts[3] === "manual-correction") {
        if (req.method !== "POST") return methodNotAllowed(res, "POST");
        return res.status(201).json({ rampCount: await createManualRampCorrection(jobId, req.body ?? {}) });
      }
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      return res.status(200).json({ rampCounts: await getRampCountStates(jobId) });
    }

    if (resource === "summary") {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      let result = await getAutoscoreJob(jobId);
      return res.status(200).json({ summary: result?.summary ?? null });
    }

    if (resource === "logs") {
      if (req.method !== "GET") return methodNotAllowed(res, "GET");
      await connectDB();
      let ObjectId = mongoose.Types.ObjectId;
      let db = mongoose.connection.db;
      let logs = await db
        .collection("autoscorelogs")
        .find({ jobId: new ObjectId(jobId) })
        .sort({ createdAt: 1 })
        .limit(1000)
        .toArray();
      return res.status(200).json({ logs });
    }

    return res.status(404).json({ error: "Autoscore route not found" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
