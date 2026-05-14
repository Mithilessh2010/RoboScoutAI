import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscoreDetection extends Document {
    jobId: mongoose.Types.ObjectId;
    frameNumber: number;
    timestamp: number;
    className: "artifact_green" | "artifact_purple";
    classId: number;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
    createdAt: Date;
    updatedAt: Date;
}

const autoscoreDetectionSchema = new Schema<IAutoscoreDetection>(
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

autoscoreDetectionSchema.index({ jobId: 1, frameNumber: 1 });
autoscoreDetectionSchema.index({ jobId: 1, className: 1 });

export const AutoscoreDetection =
    mongoose.models.AutoscoreDetection ||
    mongoose.model<IAutoscoreDetection>("AutoscoreDetection", autoscoreDetectionSchema);
