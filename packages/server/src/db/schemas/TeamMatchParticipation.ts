import mongoose, { Schema, Document } from "mongoose";
import { Alliance, Station, AllianceRole, Season } from "@ftc-scout/common";

export interface ITeamMatchParticipation extends Document {
    season: Season;
    eventCode: string;
    matchId: number;
    alliance: Alliance;
    station: Station;
    teamNumber: number;
    allianceRole: AllianceRole;
    createdAt: Date;
    updatedAt: Date;
}

const teamMatchParticipationSchema = new Schema<ITeamMatchParticipation>(
    {
        season: { type: Number, required: true },
        eventCode: { type: String, required: true },
        matchId: { type: Number, required: true },
        alliance: {
            type: String,
            enum: Object.values(Alliance),
            required: true,
        },
        station: {
            type: String,
            enum: Object.values(Station),
            required: true,
        },
        teamNumber: { type: Number, required: true },
        allianceRole: {
            type: String,
            enum: Object.values(AllianceRole),
            required: true,
        },
    },
    { timestamps: true }
);

teamMatchParticipationSchema.index(
    { season: 1, eventCode: 1, matchId: 1, alliance: 1, station: 1 },
    { unique: true }
);

export const TeamMatchParticipation = mongoose.model<ITeamMatchParticipation>(
    "TeamMatchParticipation",
    teamMatchParticipationSchema
);
