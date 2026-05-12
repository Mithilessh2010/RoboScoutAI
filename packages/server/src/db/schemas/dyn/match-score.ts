import mongoose, { Schema } from "mongoose";

const matchScoreSchema = new Schema(
    {
        season: { type: Number, required: true },
        eventCode: { type: String, required: true },
        matchId: { type: Number, required: true },
        alliance: { type: String, required: true },
        scores: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

matchScoreSchema.index({ season: 1, eventCode: 1, matchId: 1, alliance: 1 });

const MatchScoreModel = mongoose.model("MatchScore", matchScoreSchema);

export const MatchScore: any = new Proxy(MatchScoreModel, {
    get(target, prop, receiver) {
        if (typeof prop === "string" && /^\d+$/.test(prop)) {
            return target;
        }
        return Reflect.get(target, prop, receiver);
    },
});

export const MatchScoreSchemas = {
    MatchScore: MatchScoreModel,
};
