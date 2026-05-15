import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscorePenalty extends Document {
    jobId: mongoose.Types.ObjectId;
    timestamp?: number | null;
    committingAlliance: "red" | "blue";
    creditedAlliance: "red" | "blue";
    foulType: "minor" | "major";
    count: number;
    points: number;
    note?: string | null;
}

const autoscorePenaltySchema = new Schema<IAutoscorePenalty>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        timestamp: { type: Number, default: null },
        committingAlliance: { type: String, enum: ["red", "blue"], required: true },
        creditedAlliance: { type: String, enum: ["red", "blue"], required: true },
        foulType: { type: String, enum: ["minor", "major"], required: true },
        count: { type: Number, default: 1 },
        points: { type: Number, required: true },
        note: { type: String, default: null },
    },
    { timestamps: true }
);

export const AutoscorePenalty =
    mongoose.models.AutoscorePenalty ||
    mongoose.model<IAutoscorePenalty>("AutoscorePenalty", autoscorePenaltySchema);
