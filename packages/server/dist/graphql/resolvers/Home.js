"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeQueries = void 0;
const common_1 = require("@ftc-scout/common");
const team_event_participation_1 = require("../../db/schemas/dyn/team-event-participation");
const Match_1 = require("../../db/schemas/Match");
const Event_1 = require("./Event");
const Event_2 = require("../../db/schemas/Event");
const Match_2 = require("./Match");
const match_score_1 = require("../../db/schemas/dyn/match-score");
const enums_1 = require("./enums");
exports.HomeQueries = {
    activeTeamsCount: Object.assign(Object.assign({}, common_1.IntTy), { args: { season: common_1.IntTy }, resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () {
            let tep = team_event_participation_1.TeamEventParticipation[season];
            if (!tep)
                return 0;
            let teams = yield tep.distinct("teamNumber", {});
            return teams.length;
        }) }),
    matchesPlayedCount: Object.assign(Object.assign({}, common_1.IntTy), { args: { season: common_1.IntTy }, resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield Match_1.Match.countDocuments({
                eventSeason: season,
                hasBeenPlayed: true,
            });
        }) }),
    eventsOnDate: {
        type: (0, common_1.list)((0, common_1.nn)(Event_1.EventGQL)),
        args: { date: (0, common_1.nullTy)(common_1.DateTimeTy), type: { type: enums_1.EventTypeOptionGQL } },
        resolve: (_, { date, type }) => __awaiter(void 0, void 0, void 0, function* () {
            let query = {};
            const queryDate = date ? new Date(date.toISOString().split("T")[0]) : new Date();
            query.$and = [
                { start: { $lte: queryDate } },
                { end: { $gte: queryDate } },
            ];
            if (type && type != common_1.EventTypeOption.All) {
                query.type = { $in: (0, common_1.getEventTypes)(type) };
            }
            return Event_2.Event.find(query).sort({ start: 1, name: -1 });
        }),
    },
    tradWorldRecord: {
        type: (0, common_1.nn)(Match_2.MatchGQL),
        args: { season: common_1.IntTy },
        resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () { return getWorldRecordMatch(season, false); }),
    },
    tradWorldRecordWithPenalties: {
        type: (0, common_1.nn)(Match_2.MatchGQL),
        args: { season: common_1.IntTy },
        resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () { return getWorldRecordMatch(season, true); }),
    },
};
function getWorldRecordMatch(season, includePenalties) {
    return __awaiter(this, void 0, void 0, function* () {
        let ms = match_score_1.MatchScore[season];
        if (!ms)
            throw "Use a valid season";
        const sortField = includePenalties ? "totalPoints" : "totalPointsNp";
        let match = yield Match_1.Match.findOne({
            eventSeason: season,
            hasBeenPlayed: true,
        })
            .sort({ [sortField]: -1 })
            .lean();
        if (!match)
            throw "No match found for world record";
        let fullMatch = yield Match_1.Match.findOne({
            eventSeason: match.eventSeason,
            eventCode: match.eventCode,
            id: match.id,
        });
        return fullMatch;
    });
}
//# sourceMappingURL=Home.js.map