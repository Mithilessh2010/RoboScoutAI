import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscoreTrackedArtifact extends Document {
    jobId: mongoose.Types.ObjectId;
    trackId: string;
    artifactColor: "green" | "purple";
    firstSeenTimestamp: number;
    lastSeenTimestamp: number;
    path: Array<{ timestamp: number; x: number; y: number; zoneTypes: string[] }>;
    likelyScored: boolean;
    associatedAlliance?: "red" | "blue" | null;
    confidence: number;
}

const autoscoreTrackedArtifactSchema = new Schema<IAutoscoreTrackedArtifact>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        trackId: { type: String, required: true },
        artifactColor: { type: String, enum: ["green", "purple"], required: true },
        firstSeenTimestamp: { type: Number, required: true },
        lastSeenTimestamp: { type: Number, required: true },
        path: {
            type: [
                {
                    timestamp: Number,
                    x: Number,
                    y: Number,
                    zoneTypes: [String],
                },
            ],
            default: [],
        },
        likelyScored: { type: Boolean, default: false },
        associatedAlliance: { type: String, enum: ["red", "blue"], default: null },
        confidence: { type: Number, default: 0 },
    },
    { timestamps: true }
);

autoscoreTrackedArtifactSchema.index({ jobId: 1, trackId: 1 }, { unique: true });

export const AutoscoreTrackedArtifact =
    mongoose.models.AutoscoreTrackedArtifact ||
    mongoose.model<IAutoscoreTrackedArtifact>("AutoscoreTrackedArtifact", autoscoreTrackedArtifactSchema);
