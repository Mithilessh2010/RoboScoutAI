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
exports.RecordQueries = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
const TeamEventParticipation_1 = require("../TeamEventParticipation");
const team_event_participation_1 = require("../../../db/schemas/dyn/team-event-participation");
const Event_1 = require("../../../db/schemas/Event");
const enums_1 = require("../enums");
const filter_gql_1 = require("./filter-gql");
const match_score_1 = require("../../../db/schemas/dyn/match-score");
const Match_1 = require("../Match");
function name(_ns, exp) {
    return exp;
}
function RecordGqlTy(wrapped, namePrefix) {
    let rowTy = new graphql_1.GraphQLObjectType({
        name: `${namePrefix}RecordRow`,
        fields: {
            data: { type: (0, common_1.nn)(wrapped) },
            noFilterRank: common_1.IntTy,
            filterRank: common_1.IntTy,
            noFilterSkipRank: common_1.IntTy,
            filterSkipRank: common_1.IntTy,
        },
    });
    return new graphql_1.GraphQLObjectType({
        name: `${namePrefix}Records`,
        fields: {
            data: (0, common_1.listTy)((0, common_1.wr)((0, common_1.nn)(rowTy))),
            offset: common_1.IntTy,
            count: common_1.IntTy,
        },
    });
}
const SpecificAlliance = new graphql_1.GraphQLObjectType({
    name: "SpecificAlliance",
    fields: {
        match: { type: (0, common_1.nn)(Match_1.MatchGQL) },
        alliance: { type: (0, common_1.nn)(enums_1.AllianceGQL) },
    },
});
const TepRecordsGql = (0, common_1.wr)((0, common_1.nn)(RecordGqlTy(TeamEventParticipation_1.TeamEventParticipationGQL, "Tep")));
const MatchRecordsGql = (0, common_1.wr)((0, common_1.nn)(RecordGqlTy(SpecificAlliance, "Match")));
function fieldName(exp) {
    return exp;
}
exports.RecordQueries = {
    tepRecords: Object.assign(Object.assign({}, TepRecordsGql), { args: {
            season: common_1.IntTy,
            sortBy: (0, common_1.nullTy)(common_1.StrTy),
            sortDir: { type: enums_1.SortDirGQL },
            filter: { type: filter_gql_1.FilterGQL },
            region: { type: enums_1.RegionOptionGQL },
            type: { type: enums_1.EventTypeOptionGQL },
            remote: { type: enums_1.RemoteOptionGQL },
            start: (0, common_1.nullTy)(common_1.DateTy),
            end: (0, common_1.nullTy)(common_1.DateTy),
            skip: common_1.IntTy,
            take: common_1.IntTy,
        }, resolve(_, { season, sortBy, sortDir, filter, region, type, remote, start, end, skip, take, }) {
            return __awaiter(this, void 0, void 0, function* () {
                let Tep = team_event_participation_1.TeamEventParticipation[season];
                if (!Tep)
                    return { data: [], offset: 0, count: 0 };
                take = Math.min(take, 50);
                const mongoEvents = yield Event_1.Event.find({ season });
                const eventMap = new Map(mongoEvents.map((event) => [`${event.season}:${event.code}`, event]));
                const mongoDescriptor = common_1.DESCRIPTORS[season];
                const mongoDefaultRankerSqlName = mongoDescriptor.pensSubtract
                    ? "oprTotalPoints"
                    : "oprTotalPointsNp";
                const mongoSortKey = sortBy !== null && sortBy !== void 0 ? sortBy : mongoDefaultRankerSqlName;
                let rows = yield Tep.find({ season, hasStats: true });
                rows = rows.filter((row) => {
                    const event = eventMap.get(`${row.season}:${row.eventCode}`);
                    if (!event)
                        return false;
                    if (event.modifiedRules)
                        return false;
                    if (region && region != common_1.RegionOption.All) {
                        const regions = new Set((0, common_1.getRegionCodes)(region));
                        if (!event.regionCode || !regions.has(event.regionCode))
                            return false;
                    }
                    if (type && type != common_1.EventTypeOption.All && type != common_1.EventTypeOption.Competition) {
                        const types = new Set((0, common_1.getEventTypes)(type));
                        if (!types.has(event.type))
                            return false;
                    }
                    if (remote == common_1.RemoteOption.Trad && row.isRemote)
                        return false;
                    if (remote == common_1.RemoteOption.Remote && !row.isRemote)
                        return false;
                    if (start && new Date(event.start).toISOString().split("T")[0] < start.toISOString().split("T")[0]) {
                        return false;
                    }
                    if (end && new Date(event.end).toISOString().split("T")[0] > end.toISOString().split("T")[0]) {
                        return false;
                    }
                    return true;
                });
                rows.sort((a, b) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    const av = Number((_e = (_c = (_a = a[mongoSortKey]) !== null && _a !== void 0 ? _a : (_b = a.opr) === null || _b === void 0 ? void 0 : _b.totalPoints) !== null && _c !== void 0 ? _c : (_d = a.opr) === null || _d === void 0 ? void 0 : _d.totalPointsNp) !== null && _e !== void 0 ? _e : -Infinity);
                    const bv = Number((_k = (_h = (_f = b[mongoSortKey]) !== null && _f !== void 0 ? _f : (_g = b.opr) === null || _g === void 0 ? void 0 : _g.totalPoints) !== null && _h !== void 0 ? _h : (_j = b.opr) === null || _j === void 0 ? void 0 : _j.totalPointsNp) !== null && _k !== void 0 ? _k : -Infinity);
                    return sortDir == common_1.SortDir.Asc ? av - bv : bv - av;
                });
                const sliced = rows.slice(skip, skip + take);
                return {
                    data: sliced.map((row, index) => ({
                        data: row,
                        noFilterRank: skip + index + 1,
                        filterRank: skip + index + 1,
                        noFilterSkipRank: skip + index + 1,
                        filterSkipRank: skip + index + 1,
                    })),
                    offset: skip,
                    count: rows.length,
                };
            });
        } }),
    matchRecords: Object.assign(Object.assign({}, MatchRecordsGql), { args: {
            season: common_1.IntTy,
            sortBy: (0, common_1.nullTy)(common_1.StrTy),
            sortDir: { type: enums_1.SortDirGQL },
            filter: { type: filter_gql_1.FilterGQL },
            region: { type: enums_1.RegionOptionGQL },
            type: { type: enums_1.EventTypeOptionGQL },
            remote: { type: enums_1.RemoteOptionGQL },
            start: (0, common_1.nullTy)(common_1.DateTy),
            end: (0, common_1.nullTy)(common_1.DateTy),
            skip: common_1.IntTy,
            take: common_1.IntTy,
        }, resolve(_source, { season, sortBy, sortDir, filter, region, type, remote, start, end, skip, take, }, _context, info) {
            var _a, _b, _c;
            return __awaiter(this, void 0, void 0, function* () {
                let Ms = match_score_1.MatchScore[season];
                if (!Ms)
                    return { data: [], offset: 0, count: 0 };
                take = Math.min(take, 50);
                const mongoEvents = yield Event_1.Event.find({ season });
                const eventMap = new Map(mongoEvents.map((event) => [`${event.season}:${event.code}`, event]));
                const mongoDescriptor = common_1.DESCRIPTORS[season];
                const mongoDefaultRankerSqlName = mongoDescriptor.pensSubtract ? "totalPoints" : "totalPointsNp";
                const mongoSortKey = sortBy !== null && sortBy !== void 0 ? sortBy : mongoDefaultRankerSqlName;
                const matchDocs = yield Match.find({ eventSeason: season });
                const rows = [];
                for (const match of matchDocs) {
                    const event = eventMap.get(`${match.eventSeason}:${match.eventCode}`);
                    if (!event || event.modifiedRules)
                        continue;
                    if (region && region != common_1.RegionOption.All) {
                        const regions = new Set((0, common_1.getRegionCodes)(region));
                        if (!event.regionCode || !regions.has(event.regionCode))
                            continue;
                    }
                    if (type && type != common_1.EventTypeOption.All && type != common_1.EventTypeOption.Competition) {
                        const types = new Set((0, common_1.getEventTypes)(type));
                        if (!types.has(event.type))
                            continue;
                    }
                    if (remote == common_1.RemoteOption.Trad && event.remote)
                        continue;
                    if (remote == common_1.RemoteOption.Remote && !event.remote)
                        continue;
                    if (start && new Date(event.start).toISOString().split("T")[0] < start.toISOString().split("T")[0])
                        continue;
                    if (end && new Date(event.end).toISOString().split("T")[0] > end.toISOString().split("T")[0])
                        continue;
                    const scores = yield match_score_1.MatchScore[season].find({
                        season,
                        eventCode: match.eventCode,
                        matchId: match.id,
                    });
                    const matchScore = frontendMSFromDB(scores);
                    if (!matchScore)
                        continue;
                    const scoreValue = Number((_c = (_b = (_a = matchScore[mongoSortKey]) !== null && _a !== void 0 ? _a : matchScore.totalPoints) !== null && _b !== void 0 ? _b : matchScore.totalPointsNp) !== null && _c !== void 0 ? _c : -Infinity);
                    if (matchScore.red) {
                        rows.push({ match, alliance: matchScore.red.alliance, score: scoreValue });
                        rows.push({ match, alliance: matchScore.blue.alliance, score: scoreValue });
                    }
                    else {
                        rows.push({ match, alliance: matchScore.alliance, score: scoreValue });
                    }
                }
                rows.sort((a, b) => (sortDir == common_1.SortDir.Asc ? a.score - b.score : b.score - a.score));
                const sliced = rows.slice(skip, skip + take);
                return {
                    data: sliced.map((row, index) => ({
                        data: { match: row.match, alliance: row.alliance },
                        noFilterRank: skip + index + 1,
                        filterRank: skip + index + 1,
                        noFilterSkipRank: skip + index + 1,
                        filterSkipRank: skip + index + 1,
                    })),
                    offset: skip,
                    count: rows.length,
                };
            });
        } }),
};
//# sourceMappingURL=Records.js.map