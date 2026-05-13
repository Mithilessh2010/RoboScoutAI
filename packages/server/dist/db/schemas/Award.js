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
exports.awardFromApi = exports.awardCodeFromFtcApi = exports.Award = exports.AwardType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.AwardType = {
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
};
const awardSchema = new mongoose_1.Schema({
    season: { type: Number, required: true },
    eventCode: { type: String, required: true },
    teamNumber: { type: Number, required: true },
    type: {
        type: String,
        enum: Object.values(exports.AwardType),
        required: true,
    },
    placement: { type: Number, required: true },
    divisionName: { type: String, default: null },
    personName: { type: String, default: null },
}, { timestamps: true });
awardSchema.index({ season: 1, eventCode: 1, teamNumber: 1, type: 1, placement: 1 }, { unique: true });
exports.Award = mongoose_1.default.model("Award", awardSchema);
function awardCodeFromFtcApi(award) {
    switch (award.awardId) {
        case 1:
            return [exports.AwardType.JudgesChoice, awardTop(award, 7)];
        case 2:
            return [exports.AwardType.Compass, awardTop(award, 3)];
        case 3:
            return [exports.AwardType.Promote, awardTop(award, 3)];
        case 4:
            return [exports.AwardType.Control, awardTop(award, 3)];
        case 5:
            return [exports.AwardType.Motivate, awardTop(award, 3)];
        case 6:
            return [exports.AwardType.Reach, awardTop(award, 3)];
        case 7:
            return [exports.AwardType.Sustain, awardTop(award, 3)];
        case 8:
            return [exports.AwardType.Design, awardTop(award, 3)];
        case 9:
            return [exports.AwardType.Innovate, awardTop(award, 3)];
        case 10:
            return [exports.AwardType.Connect, awardTop(award, 3)];
        case 11:
            return [exports.AwardType.Think, awardTop(award, 3)];
        case 12:
            return [exports.AwardType.Inspire, awardTop(award, 3)];
        case 13:
            return [exports.AwardType.TopRanked, 1];
        case 14:
            return [exports.AwardType.DivisionWinner, 1];
        case 15:
            return [exports.AwardType.DivisionFinalist, 2];
        case 16:
            return [exports.AwardType.ConferenceFinalist, awardTop(award, 10)];
        case 17:
            return [exports.AwardType.DeansListWinner, 1];
        case 18:
            return [exports.AwardType.DeansListFinalist, 2];
        case 19:
            return [exports.AwardType.DeansListSemiFinalist, 3];
        case 20:
            return [exports.AwardType.Winner, 1];
        case 21:
            return [exports.AwardType.Finalist, 2];
        default:
            return null;
    }
}
exports.awardCodeFromFtcApi = awardCodeFromFtcApi;
function awardTop(award, top) {
    var _a;
    return Math.min((_a = award.placement) !== null && _a !== void 0 ? _a : 1, top);
}
function awardFromApi(season, api) {
    var _a, _b;
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
            personName: (_b = (_a = api.person) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : null,
        };
    }
    return null;
}
exports.awardFromApi = awardFromApi;
//# sourceMappingURL=Award.js.map