import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscoreSummary extends Document {
  jobId: mongoose.Types.ObjectId;
  redAutoScore: number;
  blueAutoScore: number;
  redTeleopScore: number;
  blueTeleopScore: number;
  redArtifactScore: number;
  blueArtifactScore: number;
  redClassifiedCount: number;
  blueClassifiedCount: number;
  redOverflowCount: number;
  blueOverflowCount: number;
  redPatternScore: number;
  bluePatternScore: number;
  redDepotScore: number;
  blueDepotScore: number;
  redBaseScore: number;
  blueBaseScore: number;
  redPenaltyCredits: number;
  bluePenaltyCredits: number;
  estimatedRedScore: number;
  estimatedBlueScore: number;
  redRP: number;
  blueRP: number;
  winner: "red" | "blue" | "tie";
  totalDetections: number;
  artifactGreenCount: number;
  artifactPurpleCount: number;
  robotDetectionCount?: number;
  averageConfidence: number;
  maxConfidence: number;
  warnings: string[];
  reviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const autoscoreSummarySchema = new Schema<IAutoscoreSummary>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "AutoscoreJob",
      required: true,
      unique: true,
      index: true,
    },
    redAutoScore: { type: Number, default: 0 },
    blueAutoScore: { type: Number, default: 0 },
    redTeleopScore: { type: Number, default: 0 },
    blueTeleopScore: { type: Number, default: 0 },
    redArtifactScore: { type: Number, default: 0 },
    blueArtifactScore: { type: Number, default: 0 },
    redClassifiedCount: { type: Number, default: 0 },
    blueClassifiedCount: { type: Number, default: 0 },
    redOverflowCount: { type: Number, default: 0 },
    blueOverflowCount: { type: Number, default: 0 },
    redPatternScore: { type: Number, default: 0 },
    bluePatternScore: { type: Number, default: 0 },
    redDepotScore: { type: Number, default: 0 },
    blueDepotScore: { type: Number, default: 0 },
    redBaseScore: { type: Number, default: 0 },
    blueBaseScore: { type: Number, default: 0 },
    redPenaltyCredits: { type: Number, default: 0 },
    bluePenaltyCredits: { type: Number, default: 0 },
    estimatedRedScore: { type: Number, default: 0 },
    estimatedBlueScore: { type: Number, default: 0 },
    redRP: { type: Number, default: 0 },
    blueRP: { type: Number, default: 0 },
    winner: { type: String, enum: ["red", "blue", "tie"], default: "tie" },
    totalDetections: { type: Number, default: 0 },
    artifactGreenCount: { type: Number, default: 0 },
    artifactPurpleCount: { type: Number, default: 0 },
    robotDetectionCount: { type: Number, default: 0 },
    averageConfidence: { type: Number, default: 0 },
    maxConfidence: { type: Number, default: 0 },
    warnings: { type: [String], default: [] },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AutoscoreSummary =
  mongoose.models.AutoscoreSummary ||
  mongoose.model<IAutoscoreSummary>("AutoscoreSummary", autoscoreSummarySchema);
