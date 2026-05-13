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
exports.TeamEventParticipation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const teamEventParticipationSchema = new mongoose_1.Schema({
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
    tot: { type: mongoose_1.Schema.Types.Mixed, default: null },
    avg: { type: mongoose_1.Schema.Types.Mixed, default: null },
    opr: { type: mongoose_1.Schema.Types.Mixed, default: null },
    min: { type: mongoose_1.Schema.Types.Mixed, default: null },
    max: { type: mongoose_1.Schema.Types.Mixed, default: null },
    dev: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, { timestamps: true });
teamEventParticipationSchema.index({ season: 1, eventCode: 1, teamNumber: 1 });
const TeamEventParticipationModel = mongoose_1.default.model("TeamEventParticipation", teamEventParticipationSchema);
exports.TeamEventParticipation = new Proxy(TeamEventParticipationModel, {
    get(target, prop, receiver) {
        if (typeof prop === "string" && /^\d+$/.test(prop)) {
            return target;
        }
        return Reflect.get(target, prop, receiver);
    },
});
//# sourceMappingURL=team-event-participation.js.map