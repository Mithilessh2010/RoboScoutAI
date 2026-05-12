import mongoose, { Schema } from "mongoose";

const matchScoreSchema = new Schema({
    season: Number,
    eventCode: String,
    matchId: Number,
    alliance: String,
    scores: mongoose.Schema.Types.Mixed,
});

export const MatchScore = mongoose.model("MatchScore", matchScoreSchema);

export const MatchScoreSchemas = {
    MatchScore,
};
