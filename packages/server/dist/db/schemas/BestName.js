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
exports.BestName = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bestNameSchema = new mongoose_1.Schema({
    id: { type: Number, required: true, unique: true },
    team1: { type: Number, required: true },
    team2: { type: Number, required: true },
    vote: { type: Number, default: null },
}, { timestamps: true });
bestNameSchema.index({ id: 1 }, { unique: true });
bestNameSchema.index({ createdAt: 1 });
bestNameSchema.index({ vote: 1 });
exports.BestName = mongoose_1.default.model("BestName", bestNameSchema);
//# sourceMappingURL=BestName.js.map