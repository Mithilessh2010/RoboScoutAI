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
exports.TeamQueries = exports.TeamGQL = exports.getQuickStats = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../utils");
const common_1 = require("@ftc-scout/common");
const Team_1 = require("../../db/schemas/Team");
const Award_1 = require("./Award");
const TeamMatchParticipation_1 = require("./TeamMatchParticipation");
const TeamMatchParticipation_2 = require("../../db/schemas/TeamMatchParticipation");
const Location_1 = require("../objs/Location");
const TeamEventParticipation_1 = require("./TeamEventParticipation");
const enums_1 = require("./enums");
const Event_1 = require("../../db/schemas/Event");
const QuickStatGQL = new graphql_1.GraphQLObjectType({
    name: "QuickStat",
    fields: {
        value: common_1.FloatTy,
        rank: common_1.IntTy,
    },
});
const QuickStatsGQL = new graphql_1.GraphQLObjectType({
    name: "QuickStats",
    fields: {
        season: common_1.IntTy,
        number: common_1.IntTy,
        tot: { type: (0, common_1.nn)(QuickStatGQL) },
        auto: { type: (0, common_1.nn)(QuickStatGQL) },
        dc: { type: (0, common_1.nn)(QuickStatGQL) },
        eg: { type: (0, common_1.nn)(QuickStatGQL) },
        count: common_1.IntTy,
    },
});
let cachedQSCount = {};
let cacheTime = 1000 * 60 * 5;
function getQuickStatCount(season, region) {
    return __awaiter(this, void 0, void 0, function* () {
        let specialRegion = region && region != common_1.RegionOption.All;
        let cached = cachedQSCount[season];
        if (!specialRegion && cached && Date.now() - cached.time < cacheTime) {
            return cached.count;
        }
        let query = { season, hasStats: true, isRemote: false };
        if (region && region != common_1.RegionOption.All) {
            let regionEvents = yield Event_1.Event.find({ regionCode: { $in: (0, common_1.getRegionCodes)(region) } });
            let eventCodes = regionEvents.map((e) => e.code);
            query.eventCode = { $in: eventCodes };
        }
        let count = yield TeamMatchParticipation_2.TeamMatchParticipation.countDocuments(query);
        if (!specialRegion) {
            cachedQSCount[season] = { count, time: Date.now() };
        }
        return count;
    });
}
function getQuickStats(number, season, region) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        let total = common_1.DESCRIPTORS[season].pensSubtract ? "total_points" : "total_points_np";
        let tep = TeamEventParticipation[season];
        if (!tep)
            return null;
        let query = { teamNumber: number };
        if (region && region != common_1.RegionOption.All) {
            let regionEvents = yield Event_1.Event.find({ regionCode: { $in: (0, common_1.getRegionCodes)(region) } });
            let eventCodes = regionEvents.map((e) => e.code);
            query.eventCode = { $in: eventCodes };
        }
        let stats = yield tep.find(query).lean();
        if (!stats.length)
            return null;
        let totPoints = stats.map(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.totalPoints) !== null && _b !== void 0 ? _b : 0); }).sort((a, b) => b - a);
        let autoPoints = stats.map(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.autoPoints) !== null && _b !== void 0 ? _b : 0); }).sort((a, b) => b - a);
        let dcPoints = stats.map(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.dcPoints) !== null && _b !== void 0 ? _b : 0); }).sort((a, b) => b - a);
        let egPoints = stats.map(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.egPoints) !== null && _b !== void 0 ? _b : 0); }).sort((a, b) => b - a);
        let allTeamStats = yield tep.find({}).lean();
        let totRank = allTeamStats.filter(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.totalPoints) !== null && _b !== void 0 ? _b : 0) > totPoints[0]; }).length + 1;
        let autoRank = allTeamStats.filter(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.autoPoints) !== null && _b !== void 0 ? _b : 0) > autoPoints[0]; }).length + 1;
        let dcRank = allTeamStats.filter(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.dcPoints) !== null && _b !== void 0 ? _b : 0) > dcPoints[0]; }).length + 1;
        let egRank = allTeamStats.filter(s => { var _a, _b; return ((_b = (_a = s.opr) === null || _a === void 0 ? void 0 : _a.egPoints) !== null && _b !== void 0 ? _b : 0) > egPoints[0]; }).length + 1;
        return {
            season,
            number: number,
            tot: { value: (_a = totPoints[0]) !== null && _a !== void 0 ? _a : 0, rank: totRank },
            auto: { value: (_b = autoPoints[0]) !== null && _b !== void 0 ? _b : 0, rank: autoRank },
            dc: { value: (_c = dcPoints[0]) !== null && _c !== void 0 ? _c : 0, rank: dcRank },
            eg: { value: (_d = egPoints[0]) !== null && _d !== void 0 ? _d : 0, rank: egRank },
            count: yield getQuickStatCount(season, region),
        };
    });
}
exports.getQuickStats = getQuickStats;
exports.TeamGQL = new graphql_1.GraphQLObjectType({
    name: "Team",
    fields: () => ({
        number: common_1.IntTy,
        name: common_1.StrTy,
        schoolName: common_1.StrTy,
        sponsors: (0, common_1.listTy)(common_1.StrTy),
        location: {
            type: (0, common_1.nn)(Location_1.LocationGQL),
            resolve: (t) => ({ city: t.city, state: t.state, country: t.country }),
        },
        rookieYear: common_1.IntTy,
        activeSeasons: {
            type: (0, common_1.list)(graphql_1.GraphQLInt),
            resolve: (t) => __awaiter(void 0, void 0, void 0, function* () {
                let seasons = yield TeamMatchParticipation_2.TeamMatchParticipation.distinct("season", { teamNumber: t.number });
                return seasons.concat(common_1.CURRENT_SEASON);
            }),
        },
        website: (0, common_1.nullTy)(common_1.StrTy),
        createdAt: common_1.DateTimeTy,
        updatedAt: common_1.DateTimeTy,
        awards: {
            type: (0, common_1.list)((0, common_1.nn)(Award_1.AwardGQL)),
            args: { season: (0, common_1.nullTy)(common_1.IntTy) },
            resolve: (0, utils_1.dataLoaderResolverList)((team, a) => a.season != null
                ? { season: a.season, teamNumber: team.number }
                : { teamNumber: team.number }, Award_1.teamAwareAwardLoader),
        },
        matches: {
            type: (0, common_1.list)((0, common_1.nn)(TeamMatchParticipation_1.TeamMatchParticipationGQL)),
            args: { season: (0, common_1.nullTy)(common_1.IntTy), eventCode: (0, common_1.nullTy)(common_1.StrTy) },
            resolve: (0, utils_1.dataLoaderResolverList)((t, { season, eventCode }) => (Object.assign(Object.assign({ teamNumber: t.number }, (season != null ? { season } : {})), (eventCode != null ? { eventCode } : {}))), (keys) => TeamMatchParticipation_2.TeamMatchParticipation.find({ where: keys })),
        },
        events: {
            type: (0, common_1.list)((0, common_1.nn)(TeamEventParticipation_1.TeamEventParticipationGQL)),
            args: { season: common_1.IntTy },
            resolve: (0, utils_1.dataLoaderResolverList)((t, { season }) => ({ season, teamNumber: t.number }), (keys) => __awaiter(void 0, void 0, void 0, function* () {
                let groups = (0, common_1.groupBy)(keys, (k) => k.season);
                let qs = Object.entries(groups).map(([season, k]) => TeamEventParticipation[+season].find({ where: k }));
                return (yield Promise.all(qs)).flat();
            })),
        },
        quickStats: {
            type: QuickStatsGQL,
            args: { season: common_1.IntTy, region: { type: enums_1.RegionOptionGQL } },
            resolve: (team, { season, region }) => __awaiter(void 0, void 0, void 0, function* () {
                if (common_1.ALL_SEASONS.indexOf(season) == -1)
                    throw "invalid season";
                return getQuickStats(team.number, season, region);
            }),
        },
    }),
});
exports.TeamQueries = {
    teamByNumber: {
        type: exports.TeamGQL,
        args: { number: common_1.IntTy },
        resolve: (0, utils_1.dataLoaderResolverSingle)((_, a) => a.number, (keys) => Team_1.Team.find({ number: { $in: keys } }), (k, r) => k == r.number),
    },
    teamByName: {
        type: exports.TeamGQL,
        args: { name: common_1.StrTy },
        resolve: (0, utils_1.dataLoaderResolverSingle)((_, a) => a.name, (keys) => Team_1.Team.find({ name: { $in: keys } }), (k, r) => k == r.name),
    },
    teamsSearch: {
        type: (0, common_1.list)((0, common_1.nn)(exports.TeamGQL)),
        args: {
            region: { type: enums_1.RegionOptionGQL },
            limit: (0, common_1.nullTy)(common_1.IntTy),
            searchText: (0, common_1.nullTy)(common_1.StrTy),
        },
        resolve: (_, { region, limit, searchText, }) => __awaiter(void 0, void 0, void 0, function* () {
            let entities = [];
            if (region && region != common_1.RegionOption.All) {
                let regionCodes = (0, common_1.getRegionCodes)(region);
                let events = yield Event_1.Event.find({ regionCode: { $in: regionCodes } });
                let eventCodes = events.map(e => ({ season: e.season, code: e.code }));
                let participations = yield TeamMatchParticipation_2.TeamMatchParticipation.find({
                    season: { $in: eventCodes.map(e => e.season) },
                    eventCode: { $in: eventCodes.map(e => e.code) }
                }).lean();
                let teamNumbers = [...new Set(participations.map(p => p.teamNumber))];
                entities = yield Team_1.Team.find({ number: { $in: teamNumbers } });
            }
            else {
                entities = yield Team_1.Team.find({});
            }
            if (limit && (!searchText || searchText.trim() == "")) {
                entities = entities.slice(0, limit);
            }
            if (searchText)
                searchText = searchText.trim();
            if (searchText && searchText != "") {
                if (searchText.match(/^\d+$/)) {
                    entities = entities
                        .filter((e) => (e.number + "").startsWith(searchText))
                        .sort((a, b) => a.number - b.number);
                }
                else {
                    let res = (0, common_1.fuzzySearch)(entities, searchText, limit !== null && limit !== void 0 ? limit : undefined, "name", true);
                    entities = res.map((d) => d.document);
                }
            }
            return entities;
        }),
    },
};
//# sourceMappingURL=Team.js.map