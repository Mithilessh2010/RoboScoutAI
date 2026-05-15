import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscoreDetection extends Document {
  jobId: mongoose.Types.ObjectId;
  frameNumber: number;
  timestamp: number;
  frameWidth?: number;
  frameHeight?: number;
  className: "artifact_green" | "artifact_purple" | "robot";
  detectorType?: "artifact" | "robot";
  classId: number;
  phase?: "AUTO" | "TELEOP" | "ENDGAME";
  artifactColor?: "green" | "purple";
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX?: number;
  centerY?: number;
  trackId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const autoscoreDetectionSchema = new Schema<IAutoscoreDetection>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "AutoscoreJob",
      required: true,
      index: true,
    },
    frameNumber: { type: Number, required: true },
    timestamp: { type: Number, required: true },
    frameWidth: { type: Number, default: null },
    frameHeight: { type: Number, default: null },
    className: {
      type: String,
      enum: ["artifact_green", "artifact_purple", "robot"],
      required: true,
    },
    detectorType: {
      type: String,
      enum: ["artifact", "robot"],
      default: "artifact",
    },
    classId: { type: Number, required: true },
    phase: { type: String, enum: ["AUTO", "TELEOP", "ENDGAME"], default: null },
    artifactColor: { type: String, enum: ["green", "purple"], default: null },
    confidence: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    centerX: { type: Number, default: null },
    centerY: { type: Number, default: null },
    trackId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

autoscoreDetectionSchema.index({ jobId: 1, frameNumber: 1 });
autoscoreDetectionSchema.index({ jobId: 1, className: 1 });

export const AutoscoreDetection =
  mongoose.models.AutoscoreDetection ||
  mongoose.model<IAutoscoreDetection>(
    "AutoscoreDetection",
    autoscoreDetectionSchema
  );
