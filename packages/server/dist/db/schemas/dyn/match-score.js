"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchScoreSchemas = exports.MatchScore = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const matchScoreSchema = new mongoose_1.Schema({
    season: { type: Number, required: true },
    eventCode: { type: String, required: true },
    matchId: { type: Number, required: true },
    alliance: { type: String, required: true },
    scores: { type: mongoose_1.Schema.Types.Mixed, required: true },
}, { timestamps: true });
matchScoreSchema.index({ season: 1, eventCode: 1, matchId: 1, alliance: 1 });
const MatchScoreModel = mongoose_1.default.model("MatchScore", matchScoreSchema);
exports.MatchScore = new Proxy(MatchScoreModel, {
    get(target, prop, receiver) {
        if (typeof prop === "string" && /^\d+$/.test(prop)) {
            return target;
        }
        return Reflect.get(target, prop, receiver);
    },
});
exports.MatchScoreSchemas = {
    MatchScore: MatchScoreModel,
};
//# sourceMappingURL=match-score.js.map