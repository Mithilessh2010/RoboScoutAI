import mongoose, { Schema, Document } from "mongoose";
import { Season } from "@ftc-scout/common";

export interface IDataHasBeenLoaded extends Document {
    season: Season;
    teams?: boolean;
    events?: boolean;
    matches?: boolean;
    awards?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const dataHasBeenLoadedSchema = new Schema<IDataHasBeenLoaded>(
    {
        season: { type: Number, required: true, unique: true },
        teams: { type: Boolean, default: false },
        events: { type: Boolean, default: false },
        matches: { type: Boolean, default: false },
        awards: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const DataHasBeenLoaded = mongoose.model<IDataHasBeenLoaded>(
    "DataHasBeenLoaded",
    dataHasBeenLoadedSchema
);

export async function checkDataLoaded(season: Season) {
    const record = await DataHasBeenLoaded.findOne({ season });
    return {
        teams: record?.teams ?? false,
        events: record?.events ?? false,
        matches: record?.matches ?? false,
        awards: record?.awards ?? false,
    };
}

export async function markDataLoaded(season: Season, type: "teams" | "events" | "matches" | "awards") {
    return DataHasBeenLoaded.findOneAndUpdate(
        { season },
        { [type]: true },
        { upsert: true, new: true }
    );
}
