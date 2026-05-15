import mongoose, { Schema, Document } from "mongoose";

export type AutoscoreJobStatus =
    | "pending"
    | "video_uploaded"
    | "teams_needed"
    | "calibration_needed"
    | "calibrated"
    | "detecting"
    | "detection_complete"
    | "scoring"
    | "review_needed"
    | "complete"
    | "failed";

export interface IAutoscoreJob extends Document {
    matchName?: string;
    eventName?: string;
    season: "DECODE";
    videoName: string;
    videoPath?: string;
    videoUrl?: string;
    status: AutoscoreJobStatus;
    phase: "artifact_detection" | "decode_autoscore";
    redTeam1?: string;
    redTeam2?: string;
    blueTeam1?: string;
    blueTeam2?: string;
    motif: "GPP" | "PGP" | "PPG" | "manual" | "unknown";
    modelPath: string;
    confidenceThreshold: number;
    manualLeave: Record<string, "yes" | "no" | "unknown">;
    manualBase: Record<string, "none" | "partial" | "full" | "unknown">;
    errorMessage?: string;
    predictionJsonPath?: string;
    annotatedFramesPath?: string;
    progress?: number;
    createdAt: Date;
    updatedAt: Date;
}

const autoscoreJobSchema = new Schema<IAutoscoreJob>(
    {
        matchName: { type: String, default: "" },
        eventName: { type: String, default: "" },
        season: { type: String, enum: ["DECODE"], default: "DECODE", required: true },
        videoName: { type: String, required: true },
        videoPath: { type: String, default: null },
        videoUrl: { type: String, default: null },
        status: {
            type: String,
            enum: [
                "pending",
                "video_uploaded",
                "teams_needed",
                "calibration_needed",
                "calibrated",
                "detecting",
                "detection_complete",
                "scoring",
                "review_needed",
                "complete",
                "failed",
            ],
            default: "pending",
            required: true,
        },
        phase: {
            type: String,
            enum: ["artifact_detection", "decode_autoscore"],
            default: "artifact_detection",
            required: true,
        },
        redTeam1: { type: String, default: "" },
        redTeam2: { type: String, default: "" },
        blueTeam1: { type: String, default: "" },
        blueTeam2: { type: String, default: "" },
        motif: { type: String, enum: ["GPP", "PGP", "PPG", "manual", "unknown"], default: "unknown" },
        modelPath: { type: String, default: "services/video-processing/models/decode/best.pt" },
        confidenceThreshold: { type: Number, default: 0.25 },
        manualLeave: {
            type: Schema.Types.Mixed,
            default: () => ({ redTeam1: "unknown", redTeam2: "unknown", blueTeam1: "unknown", blueTeam2: "unknown" }),
        },
        manualBase: {
            type: Schema.Types.Mixed,
            default: () => ({ redTeam1: "unknown", redTeam2: "unknown", blueTeam1: "unknown", blueTeam2: "unknown" }),
        },
        errorMessage: { type: String, default: null },
        predictionJsonPath: { type: String, default: null },
        annotatedFramesPath: { type: String, default: null },
        progress: { type: Number, default: 0 },
    },
    { timestamps: true }
);

autoscoreJobSchema.index({ status: 1, updatedAt: -1 });
autoscoreJobSchema.index({ createdAt: -1 });

export const AutoscoreJob =
    mongoose.models.AutoscoreJob || mongoose.model<IAutoscoreJob>("AutoscoreJob", autoscoreJobSchema);
