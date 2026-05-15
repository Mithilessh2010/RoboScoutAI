import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscoreRampCountState extends Document {
    jobId: mongoose.Types.ObjectId;
    alliance: "red" | "blue";
    timestamp: number;
    frameNumber: number;
    rawCount: number;
    stableCount: number;
    previousStableCount: number;
    countDelta: number;
    confidence: number;
    relatedDetectionIds: mongoose.Types.ObjectId[];
    manualOverride: boolean;
    warning?: string | null;
}

const autoscoreRampCountStateSchema = new Schema<IAutoscoreRampCountState>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        alliance: { type: String, enum: ["red", "blue"], required: true },
        timestamp: { type: Number, required: true },
        frameNumber: { type: Number, required: true },
        rawCount: { type: Number, required: true },
        stableCount: { type: Number, required: true },
        previousStableCount: { type: Number, required: true },
        countDelta: { type: Number, required: true },
        confidence: { type: Number, default: 0 },
        relatedDetectionIds: [{ type: Schema.Types.ObjectId, ref: "AutoscoreDetection" }],
        manualOverride: { type: Boolean, default: false },
        warning: { type: String, default: null },
    },
    { timestamps: true }
);

autoscoreRampCountStateSchema.index({ jobId: 1, alliance: 1, timestamp: 1 });

export const AutoscoreRampCountState =
    mongoose.models.AutoscoreRampCountState ||
    mongoose.model<IAutoscoreRampCountState>("AutoscoreRampCountState", autoscoreRampCountStateSchema);
