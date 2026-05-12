import mongoose, { Schema } from "mongoose";

const teamEventParticipationSchema = new Schema(
    {
        season: { type: Number, required: true },
        eventCode: { type: String, required: true },
        teamNumber: { type: Number, required: true },
        oprTotalPoints: { type: Number, default: null },
        totalPointsNp: { type: Number, default: null },
        autoPoints: { type: Number, default: null },
        dcPoints: { type: Number, default: null },
        egPoints: { type: Number, default: null },
        dcParkPoints: { type: Number, default: null },
        dcBasePoints: { type: Number, default: null },
        hasStats: { type: Boolean, default: false },
        isRemote: { type: Boolean, default: false },
        regionCode: { type: String, default: null },
        rank: { type: Number, default: null },
        rp: { type: Number, default: null },
        tb1: { type: Number, default: null },
        tb2: { type: Number, default: null },
        wins: { type: Number, default: null },
        losses: { type: Number, default: null },
        ties: { type: Number, default: null },
        dqs: { type: Number, default: null },
        qualMatchesPlayed: { type: Number, default: null },
        tot: { type: Schema.Types.Mixed, default: null },
        avg: { type: Schema.Types.Mixed, default: null },
        opr: { type: Schema.Types.Mixed, default: null },
        min: { type: Schema.Types.Mixed, default: null },
        max: { type: Schema.Types.Mixed, default: null },
        dev: { type: Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
);

teamEventParticipationSchema.index({ season: 1, eventCode: 1, teamNumber: 1 });

const TeamEventParticipationModel = mongoose.model(
    "TeamEventParticipation",
    teamEventParticipationSchema
);

export const TeamEventParticipation: any = new Proxy(TeamEventParticipationModel, {
    get(target, prop, receiver) {
        if (typeof prop === "string" && /^\d+$/.test(prop)) {
            return target;
        }
        return Reflect.get(target, prop, receiver);
    },
});
