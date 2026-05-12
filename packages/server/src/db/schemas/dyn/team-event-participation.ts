import mongoose, { Schema } from "mongoose";

const teamEventParticipationSchema = new Schema({
    season: Number,
    eventCode: String,
    teamNumber: Number,
    oprTotalPoints: Number,
    totalPointsNp: Number,
    totalPointsNp: Number,
    autoPoints: Number,
    dcPoints: Number,
    egPoints: Number,
    dcParkPoints: Number,
    dcBasePoints: Number,
    hasStats: Boolean,
    isRemote: Boolean,
    regionCode: String,
});

export const TeamEventParticipation = mongoose.model(
    "TeamEventParticipation",
    teamEventParticipationSchema
);
