import mongoose, { Schema, Document } from "mongoose";

export type AutoscoreJobStatus = "pending" | "running" | "complete" | "failed";

export interface IAutoscoreJob extends Document {
    videoName: string;
    videoPath?: string;
    videoUrl?: string;
    status: AutoscoreJobStatus;
    phase: "artifact_detection";
    errorMessage?: string;
    predictionJsonPath?: string;
    annotatedFramesPath?: string;
    createdAt: Date;
    updatedAt: Date;
}

const autoscoreJobSchema = new Schema<IAutoscoreJob>(
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

autoscoreJobSchema.index({ status: 1, updatedAt: -1 });
autoscoreJobSchema.index({ createdAt: -1 });

export const AutoscoreJob =
    mongoose.models.AutoscoreJob || mongoose.model<IAutoscoreJob>("AutoscoreJob", autoscoreJobSchema);
