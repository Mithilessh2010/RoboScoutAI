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
exports.eventFromApi = exports.Event = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const common_1 = require("@ftc-scout/common");
const eventSchema = new mongoose_1.Schema({
    season: { type: Number, required: true },
    code: { type: String, required: true },
    divisionCode: { type: String, default: null },
    name: { type: String, required: true },
    remote: { type: Boolean, required: true },
    hybrid: { type: Boolean, required: true },
    fieldCount: { type: Number, required: true },
    published: { type: Boolean, required: true },
    type: { type: String, enum: Object.values(common_1.EventType), required: true },
    regionCode: { type: String, default: null },
    leagueCode: { type: String, default: null },
    districtCode: { type: String, default: null },
    venue: { type: String, default: null },
    address: { type: String, default: null },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    website: { type: String, default: null },
    liveStreamURL: { type: String, default: null },
    livestreamsByDay: [
        {
            day: Date,
            liveStreamURL: String,
            webcasts: [String],
        },
    ],
    webcasts: [String],
    timezone: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    modifiedRules: { type: Boolean, required: true },
}, { timestamps: true });
eventSchema.index({ season: 1, code: 1 }, { unique: true });
exports.Event = mongoose_1.default.model("Event", eventSchema);
function eventFromApi(api) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const typeSource = (_a = api.typeName) !== null && _a !== void 0 ? _a : api.type;
    if (!typeSource) {
        return null;
    }
    const type = (0, common_1.eventTypeFromFtcApi)(typeSource);
    if (!type) {
        return null;
    }
    return {
        season: api.season,
        code: api.code,
        divisionCode: (_b = api.divisionCode) !== null && _b !== void 0 ? _b : null,
        name: api.name,
        remote: api.remote,
        hybrid: api.hybrid,
        fieldCount: api.fieldCount,
        published: api.published,
        type,
        regionCode: (_c = api.regionCode) !== null && _c !== void 0 ? _c : null,
        leagueCode: (_d = api.leagueCode) !== null && _d !== void 0 ? _d : null,
        districtCode: (_e = api.districtCode) !== null && _e !== void 0 ? _e : null,
        venue: (_f = api.venue) !== null && _f !== void 0 ? _f : null,
        address: (_g = api.address) !== null && _g !== void 0 ? _g : null,
        country: api.country,
        state: api.state,
        city: api.city,
        website: (_h = api.website) !== null && _h !== void 0 ? _h : null,
        liveStreamURL: (_j = api.liveStreamUrl) !== null && _j !== void 0 ? _j : null,
        webcasts: (_k = api.webcasts) !== null && _k !== void 0 ? _k : [],
        timezone: api.timezone,
        start: new Date(api.dateStart),
        end: new Date(api.dateEnd),
        modifiedRules: false,
    };
}
exports.eventFromApi = eventFromApi;
//# sourceMappingURL=Event.js.map