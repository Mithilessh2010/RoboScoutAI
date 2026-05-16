import mongoose, { Schema, Document } from "mongoose";

export const autoscoreZoneTypes = [
    "basket_red",
    "basket_blue",
    "tunnel_red",
    "tunnel_blue",
    "goal_red",
    "goal_blue",
    "classifier_red",
    "classifier_blue",
    "square_red",
    "square_blue",
    "ramp_red",
    "ramp_blue",
    "depot_red",
    "depot_blue",
    "base_red",
    "base_blue",
    "launch_line_red",
    "launch_line_blue",
    "obelisk_zone",
    "field_boundary",
    "loading_zone_red",
    "loading_zone_blue",
    "ramp_index_red",
    "ramp_index_blue",
] as const;

export type AutoscoreZoneType = (typeof autoscoreZoneTypes)[number];

export interface IAutoscoreCalibrationZone extends Document {
    jobId: mongoose.Types.ObjectId;
    zoneType: AutoscoreZoneType;
    alliance?: "red" | "blue" | null;
    shapeType: "rectangle" | "polygon";
    coordinates: Array<{ x: number; y: number }>;
    frameTimestamp: number;
    color?: string | null;
    index?: number | null;
    rampDirection?: "left_to_right" | "right_to_left" | "gate_to_square" | "square_to_gate" | null;
    createdAt: Date;
    updatedAt: Date;
}

const pointSchema = new Schema(
    {
        x: { type: Number, required: true, min: 0, max: 1 },
        y: { type: Number, required: true, min: 0, max: 1 },
    },
    { _id: false }
);

const autoscoreCalibrationZoneSchema = new Schema<IAutoscoreCalibrationZone>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: "AutoscoreJob", required: true, index: true },
        zoneType: { type: String, enum: autoscoreZoneTypes, required: true },
        alliance: { type: String, enum: ["red", "blue"], default: null },
        shapeType: { type: String, enum: ["rectangle", "polygon"], default: "rectangle", required: true },
        coordinates: { type: [pointSchema], default: [] },
        frameTimestamp: { type: Number, default: 0 },
        color: { type: String, default: null },
        index: { type: Number, default: null },
        rampDirection: {
            type: String,
            enum: ["left_to_right", "right_to_left", "gate_to_square", "square_to_gate"],
            default: null,
        },
    },
    { timestamps: true }
);

autoscoreCalibrationZoneSchema.index({ jobId: 1, zoneType: 1, index: 1 }, { unique: true });

export const AutoscoreCalibrationZone =
    mongoose.models.AutoscoreCalibrationZone ||
    mongoose.model<IAutoscoreCalibrationZone>("AutoscoreCalibrationZone", autoscoreCalibrationZoneSchema);
