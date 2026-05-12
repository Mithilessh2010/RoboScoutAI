// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";
import { Season, AwardFtcApi } from "@ftc-scout/common";

export const AwardType = {
    DeansListFinalist: "DeansListFinalist",
    DeansListSemiFinalist: "DeansListSemiFinalist",
    DeansListWinner: "DeansListWinner",
    JudgesChoice: "JudgesChoice",
    DivisionFinalist: "DivisionFinalist",
    DivisionWinner: "DivisionWinner",
    ConferenceFinalist: "ConferenceFinalist",
    Compass: "Compass",
    Promote: "Promote",
    Control: "Control",
    Motivate: "Motivate",
    Reach: "Reach",
    Sustain: "Sustain",
    Design: "Design",
    Innovate: "Innovate",
    Connect: "Connect",
    Think: "Think",
    TopRanked: "TopRanked",
    Inspire: "Inspire",
    Winner: "Winner",
    Finalist: "Finalist",
} as const;

export type AwardType = (typeof AwardType)[keyof typeof AwardType];

export interface IAward extends Document {
    season: Season;
    eventCode: string;
    teamNumber: number;
    type: AwardType;
    placement: number;
    divisionName?: string | null;
    personName?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const awardSchema = new Schema<IAward>(
    {
        season: { type: Number, required: true },
        eventCode: { type: String, required: true },
        teamNumber: { type: Number, required: true },
        type: {
            type: String,
            enum: Object.values(AwardType),
            required: true,
        },
        placement: { type: Number, required: true },
        divisionName: { type: String, default: null },
        personName: { type: String, default: null },
    },
    { timestamps: true }
);

awardSchema.index(
    { season: 1, eventCode: 1, teamNumber: 1, type: 1, placement: 1 },
    { unique: true }
);

export const Award = mongoose.model<IAward>("Award", awardSchema);

export function awardCodeFromFtcApi(award: AwardFtcApi): [AwardType, number] | null {
    switch (award.awardId) {
        case 1:
            return [AwardType.JudgesChoice, awardTop(award, 7)];
        case 2:
            return [AwardType.Compass, awardTop(award, 3)];
        case 3:
            return [AwardType.Promote, awardTop(award, 3)];
        case 4:
            return [AwardType.Control, awardTop(award, 3)];
        case 5:
            return [AwardType.Motivate, awardTop(award, 3)];
        case 6:
            return [AwardType.Reach, awardTop(award, 3)];
        case 7:
            return [AwardType.Sustain, awardTop(award, 3)];
        case 8:
            return [AwardType.Design, awardTop(award, 3)];
        case 9:
            return [AwardType.Innovate, awardTop(award, 3)];
        case 10:
            return [AwardType.Connect, awardTop(award, 3)];
        case 11:
            return [AwardType.Think, awardTop(award, 3)];
        case 12:
            return [AwardType.Inspire, awardTop(award, 3)];
        case 13:
            return [AwardType.TopRanked, 1];
        case 14:
            return [AwardType.DivisionWinner, 1];
        case 15:
            return [AwardType.DivisionFinalist, 2];
        case 16:
            return [AwardType.ConferenceFinalist, awardTop(award, 10)];
        case 17:
            return [AwardType.DeansListWinner, 1];
        case 18:
            return [AwardType.DeansListFinalist, 2];
        case 19:
            return [AwardType.DeansListSemiFinalist, 3];
        case 20:
            return [AwardType.Winner, 1];
        case 21:
            return [AwardType.Finalist, 2];
        default:
            return null;
    }
}

function awardTop(award: AwardFtcApi, top: number): number {
    return Math.min(award.placement ?? 1, top);
}

export function awardFromApi(season: Season, api: AwardFtcApi): Omit<IAward, keyof Document> | null {
    if (api.eventCode == null || api.teamNumber == null) {
        return null;
    }

    let divisionName = api.name.includes("Division")
        ? api.name.split("Division")[0].trim()
        : api.name.includes("Conference")
        ? api.name.split("Conference")[0].trim()
        : null;

    let awardCode = awardCodeFromFtcApi(api);
    if (awardCode != null) {
        return {
            season,
            eventCode: api.eventCode,
            teamNumber: api.teamNumber,
            type: awardCode[0],
            placement: awardCode[1],
            divisionName,
            personName: api.person?.trim() ?? null,
        };
    }

    return null;
}
