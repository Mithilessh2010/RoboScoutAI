import mongoose, { Schema, Document } from "mongoose";

export type AutoscoreTimelineEventType =
    | "leave"
    | "classified"
    | "overflow"
    | "depot"
    | "pattern"
    | "base_partial"
    | "base_full"
    | "base_bonus"
    | "gate_opened"
    | "possible_gate_interaction"
    | "ramp_artifacts_released"
    | "ramp_count_drop_unexplained"
    | "penalty"
    | "manual_adjustment"
    | "note";

export interface IAutoscoreTimelineEvent extends Document {
    jobId: mongoose.Types.ObjectId;
    timestamp: number;
    frameNumber?: number | null;
    phase: "AUTO" | "TELEOP" | "ENDGAME";
    eventType: AutoscoreTimelineEventType;
    alliance: "red" | "blue";
    teamNumber?: string | null;
    artifactColor?: "green" | "purple" | null;
    zoneType?: string | null;
    points: number;
    confidence: number;
    reason: string;
    relatedDetectionIds: mongoose.Types.ObjectId[];
    relatedTrackId?: string | null;
    manualOverride: boolean;
    reviewed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const autoscoreTimelineEventSchema = new Schema<IAutoscoreTimelineEvent>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        timestamp: { type: Number, required: true },
        frameNumber: { type: Number, default: null },
        phase: { type: String, enum: ["AUTO", "TELEOP", "ENDGAME"], required: true },
        eventType: {
            type: String,
            enum: [
                "leave",
                "classified",
                "overflow",
                "depot",
                "pattern",
                "base_partial",
                "base_full",
                "base_bonus",
                "gate_opened",
                "possible_gate_interaction",
                "ramp_artifacts_released",
                "ramp_count_drop_unexplained",
                "penalty",
                "manual_adjustment",
                "note",
            ],
            required: true,
        },
        alliance: { type: String, enum: ["red", "blue"], required: true },
        teamNumber: { type: String, default: null },
        artifactColor: { type: String, enum: ["green", "purple"], default: null },
        zoneType: { type: String, default: null },
        points: { type: Number, default: 0 },
        confidence: { type: Number, default: 1 },
        reason: { type: String, default: "" },
        relatedDetectionIds: [{ type: Schema.Types.ObjectId, ref: "AutoscoreDetection" }],
        relatedTrackId: { type: String, default: null },
        manualOverride: { type: Boolean, default: false },
        reviewed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

autoscoreTimelineEventSchema.index({ jobId: 1, timestamp: 1 });

export const AutoscoreTimelineEvent =
    mongoose.models.AutoscoreTimelineEvent ||
    mongoose.model<IAutoscoreTimelineEvent>("AutoscoreTimelineEvent", autoscoreTimelineEventSchema);
