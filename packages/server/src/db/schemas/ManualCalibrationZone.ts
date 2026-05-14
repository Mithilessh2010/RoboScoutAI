import mongoose, { Schema, Document } from "mongoose";

export type ManualCalibrationZoneName =
    | "goal_red"
    | "goal_blue"
    | "ramp_red"
    | "ramp_blue"
    | "base_red"
    | "base_blue";

export interface IManualCalibrationZone extends Document {
    jobId: mongoose.Types.ObjectId;
    zoneName: ManualCalibrationZoneName;
    points: Array<{ x: number; y: number }>;
    createdAt: Date;
    updatedAt: Date;
}

const pointSchema = new Schema(
    {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
    },
    { _id: false }
);

const manualCalibrationZoneSchema = new Schema<IManualCalibrationZone>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        zoneName: {
            type: String,
            enum: ["goal_red", "goal_blue", "ramp_red", "ramp_blue", "base_red", "base_blue"],
            required: true,
        },
        points: { type: [pointSchema], default: [] },
    },
    { timestamps: true }
);

manualCalibrationZoneSchema.index({ jobId: 1, zoneName: 1 }, { unique: true });

export const ManualCalibrationZone =
    mongoose.models.ManualCalibrationZone ||
    mongoose.model<IManualCalibrationZone>("ManualCalibrationZone", manualCalibrationZoneSchema);
