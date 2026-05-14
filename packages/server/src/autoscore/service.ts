// @ts-nocheck
import { execFile } from "child_process";
import { existsSync } from "fs";
import { mkdir, readFile } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { connectDB } from "../db/mongodb";
import { AutoscoreDetection } from "../db/schemas/AutoscoreDetection";
import { AutoscoreJob } from "../db/schemas/AutoscoreJob";
import { AutoscoreSummary } from "../db/schemas/AutoscoreSummary";

const execFileAsync = promisify(execFile);

export const AUTOSCORE_MODEL_PATH = "services/video-processing/models/decode/best.pt";
export const AUTOSCORE_PREDICT_SCRIPT = "scripts/decode/predict_video_decode.py";
export const AUTOSCORE_PREDICTIONS_DIR = "decode-training/predictions";

type ArtifactClassName = "artifact_green" | "artifact_purple";

type PredictionFrame = {
    frame: number;
    timestamp: number;
    detections: Array<{
        bbox_xyxy: [number, number, number, number];
        confidence: number;
        class_id: number;
        class_name: ArtifactClassName;
    }>;
};

type PredictionJson = {
    source?: string;
    source_type?: "image" | "video";
    model: string;
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
    let summaryByJobId = new Map(summaries.map((summary) => [String(summary.jobId), serializeDoc(summary)]));
    return jobs.map((job) => ({
        ...serializeDoc(job),
        summary: summaryByJobId.get(String(job._id)) ?? null,
    }));
}

export async function createAutoscoreJob(input: {
    videoName?: string;
    videoPath?: string;
    videoUrl?: string;
}) {
    await connectDB();
    let videoPath = input.videoPath?.trim() || "";
    let videoUrl = input.videoUrl?.trim() || "";
    if (!videoPath && !videoUrl) {
        throw new Error("Provide videoPath or videoUrl.");
    }
    let videoName = input.videoName?.trim() || path.basename(videoPath || videoUrl);
    let job = await AutoscoreJob.create({
        videoName,
        videoPath: videoPath || null,
        videoUrl: videoUrl || null,
        status: "pending",
        phase: "artifact_detection",
    });
    return serializeDoc(job);
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
    let cappedLimit = Math.min(Math.max(limit, 1), 2000);
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

export async function runBackendArtifactDetection(jobId: string) {
    await connectDB();
    let job = await AutoscoreJob.findById(jobId);
    if (!job) {
        throw new Error("Autoscore job not found.");
    }
    if (!job.videoPath) {
        throw new Error("Phase 1 artifact detection requires a backend-accessible local videoPath.");
    }

    let sourcePath = resolveRepoPath(job.videoPath);
    let modelPath = resolveRepoPath(AUTOSCORE_MODEL_PATH);
    let scriptPath = resolveRepoPath(AUTOSCORE_PREDICT_SCRIPT);
    let outputDir = resolveRepoPath(AUTOSCORE_PREDICTIONS_DIR);

    if (!existsSync(modelPath)) {
        throw new Error(`Missing local model file: ${AUTOSCORE_MODEL_PATH}`);
    }
    if (!existsSync(scriptPath)) {
        throw new Error(`Missing prediction script: ${AUTOSCORE_PREDICT_SCRIPT}`);
    }
    if (!existsSync(sourcePath)) {
        throw new Error(`Video is not available to the backend: ${job.videoPath}`);
    }

    await job.updateOne({ status: "running", errorMessage: null, phase: "artifact_detection" });

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
                cwd: repoRoot(),
                maxBuffer: 1024 * 1024 * 20,
                timeout: 1000 * 60 * 8,
            }
        );

        let predictionJsonPath = path.join(outputDir, `${path.parse(sourcePath).name}.json`);
        let prediction = JSON.parse(await readFile(predictionJsonPath, "utf8")) as PredictionJson;
        let rows = flattenDetections(job._id, prediction);
        let confidences = rows.map((row) => row.confidence);
        let totalDetections = rows.length;
        let artifactGreenCount = rows.filter((row) => row.className === "artifact_green").length;
        let artifactPurpleCount = rows.filter((row) => row.className === "artifact_purple").length;
        let averageConfidence = confidences.length
            ? confidences.reduce((sum, confidence) => sum + confidence, 0) / confidences.length
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
        throw err;
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
