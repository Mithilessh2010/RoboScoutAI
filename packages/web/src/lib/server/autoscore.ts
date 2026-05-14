import { json, error, type RequestEvent } from "@sveltejs/kit";
import { execFile } from "child_process";
import { existsSync, readFileSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import mongoose, { Schema } from "mongoose";
import * as path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
let dbConnected = false;

const MODEL_PATH = "services/video-processing/models/decode/best.pt";
const PREDICT_SCRIPT = "scripts/decode/predict_video_decode.py";
const PREDICTIONS_DIR = "decode-training/predictions";
const UPLOADS_DIR = "decode-training/uploads";
const BUNDLED_MODEL_PATH = fileURLToPath(
    new URL("../../../../../services/video-processing/models/decode/best.pt", import.meta.url)
);
const BUNDLED_PREDICT_SCRIPT = fileURLToPath(
    new URL("../../../../../scripts/decode/predict_video_decode.py", import.meta.url)
);

const autoscoreJobSchema = new Schema(
    {
        videoName: { type: String, required: true },
        videoPath: { type: String, default: null },
        videoUrl: { type: String, default: null },
        status: {
            type: String,
            enum: ["pending", "running", "complete", "failed"],
            default: "pending",
            required: true,
        },
        phase: { type: String, enum: ["artifact_detection"], default: "artifact_detection", required: true },
        errorMessage: { type: String, default: null },
        predictionJsonPath: { type: String, default: null },
        annotatedFramesPath: { type: String, default: null },
    },
    { timestamps: true }
);

const autoscoreDetectionSchema = new Schema(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        frameNumber: { type: Number, required: true },
        timestamp: { type: Number, required: true },
        className: { type: String, enum: ["artifact_green", "artifact_purple"], required: true },
        classId: { type: Number, required: true },
        confidence: { type: Number, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
    },
    { timestamps: true }
);

const autoscoreSummarySchema = new Schema(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, unique: true, index: true },
        totalDetections: { type: Number, default: 0, required: true },
        artifactGreenCount: { type: Number, default: 0, required: true },
        artifactPurpleCount: { type: Number, default: 0, required: true },
        averageConfidence: { type: Number, default: 0, required: true },
        maxConfidence: { type: Number, default: 0, required: true },
    },
    { timestamps: true }
);

const manualCalibrationZoneSchema = new Schema(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        zoneName: {
            type: String,
            enum: ["goal_red", "goal_blue", "ramp_red", "ramp_blue", "base_red", "base_blue"],
            required: true,
        },
        points: {
            type: [
                {
                    x: { type: Number, required: true },
                    y: { type: Number, required: true },
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

autoscoreJobSchema.index({ status: 1, updatedAt: -1 });
autoscoreDetectionSchema.index({ jobId: 1, frameNumber: 1 });
manualCalibrationZoneSchema.index({ jobId: 1, zoneName: 1 }, { unique: true });

export const AutoscoreJob =
    mongoose.models.AutoscoreJob || mongoose.model("AutoscoreJob", autoscoreJobSchema);
export const AutoscoreDetection =
    mongoose.models.AutoscoreDetection ||
    mongoose.model("AutoscoreDetection", autoscoreDetectionSchema);
export const AutoscoreSummary =
    mongoose.models.AutoscoreSummary || mongoose.model("AutoscoreSummary", autoscoreSummarySchema);
export const ManualCalibrationZone =
    mongoose.models.ManualCalibrationZone ||
    mongoose.model("ManualCalibrationZone", manualCalibrationZoneSchema);

type PredictionFrame = {
    frame: number;
    timestamp: number;
    detections: Array<{
        bbox_xyxy: [number, number, number, number];
        confidence: number;
        class_id: number;
        class_name: "artifact_green" | "artifact_purple";
    }>;
};

type PredictionJson = {
    source?: string;
    video?: string;
    source_type?: "image" | "video";
    model: string;
    fps?: number;
    frame_stride?: number;
    detections: PredictionFrame[];
};

export function repoRoot() {
    let current = process.cwd();
    for (let i = 0; i < 6; i += 1) {
        if (
            path.basename(current) === "RoboScoutAI" ||
            existsSync(path.join(current, PREDICT_SCRIPT))
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

function resolveBundledRuntimeFile(repoRelativePath: string, bundledPath: string) {
    let repoPath = resolveRepoPath(repoRelativePath);
    return existsSync(repoPath) ? repoPath : bundledPath;
}

export function serializeDoc(doc: any) {
    let plain = typeof doc?.toObject === "function" ? doc.toObject() : doc;
    return {
        ...plain,
        _id: String(plain._id),
        jobId: plain.jobId ? String(plain.jobId) : undefined,
    };
}

export async function ensureAutoscoreDb() {
    if (dbConnected) return;
    let databaseUrl = process.env.DATABASE_URL || readRootEnv("DATABASE_URL") || "mongodb://localhost:27017/ftcscout";
    await mongoose.connect(databaseUrl, {
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
    dbConnected = true;
}

function readRootEnv(key: string) {
    let envPath = path.join(repoRoot(), ".env.local");
    if (!existsSync(envPath)) return "";
    let line = readFileSync(envPath, "utf8")
        .split(/\r?\n/)
        .find((entry) => entry.trim().startsWith(`${key}=`));
    if (!line) return "";
    return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

export async function parseCreateJobRequest(event: RequestEvent) {
    let contentType = event.request.headers.get("content-type") ?? "";
    let videoName = "";
    let videoPath = "";
    let videoUrl = "";

    if (contentType.includes("multipart/form-data")) {
        let form = await event.request.formData();
        videoName = String(form.get("videoName") ?? "").trim();
        videoPath = String(form.get("videoPath") ?? "").trim();
        videoUrl = String(form.get("videoUrl") ?? "").trim();
        let file = form.get("videoFile");

        if (file instanceof File && file.size > 0) {
            let safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            let uploadDir = resolveRepoPath(UPLOADS_DIR);
            await mkdir(uploadDir, { recursive: true });
            let uploadName = `${Date.now()}_${safeName}`;
            let uploadPath = path.join(uploadDir, uploadName);
            await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));
            videoPath = uploadPath;
            videoName = videoName || file.name;
        }
    } else {
        let body = await event.request.json().catch(() => ({}));
        videoName = String(body.videoName ?? "").trim();
        videoPath = String(body.videoPath ?? "").trim();
        videoUrl = String(body.videoUrl ?? "").trim();
    }

    if (!videoPath && !videoUrl) {
        throw error(400, "Provide videoPath, videoUrl, or upload a videoFile.");
    }

    if (!videoName) {
        videoName = path.basename(videoPath || videoUrl);
    }

    return { videoName, videoPath, videoUrl };
}

export async function runArtifactDetection(jobId: string) {
    await ensureAutoscoreDb();
    let job = await AutoscoreJob.findById(jobId);
    if (!job) {
        throw error(404, "Autoscore job not found.");
    }
    if (!job.videoPath) {
        throw error(400, "This Phase 1 detector requires a local videoPath or uploaded file.");
    }

    let root = repoRoot();
    let sourcePath = resolveRepoPath(job.videoPath);
    let modelPath = resolveBundledRuntimeFile(MODEL_PATH, BUNDLED_MODEL_PATH);
    let scriptPath = resolveBundledRuntimeFile(PREDICT_SCRIPT, BUNDLED_PREDICT_SCRIPT);
    let outputDir = resolveRepoPath(PREDICTIONS_DIR);

    await job.updateOne({
        status: "running",
        phase: "artifact_detection",
        errorMessage: null,
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
                "--stride",
                "90",
                "--conf",
                "0.25",
                "--save-annotated",
                "--out",
                outputDir,
            ],
            {
                cwd: root,
                maxBuffer: 1024 * 1024 * 20,
                timeout: 1000 * 60 * 30,
            }
        );

        let predictionJsonPath = path.join(outputDir, `${path.parse(sourcePath).name}.json`);
        let raw = await readFile(predictionJsonPath, "utf8");
        let prediction = JSON.parse(raw) as PredictionJson;
        let rows = flattenDetections(job._id, prediction);
        let confidences = rows.map((row) => row.confidence);
        let artifactGreenCount = rows.filter((row) => row.className === "artifact_green").length;
        let artifactPurpleCount = rows.filter((row) => row.className === "artifact_purple").length;
        let totalDetections = rows.length;
        let averageConfidence = confidences.length
            ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
            : 0;
        let maxConfidence = confidences.length ? Math.max(...confidences) : 0;

        await AutoscoreDetection.deleteMany({ jobId: job._id });
        if (rows.length) {
            await AutoscoreDetection.insertMany(rows);
        }
        await AutoscoreSummary.findOneAndUpdate(
            { jobId: job._id },
            {
                jobId: job._id,
                totalDetections,
                artifactGreenCount,
                artifactPurpleCount,
                averageConfidence,
                maxConfidence,
            },
            { upsert: true, new: true }
        );

        let annotatedFramesPath = path.join(outputDir, path.parse(sourcePath).name, "annotated-frames");
        await AutoscoreJob.findByIdAndUpdate(job._id, {
            status: "complete",
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
        throw error(500, message);
    }
}

function flattenDetections(jobId: any, prediction: PredictionJson) {
    return prediction.detections.flatMap((frame) =>
        frame.detections.map((detection) => {
            let [x1, y1, x2, y2] = detection.bbox_xyxy;
            return {
                jobId,
                frameNumber: frame.frame,
                timestamp: frame.timestamp,
                className: detection.class_name,
                classId: detection.class_id,
                confidence: detection.confidence,
                x: x1,
                y: y1,
                width: x2 - x1,
                height: y2 - y1,
            };
        })
    );
}

export function jsonResponse(body: any, init?: ResponseInit) {
    return json(body, init);
}
