// @ts-nocheck
import { execFile } from "child_process";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { connectDB } from "../db/mongodb";
import { AutoscoreDetection } from "../db/schemas/AutoscoreDetection";
import { AutoscoreJob } from "../db/schemas/AutoscoreJob";
import { AutoscoreSummary } from "../db/schemas/AutoscoreSummary";
import { AutoscoreCalibrationZone } from "../db/schemas/AutoscoreCalibrationZone";
import { AutoscorePenalty } from "../db/schemas/AutoscorePenalty";
import { AutoscoreTimelineEvent } from "../db/schemas/AutoscoreTimelineEvent";
import { AutoscoreGateEvent } from "../db/schemas/AutoscoreGateEvent";
import { AutoscoreRampCountState } from "../db/schemas/AutoscoreRampCountState";

const execFileAsync = promisify(execFile);

export const AUTOSCORE_MODEL_PATH =
  "services/video-processing/models/decode/best.pt";
export const AUTOSCORE_ROBOT_MODEL_PATH =
  "services/video-processing/models/decode/robot/best.pt";
export const AUTOSCORE_PREDICT_SCRIPT =
  "scripts/decode/predict_video_decode.py";
export const AUTOSCORE_PREDICTIONS_DIR = "decode-training/predictions";
const AUTOSCORE_WORKER_URL = (
  process.env.AUTOSCORE_WORKER_URL || process.env.VIDEO_PROCESSING_API_URL
)?.replace(/\/$/, "");
const AUTOSCORE_WORKER_SECRET = process.env.AUTOSCORE_WORKER_SECRET;

type DetectionClassName = "artifact_green" | "artifact_purple" | "robot";

type PredictionFrame = {
  frame: number;
  timestamp: number;
  detections: Array<{
    bbox_xyxy: [number, number, number, number];
    confidence: number;
    class_id: number;
    class_name: DetectionClassName;
    detector_type?: "artifact" | "robot";
  }>;
};

type PredictionJson = {
  source?: string;
  source_type?: "image" | "video";
  model?: string;
  models?: Array<{ detector_type: string; path: string }>;
  width?: number;
  height?: number;
  fps?: number;
  frame_stride?: number;
  detections: PredictionFrame[];
};

export function repoRoot() {
  let current = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (
      path.basename(current) === "RoboScoutAI" ||
      existsSync(path.join(current, AUTOSCORE_PREDICT_SCRIPT)) ||
      existsSync(path.join(current, "package.json"))
    ) {
      return current;
    }
    current = path.dirname(current);
  }
  return process.cwd();
}

export function resolveRepoPath(value: string) {
  return path.isAbsolute(value) ? value : path.join(repoRoot(), value);
}

function resolveOutputDir() {
  return process.env.VERCEL
    ? path.join("/tmp", AUTOSCORE_PREDICTIONS_DIR)
    : resolveRepoPath(AUTOSCORE_PREDICTIONS_DIR);
}

export function serializeDoc(doc: any) {
  let plain = typeof doc?.toObject === "function" ? doc.toObject() : doc;
  return {
    ...plain,
    _id: String(plain._id),
    jobId: plain.jobId ? String(plain.jobId) : undefined,
  };
}

export async function listAutoscoreJobs() {
  await connectDB();
  let jobs = await AutoscoreJob.find({}).sort({ createdAt: -1 }).limit(50);
  let summaries = await AutoscoreSummary.find({
    jobId: { $in: jobs.map((job) => job._id) },
  });
  let summaryByJobId = new Map(
    summaries.map((summary) => [String(summary.jobId), serializeDoc(summary)])
  );
  return jobs.map((job) => ({
    ...serializeDoc(job),
    summary: summaryByJobId.get(String(job._id)) ?? null,
  }));
}

export async function createAutoscoreJob(input: {
  matchName?: string;
  eventName?: string;
  videoName?: string;
  videoPath?: string;
  videoUrl?: string;
  redTeam1?: string;
  redTeam2?: string;
  blueTeam1?: string;
  blueTeam2?: string;
  motif?: string;
}) {
  await connectDB();
  let videoPath = input.videoPath?.trim() || "";
  let videoUrl = input.videoUrl?.trim() || "";
  if (!videoPath && !videoUrl) {
    throw new Error("Provide videoPath or videoUrl.");
  }
  let videoName =
    input.videoName?.trim() || path.basename(videoPath || videoUrl);
  let job = await AutoscoreJob.create({
    matchName: input.matchName?.trim() || videoName,
    eventName: input.eventName?.trim() || "",
    videoName,
    videoPath: videoPath || null,
    videoUrl: videoUrl || null,
    redTeam1: input.redTeam1?.trim() || "",
    redTeam2: input.redTeam2?.trim() || "",
    blueTeam1: input.blueTeam1?.trim() || "",
    blueTeam2: input.blueTeam2?.trim() || "",
    motif: input.motif || "unknown",
    status: videoUrl ? "video_uploaded" : "pending",
    phase: "artifact_detection",
  });
  return serializeDoc(job);
}

export async function updateAutoscoreJob(jobId: string, input: any) {
  await connectDB();
  let allowed = [
    "matchName",
    "eventName",
    "videoName",
    "videoPath",
    "videoUrl",
    "status",
    "phase",
    "redTeam1",
    "redTeam2",
    "blueTeam1",
    "blueTeam2",
    "motif",
    "confidenceThreshold",
    "manualLeave",
    "manualBase",
    "confirmedZones",
  ];
  let update = Object.fromEntries(
    allowed.filter((key) => key in input).map((key) => [key, input[key]])
  );
  let job = await AutoscoreJob.findByIdAndUpdate(jobId, update, { new: true });
  return job ? serializeDoc(job) : null;
}

export async function getAutoscoreJob(jobId: string) {
  await connectDB();
  let job = await AutoscoreJob.findById(jobId);
  if (!job) return null;
  let summary = await AutoscoreSummary.findOne({ jobId: job._id });
  return {
    job: serializeDoc(job),
    summary: summary ? serializeDoc(summary) : null,
  };
}

export async function getAutoscoreDetections(jobId: string, limit = 500) {
  await connectDB();
  let job = await AutoscoreJob.findById(jobId);
  if (!job) return null;
  let cappedLimit = Math.min(Math.max(limit, 1), 50000);
  let detections = await AutoscoreDetection.find({ jobId: job._id })
    .sort({ frameNumber: 1, confidence: -1 })
    .limit(cappedLimit);
  let summary = await AutoscoreSummary.findOne({ jobId: job._id });
  return {
    job: serializeDoc(job),
    summary: summary ? serializeDoc(summary) : null,
    detections: detections.map(serializeDoc),
  };
}

export async function getAutoscoreRobotDetections(jobId: string, limit = 500) {
  await connectDB();
  let cappedLimit = Math.min(Math.max(limit, 1), 2000);
  return (
    await AutoscoreDetection.find({ jobId, className: "robot" })
      .sort({ frameNumber: 1, confidence: -1 })
      .limit(cappedLimit)
  ).map(serializeDoc);
}

export async function getCalibrationZones(jobId: string) {
  await connectDB();
  return (
    await AutoscoreCalibrationZone.find({ jobId }).sort({
      zoneType: 1,
      index: 1,
    })
  ).map(serializeDoc);
}

export async function upsertCalibrationZone(jobId: string, input: any) {
  await connectDB();
  let zone = await AutoscoreCalibrationZone.findOneAndUpdate(
    { jobId, zoneType: input.zoneType, index: input.index ?? null },
    {
      jobId,
      zoneType: input.zoneType,
      alliance: input.alliance ?? null,
      shapeType: input.shapeType ?? "rectangle",
      coordinates: input.coordinates ?? [],
      frameTimestamp: input.frameTimestamp ?? 0,
      color: input.color ?? null,
      index: input.index ?? null,
    },
    { upsert: true, new: true }
  );
  await AutoscoreJob.findByIdAndUpdate(jobId, { status: "calibrated" });
  return serializeDoc(zone);
}

export async function clearCalibrationZones(jobId: string) {
  await connectDB();
  await AutoscoreCalibrationZone.deleteMany({ jobId });
}

export async function updateCalibrationZone(zoneId: string, input: any) {
  await connectDB();
  let zone = await AutoscoreCalibrationZone.findByIdAndUpdate(zoneId, input, {
    new: true,
  });
  return zone ? serializeDoc(zone) : null;
}

export async function deleteCalibrationZone(zoneId: string) {
  await connectDB();
  return AutoscoreCalibrationZone.findByIdAndDelete(zoneId);
}

export async function getTimeline(jobId: string) {
  await connectDB();
  return (
    await AutoscoreTimelineEvent.find({ jobId }).sort({
      timestamp: 1,
      createdAt: 1,
    })
  ).map(serializeDoc);
}

export async function createTimelineEvent(jobId: string, input: any) {
  await connectDB();
  let row = await AutoscoreTimelineEvent.create({
    jobId,
    manualOverride: true,
    reviewed: false,
    ...input,
  });
  return serializeDoc(row);
}

export async function updateTimelineEvent(eventId: string, input: any) {
  await connectDB();
  let row = await AutoscoreTimelineEvent.findByIdAndUpdate(eventId, input, {
    new: true,
  });
  return row ? serializeDoc(row) : null;
}

export async function deleteTimelineEvent(eventId: string) {
  await connectDB();
  return AutoscoreTimelineEvent.findByIdAndDelete(eventId);
}

export async function getPenalties(jobId: string) {
  await connectDB();
  return (await AutoscorePenalty.find({ jobId }).sort({ createdAt: 1 })).map(
    serializeDoc
  );
}

export async function createPenalty(jobId: string, input: any) {
  await connectDB();
  let committingAlliance = input.committingAlliance;
  let creditedAlliance = committingAlliance === "red" ? "blue" : "red";
  let pointsPer = input.foulType === "major" ? 15 : 5;
  let row = await AutoscorePenalty.create({
    jobId,
    timestamp: input.timestamp ?? null,
    committingAlliance,
    creditedAlliance,
    foulType: input.foulType,
    count: input.count ?? 1,
    points: pointsPer * (input.count ?? 1),
    note: input.note ?? null,
  });
  return serializeDoc(row);
}

export async function updatePenalty(penaltyId: string, input: any) {
  await connectDB();
  if (input.committingAlliance)
    input.creditedAlliance =
      input.committingAlliance === "red" ? "blue" : "red";
  if (input.foulType || input.count) {
    let current = await AutoscorePenalty.findById(penaltyId);
    let foulType = input.foulType ?? current?.foulType;
    let count = input.count ?? current?.count ?? 1;
    input.points = (foulType === "major" ? 15 : 5) * count;
  }
  let row = await AutoscorePenalty.findByIdAndUpdate(penaltyId, input, {
    new: true,
  });
  return row ? serializeDoc(row) : null;
}

export async function deletePenalty(penaltyId: string) {
  await connectDB();
  return AutoscorePenalty.findByIdAndDelete(penaltyId);
}

export async function getGateEvents(jobId: string) {
  await connectDB();
  return (await AutoscoreGateEvent.find({ jobId }).sort({ timestamp: 1 })).map(
    serializeDoc
  );
}

export async function createGateEvent(jobId: string, input: any) {
  await connectDB();
  let row = await AutoscoreGateEvent.create({
    jobId,
    alliance: input.alliance,
    timestamp: input.timestamp,
    eventType: "manual_gate_opened",
    source: "manual",
    releasedCount: input.releasedCount ?? null,
    note: input.note ?? null,
  });
  return serializeDoc(row);
}

export async function getRampCountStates(jobId: string) {
  await connectDB();
  return (
    await AutoscoreRampCountState.find({ jobId }).sort({
      timestamp: 1,
      alliance: 1,
    })
  ).map(serializeDoc);
}

export async function createManualRampCorrection(jobId: string, input: any) {
  await connectDB();
  let previous = await AutoscoreRampCountState.findOne({
    jobId,
    alliance: input.alliance,
    timestamp: { $lte: input.timestamp },
  }).sort({ timestamp: -1 });
  let stableCount = Number(input.stableCount ?? previous?.stableCount ?? 0);
  let previousStableCount = Number(previous?.stableCount ?? stableCount);
  let row = await AutoscoreRampCountState.create({
    jobId,
    alliance: input.alliance,
    timestamp: Number(input.timestamp ?? 0),
    frameNumber: Number(input.frameNumber ?? previous?.frameNumber ?? 0),
    rawCount: stableCount,
    stableCount,
    previousStableCount,
    countDelta: stableCount - previousStableCount,
    confidence: 1,
    relatedDetectionIds: [],
    manualOverride: true,
    warning: input.note ?? "Manual ramp count correction.",
  });
  return serializeDoc(row);
}

export async function updateGateEvent(gateEventId: string, input: any) {
  await connectDB();
  let row = await AutoscoreGateEvent.findByIdAndUpdate(gateEventId, input, {
    new: true,
  });
  return row ? serializeDoc(row) : null;
}

export async function deleteGateEvent(gateEventId: string) {
  await connectDB();
  return AutoscoreGateEvent.findByIdAndDelete(gateEventId);
}

export async function runBackendArtifactDetection(
  jobId: string,
  detectorMode = "artifact",
  options: { stride?: number; saveAnnotated?: boolean } = {}
) {
  await connectDB();
  let job = await AutoscoreJob.findById(jobId);
  if (!job) {
    throw new Error("Autoscore job not found.");
  }

  if (AUTOSCORE_WORKER_URL) {
    return startRemoteArtifactDetection(job, detectorMode, options);
  }

  let sourcePath = await resolveJobVideoSource(job);
  let modelPath = resolveRepoPath(AUTOSCORE_MODEL_PATH);
  let robotModelPath = resolveRepoPath(AUTOSCORE_ROBOT_MODEL_PATH);
  let scriptPath = resolveRepoPath(AUTOSCORE_PREDICT_SCRIPT);
  let outputDir = resolveOutputDir();

  if (!existsSync(modelPath)) {
    throw new Error(`Missing local model file: ${AUTOSCORE_MODEL_PATH}`);
  }
  if (!existsSync(scriptPath)) {
    throw new Error(`Missing prediction script: ${AUTOSCORE_PREDICT_SCRIPT}`);
  }
  if (!existsSync(sourcePath)) {
    throw new Error(`Video is not available to the backend: ${sourcePath}`);
  }

  await job.updateOne({
    status: "detecting",
    errorMessage: null,
    phase: "artifact_detection",
  });

  try {
    await mkdir(outputDir, { recursive: true });
    await execFileAsync(
      "python3",
      [
        scriptPath,
        sourcePath,
        "--model",
        modelPath,
        ...(detectorMode in { robot: true, both: true } && existsSync(robotModelPath)
          ? ["--robot-model", robotModelPath]
          : []),
        "--detector-mode",
        detectorMode,
        "--stride",
        String(options.stride ?? (detectorMode === "artifact" ? 30 : 45)),
        "--conf",
        "0.25",
        ...(options.saveAnnotated ? ["--save-annotated"] : []),
        "--out",
        outputDir,
      ],
      {
        cwd: repoRoot(),
        maxBuffer: 1024 * 1024 * 20,
        timeout: 1000 * 60 * 8,
      }
    );

    let predictionJsonPath = path.join(
      outputDir,
      `${path.parse(sourcePath).name}.json`
    );
    let prediction = JSON.parse(
      await readFile(predictionJsonPath, "utf8")
    ) as PredictionJson;
    let rows = flattenDetections(job._id, prediction);
    let confidences = rows.map((row) => row.confidence);
    let totalDetections = rows.length;
    let artifactGreenCount = rows.filter(
      (row) => row.className === "artifact_green"
    ).length;
    let artifactPurpleCount = rows.filter(
      (row) => row.className === "artifact_purple"
    ).length;
    let robotDetectionCount = rows.filter(
      (row) => row.className === "robot"
    ).length;
    let averageConfidence = confidences.length
      ? confidences.reduce((sum, confidence) => sum + confidence, 0) /
        confidences.length
      : 0;
    let maxConfidence = confidences.length ? Math.max(...confidences) : 0;

    await AutoscoreDetection.deleteMany({ jobId: job._id });
    if (rows.length) await AutoscoreDetection.insertMany(rows);
    await AutoscoreSummary.findOneAndUpdate(
      { jobId: job._id },
      {
        jobId: job._id,
        totalDetections,
        artifactGreenCount,
        artifactPurpleCount,
        robotDetectionCount,
        averageConfidence,
        maxConfidence,
      },
      { upsert: true, new: true }
    );

    let annotatedFramesPath = path.join(
      outputDir,
      path.parse(sourcePath).name,
      "annotated-frames"
    );
    await AutoscoreJob.findByIdAndUpdate(job._id, {
      status: "detection_complete",
      errorMessage: null,
      predictionJsonPath,
      annotatedFramesPath,
    });

    return {
      predictionJsonPath,
      annotatedFramesPath,
      summary: {
        totalDetections,
        artifactGreenCount,
        artifactPurpleCount,
        robotDetectionCount,
        averageConfidence,
        maxConfidence,
      },
    };
  } catch (err) {
    let message = err instanceof Error ? err.message : String(err);
    await AutoscoreJob.findByIdAndUpdate(job._id, {
      status: "failed",
      errorMessage: message,
    });
    throw err;
  }
}

async function startRemoteArtifactDetection(
  job: any,
  detectorMode = "artifact",
  options: { stride?: number; saveAnnotated?: boolean } = {}
) {
  if (!job.videoUrl) {
    throw new Error(
      "Fly autoscore worker requires a videoUrl. Upload the video or provide a direct video URL."
    );
  }

  await job.updateOne({
    status: "detecting",
    errorMessage: null,
    phase: "artifact_detection",
  });
  let response = await fetch(`${AUTOSCORE_WORKER_URL}/run-artifact-detection`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(AUTOSCORE_WORKER_SECRET
        ? { authorization: `Bearer ${AUTOSCORE_WORKER_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      jobId: String(job._id),
      videoUrl: job.videoUrl,
      stride: options.stride ?? (detectorMode === "artifact" ? 30 : 45),
      conf: 0.25,
      saveAnnotated: options.saveAnnotated ?? false,
      detectorMode,
    }),
  });

  let body = await response.json().catch(() => ({}));
  if (!response.ok) {
    let message =
      body.error ||
      body.detail ||
      `Autoscore worker failed to start (${response.status}).`;
    await AutoscoreJob.findByIdAndUpdate(job._id, {
      status: "failed",
      errorMessage: message,
    });
    throw new Error(message);
  }

  return {
    started: true,
    jobId: String(job._id),
    message: "Artifact detection started on the Fly.io worker.",
  };
}

async function resolveJobVideoSource(job: any) {
  if (job.videoPath) {
    let sourcePath = resolveRepoPath(job.videoPath);
    if (!existsSync(sourcePath)) {
      throw new Error(
        "That local video path is not available on this server. On Vercel, create the job with a public video URL instead of a local Mac path."
      );
    }
    return sourcePath;
  }

  if (job.videoUrl) {
    return downloadVideoUrl(job.videoUrl, String(job._id));
  }

  throw new Error(
    "Phase 1 artifact detection requires a local videoPath or videoUrl."
  );
}

async function downloadVideoUrl(videoUrl: string, jobId: string) {
  let url = new URL(videoUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Video URL must use http or https.");
  }

  let response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Could not download video URL: ${response.status} ${response.statusText}`
    );
  }

  let ext = path.extname(url.pathname) || ".mp4";
  let videoDir = path.join("/tmp", "decode-autoscore-videos");
  await mkdir(videoDir, { recursive: true });
  let videoPath = path.join(videoDir, `${jobId}${ext}`);
  await writeFile(videoPath, Buffer.from(await response.arrayBuffer()));
  return videoPath;
}

function flattenDetections(jobId: any, prediction: PredictionJson) {
  let frameWidth = prediction.width ?? null;
  let frameHeight = prediction.height ?? null;
  return prediction.detections.flatMap((frame) =>
    frame.detections.map((detection) => {
      let [x1, y1, x2, y2] = detection.bbox_xyxy;
      return {
        jobId,
        frameNumber: frame.frame,
        timestamp: frame.timestamp,
        frameWidth,
        frameHeight,
        className: detection.class_name,
        classId: detection.class_id,
        phase:
          frame.timestamp <= 30
            ? "AUTO"
            : frame.timestamp >= 150
            ? "ENDGAME"
            : "TELEOP",
        detectorType:
          detection.detector_type ??
          (detection.class_name === "robot" ? "robot" : "artifact"),
        artifactColor:
          detection.class_name === "artifact_green"
            ? "green"
            : detection.class_name === "artifact_purple"
            ? "purple"
            : null,
        confidence: detection.confidence,
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        centerX: frameWidth ? (x1 + x2) / 2 / frameWidth : null,
        centerY: frameHeight ? (y1 + y2) / 2 / frameHeight : null,
      };
    })
  );
}
