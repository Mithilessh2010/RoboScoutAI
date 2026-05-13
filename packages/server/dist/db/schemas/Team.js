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
exports.teamFromApi = exports.Team = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const teamSchema = new mongoose_1.Schema({
    number: { type: Number, primaryKey: true, required: true },
    name: { type: String, required: true },
    schoolName: { type: String, required: true },
    sponsors: [String],
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    rookieYear: { type: Number, required: true },
    website: { type: String, default: null },
}, { timestamps: true });
teamSchema.index({ number: 1 }, { unique: true });
exports.Team = mongoose_1.default.model("Team", teamSchema);
function teamFromApi(api) {
    var _a, _b, _c, _d, _e, _f;
    if (api.nameShort == null || api.rookieYear == null) {
        console.warn(`Rejecting api team ${api.teamNumber}.`);
        return null;
    }
    function fixLocations(event_name) {
        const replacements = [["Chinese Taipei", "Taiwan"]];
        for (const [old_str, new_str] of replacements) {
            if (event_name.includes(old_str)) {
                return event_name.replace(old_str, new_str);
            }
        }
        return event_name;
    }
    let name = api.nameShort.trim();
    let schoolName;
    let sponsors;
    if (api.nameFull == null) {
        schoolName = "Unknown";
        sponsors = [];
    }
    else if (api.nameFull.includes("&")) {
        let index = api.nameFull.lastIndexOf("&");
        let teamNamePart = api.nameFull.slice(index + 1);
        let sponsorsPart = api.nameFull.slice(0, index);
        schoolName = teamNamePart.trim();
        sponsors = sponsorsPart
            .split("/")
            .map((s) => s.trim())
            .filter((s) => !!s);
    }
    else {
        schoolName = (_b = (_a = api.nameFull) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : null;
        sponsors = [];
    }
    return {
        number: api.teamNumber,
        name,
        schoolName,
        sponsors,
        country: fixLocations((_c = api.country) !== null && _c !== void 0 ? _c : ""),
        state: fixLocations((_d = api.stateProv) !== null && _d !== void 0 ? _d : ""),
        city: fixLocations((_e = api.city) !== null && _e !== void 0 ? _e : ""),
        rookieYear: api.rookieYear,
        website: (_f = api.website) !== null && _f !== void 0 ? _f : null,
    };
}
exports.teamFromApi = teamFromApi;
//# sourceMappingURL=Team.js.map