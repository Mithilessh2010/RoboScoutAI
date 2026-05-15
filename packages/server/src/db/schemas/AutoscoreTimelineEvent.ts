import mongoose, { Schema, Document } from "mongoose";

export type AutoscoreTimelineEventType =
    | "artifact_detected"
    | "enter_zone"
    | "exit_zone"
    | "score"
    | "note";

export interface IAutoscoreTimelineEvent extends Document {
    jobId: mongoose.Types.ObjectId;
    timestamp: number; // seconds into the video
    eventType: AutoscoreTimelineEventType;
    details?: any;
    confidence?: number;
    detectionId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const autoscoreTimelineEventSchema = new Schema<IAutoscoreTimelineEvent>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        timestamp: { type: Number, required: true },
        eventType: {
            type: String,
            enum: ["artifact_detected", "enter_zone", "exit_zone", "score", "note"],
            required: true,
        },
        details: { type: Schema.Types.Mixed, default: null },
        confidence: { type: Number, default: null },
        detectionId: { type: Schema.Types.ObjectId, ref: "AutoscoreDetection", default: null, index: true },
    },
    { timestamps: true }
);

autoscoreTimelineEventSchema.index({ jobId: 1, timestamp: 1 });

export const AutoscoreTimelineEvent =
    mongoose.models.AutoscoreTimelineEvent || mongoose.model<IAutoscoreTimelineEvent>(
        "AutoscoreTimelineEvent",
        autoscoreTimelineEventSchema
    );
