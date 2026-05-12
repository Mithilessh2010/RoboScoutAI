import mongoose, { Schema, Document } from "mongoose";

export interface IBestName extends Document {
    id: number;
    team1: number;
    team2: number;
    vote?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

const bestNameSchema = new Schema<IBestName>(
    {
        id: { type: Number, required: true, unique: true },
        team1: { type: Number, required: true },
        team2: { type: Number, required: true },
        vote: { type: Number, default: null },
    },
    { timestamps: true }
);

bestNameSchema.index({ id: 1 }, { unique: true });
bestNameSchema.index({ createdAt: 1 });
bestNameSchema.index({ vote: 1 });

export const BestName = mongoose.model<IBestName>("BestName", bestNameSchema);
