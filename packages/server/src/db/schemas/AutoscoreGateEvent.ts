import mongoose, { Schema, Document } from "mongoose";

export interface IAutoscoreGateEvent extends Document {
  jobId: mongoose.Types.ObjectId;
  alliance: "red" | "blue";
  timestamp: number;
  eventType:
    | "manual_gate_opened"
    | "robot_inferred_gate_opened"
    | "possible_gate_opened_future";
  releasedCount?: number | null;
  note?: string | null;
}

const autoscoreGateEventSchema = new Schema<IAutoscoreGateEvent>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "AutoscoreJob",
      required: true,
      index: true,
    },
    alliance: { type: String, enum: ["red", "blue"], required: true },
    timestamp: { type: Number, required: true },
    eventType: {
      type: String,
      enum: [
        "manual_gate_opened",
        "robot_inferred_gate_opened",
        "possible_gate_opened_future",
      ],
      default: "manual_gate_opened",
    },
    releasedCount: { type: Number, default: null },
    note: { type: String, default: null },
  },
  { timestamps: true }
);

autoscoreGateEventSchema.index({ jobId: 1, alliance: 1, timestamp: 1 });

export const AutoscoreGateEvent =
  mongoose.models.AutoscoreGateEvent ||
  mongoose.model<IAutoscoreGateEvent>(
    "AutoscoreGateEvent",
    autoscoreGateEventSchema
  );
