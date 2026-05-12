// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";
import { Season, TournamentLevel } from "@ftc-scout/common";

export interface IMatch extends Document {
    eventSeason: Season;
    eventCode: string;
    id: number;
    hasBeenPlayed: boolean;
    scheduledStartTime?: Date | null;
    actualStartTime?: Date | null;
    postResultTime?: Date | null;
    tournamentLevel: TournamentLevel;
    series: number;
    createdAt: Date;
    updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
    {
        eventSeason: { type: Number, required: true },
        eventCode: { type: String, required: true },
        id: { type: Number, required: true },
        hasBeenPlayed: { type: Boolean, required: true },
        scheduledStartTime: { type: Date, default: null },
        actualStartTime: { type: Date, default: null },
        postResultTime: { type: Date, default: null },
        tournamentLevel: {
            type: String,
            enum: Object.values(TournamentLevel),
            required: true,
        },
        series: { type: Number, required: true },
    },
    { timestamps: true }
);

matchSchema.index({ eventSeason: 1, eventCode: 1, id: 1 }, { unique: true });
matchSchema.index({ eventSeason: 1, eventCode: 1 });

export const Match = mongoose.model<IMatch>("Match", matchSchema);
