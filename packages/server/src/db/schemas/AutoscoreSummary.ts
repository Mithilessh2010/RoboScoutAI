import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscoreSummary extends Document {
    jobId: mongoose.Types.ObjectId;
    totalDetections: number;
    artifactGreenCount: number;
    artifactPurpleCount: number;
    averageConfidence: number;
    maxConfidence: number;
    createdAt: Date;
    updatedAt: Date;
}

const autoscoreSummarySchema = new Schema<IAutoscoreSummary>(
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

export const AutoscoreSummary =
    mongoose.models.AutoscoreSummary ||
    mongoose.model<IAutoscoreSummary>("AutoscoreSummary", autoscoreSummarySchema);
