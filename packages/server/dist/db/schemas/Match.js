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
exports.Match = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const common_1 = require("@ftc-scout/common");
const matchSchema = new mongoose_1.Schema({
    eventSeason: { type: Number, required: true },
    eventCode: { type: String, required: true },
    id: { type: Number, required: true },
    hasBeenPlayed: { type: Boolean, required: true },
    scheduledStartTime: { type: Date, default: null },
    actualStartTime: { type: Date, default: null },
    postResultTime: { type: Date, default: null },
    tournamentLevel: {
        type: String,
        enum: Object.values(common_1.TournamentLevel),
        required: true,
    },
    series: { type: Number, required: true },
}, { timestamps: true });
matchSchema.index({ eventSeason: 1, eventCode: 1, id: 1 }, { unique: true });
matchSchema.index({ eventSeason: 1, eventCode: 1 });
exports.Match = mongoose_1.default.model("Match", matchSchema);
//# sourceMappingURL=Match.js.map