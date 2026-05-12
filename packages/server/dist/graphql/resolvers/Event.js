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
exports.EventSubscriptions = exports.EventQueries = exports.EventGQL = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../utils");
const enums_1 = require("./enums");
const Award_1 = require("./Award");
const Event_1 = require("../../db/schemas/Event");
const common_1 = require("@ftc-scout/common");
const TeamMatchParticipation_1 = require("./TeamMatchParticipation");
const TeamMatchParticipation_2 = require("../../db/schemas/TeamMatchParticipation");
const Match_1 = require("./Match");
const Match_2 = require("../../db/schemas/Match");
const TeamEventParticipation_1 = require("./TeamEventParticipation");
const team_event_participation_1 = require("../../db/schemas/dyn/team-event-participation");
const Location_1 = require("../objs/Location");
const luxon_1 = require("luxon");
const pubsub_1 = require("./pubsub");
const dyn_types_schema_1 = require("../dyn/dyn-types-schema");
const tep_1 = require("../dyn/tep");
exports.EventGQL = new graphql_1.GraphQLObjectType({
    name: "Event",
    fields: () => ({
        season: common_1.IntTy,
        code: common_1.StrTy,
        divisionCode: (0, common_1.nullTy)(common_1.StrTy),
        name: common_1.StrTy,
        remote: common_1.BoolTy,
        hybrid: common_1.BoolTy,
        fieldCount: common_1.IntTy,
        published: common_1.BoolTy,
        type: { type: (0, common_1.nn)(enums_1.EventTypeGQL) },
        regionCode: (0, common_1.nullTy)(common_1.StrTy),
        leagueCode: (0, common_1.nullTy)(common_1.StrTy),
        districtCode: (0, common_1.nullTy)(common_1.StrTy),
        address: (0, common_1.nullTy)(common_1.StrTy),
        location: {
            type: (0, common_1.nn)(Location_1.LocationGQL),
            resolve: (e) => !!e ? { venue: e.venue, city: e.city, state: e.state, country: e.country } : null,
        },
        website: (0, common_1.nullTy)(common_1.StrTy),
        liveStreamURL: (0, common_1.nullTy)(common_1.StrTy),
        livestreamsByDay: {
            type: (0, common_1.list)((0, common_1.nn)(EventLivestreamDayGQL)),
            resolve: (e) => {
                if (e.livestreamsByDay &&
                    Array.isArray(e.livestreamsByDay) &&
                    e.livestreamsByDay.length > 0) {
                    return e.livestreamsByDay.map((ls) => {
                        var _a;
                        return ({
                            day: luxon_1.DateTime.fromISO(ls.day).toJSDate(),
                            liveStreamURL: ls.liveStreamURL,
                            webcasts: (_a = ls.webcasts) !== null && _a !== void 0 ? _a : [],
                        });
                    });
                }
                if (e.liveStreamURL) {
                    for (let day of [e.start, e.end]) {
                        if (day) {
                            return [
                                {
                                    day,
                                    liveStreamURL: e.liveStreamURL,
                                    webcasts: e.webcasts,
                                    label: null,
                                },
                            ];
                        }
                    }
                }
                return [];
            },
        },
        webcasts: (0, common_1.listTy)(common_1.StrTy),
        timezone: common_1.StrTy,
        start: common_1.DateTy,
        end: common_1.DateTy,
        createdAt: common_1.DateTimeTy,
        updatedAt: common_1.DateTimeTy,
        started: Object.assign(Object.assign({}, common_1.BoolTy), { resolve: (e) => luxon_1.DateTime.fromISO(e.start, { zone: e.timezone }) < luxon_1.DateTime.now() }),
        ongoing: Object.assign(Object.assign({}, common_1.BoolTy), { resolve: (e) => luxon_1.DateTime.fromISO(e.start, { zone: e.timezone }) < luxon_1.DateTime.now() &&
                luxon_1.DateTime.now() < luxon_1.DateTime.fromISO(e.end, { zone: e.timezone }).endOf("day") }),
        finished: Object.assign(Object.assign({}, common_1.BoolTy), { resolve: (e) => luxon_1.DateTime.fromISO(e.end, { zone: e.timezone }).endOf("day") < luxon_1.DateTime.now() }),
        relatedEvents: {
            type: (0, common_1.list)((0, common_1.nn)(exports.EventGQL)),
            resolve: (e) => __awaiter(void 0, void 0, void 0, function* () {
                const query = { season: e.season, code: { $ne: e.code } };
                if (e.divisionCode) {
                    query.$or = [
                        { code: e.divisionCode },
                        { divisionCode: e.divisionCode },
                        { divisionCode: e.code }
                    ];
                }
                else {
                    query.divisionCode = e.code;
                }
                return Event_1.Event.find(query);
            }),
        },
        awards: {
            type: (0, common_1.list)((0, common_1.nn)(Award_1.AwardGQL)),
            resolve: (0, utils_1.dataLoaderResolverList)((event) => ({ season: event.season, eventCode: event.code }), Award_1.teamAwareAwardLoader),
        },
        teams: {
            type: (0, common_1.list)((0, common_1.nn)(TeamEventParticipation_1.TeamEventParticipationGQL)),
            resolve: (0, utils_1.dataLoaderResolverList)((event) => ({ season: event.season, eventCode: event.code }), (keys) => __awaiter(void 0, void 0, void 0, function* () {
                let groups = (0, common_1.groupBy)(keys, (k) => k.season);
                let qs = Object.entries(groups).map(([season, k]) => team_event_participation_1.TeamEventParticipation[+season].find({ where: k }));
                return (yield Promise.all(qs)).flat();
            })),
        },
        teamMatches: {
            type: (0, common_1.list)((0, common_1.nn)(TeamMatchParticipation_1.TeamMatchParticipationGQL)),
            args: { teamNumber: (0, common_1.nullTy)(common_1.IntTy) },
            resolve: (0, utils_1.dataLoaderResolverList)((e, { teamNumber }) => teamNumber != null
                ? { season: e.season, eventCode: e.code, teamNumber }
                : { season: e.season, eventCode: e.code }, (keys) => TeamMatchParticipation_2.TeamMatchParticipation.find({ where: keys })),
        },
        hasMatches: Object.assign(Object.assign({}, common_1.BoolTy), { resolve: (e) => __awaiter(void 0, void 0, void 0, function* () {
                return "hasMatches" in e
                    ? e.hasMatches
                    : (yield DATA_SOURCE.getRepository(Event_1.Event)
                        .createQueryBuilder("e")
                        .distinctOn(["code"])
                        .addSelect("coalesce(m.has_been_played, false)", "has_matches")
                        .leftJoin(Match_2.Match, "m", "e.season = m.event_season AND e.code = m.event_code")
                        .where("season = :season", { season: e.season })
                        .andWhere("code = :code", { code: e.code })
                        .getRawOne()).has_matches;
            }) }),
        matches: {
            type: (0, common_1.list)((0, common_1.nn)(Match_1.MatchGQL)),
            resolve: (0, utils_1.dataLoaderResolverList)((e, { id }) => id != null
                ? { eventSeason: e.season, eventCode: e.code, id }
                : { eventSeason: e.season, eventCode: e.code }, Match_1.singleSeasonScoreAwareMatchLoader),
        },
        previewStats: Object.assign(Object.assign({}, (0, common_1.nullTy)((0, common_1.wr)((0, common_1.list)((0, common_1.nn)(EventPreviewStatGQL))))), { resolve: (event) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                if (event.published) {
                    return null;
                }
                let roster = yield team_event_participation_1.TeamEventParticipation[event.season].find({ season: event.season, eventCode: event.code }, { select: ["teamNumber"] });
                let teamNumbers = roster.map((r) => r.teamNumber);
                if (!teamNumbers.length)
                    return [];
                let descriptor = common_1.DESCRIPTORS[event.season];
                let getQuickOpr = (t) => {
                    var _a, _b, _c, _d, _e, _f;
                    let val = descriptor.pensSubtract
                        ? (_b = (_a = t.opr) === null || _a === void 0 ? void 0 : _a.totalPoints) !== null && _b !== void 0 ? _b : null
                        : (_f = (_d = (_c = t.opr) === null || _c === void 0 ? void 0 : _c.totalPointsNp) !== null && _d !== void 0 ? _d : (_e = t.opr) === null || _e === void 0 ? void 0 : _e.totalPoints) !== null && _f !== void 0 ? _f : null;
                    return val == null ? null : +val;
                };
                let candidateStats = yield team_event_participation_1.TeamEventParticipation[event.season].find({
                    teamNumber: { $in: teamNumbers },
                    isRemote: false,
                    hasStats: true,
                });
                let bestStats = new Map();
                for (let row of candidateStats) {
                    let quick = getQuickOpr(row);
                    let eventCode = row.eventCode;
                    let existing = bestStats.get(row.teamNumber);
                    if (!existing) {
                        bestStats.set(row.teamNumber, { row, quick, eventCode });
                        continue;
                    }
                    let existingValue = (_a = existing.quick) !== null && _a !== void 0 ? _a : Number.NEGATIVE_INFINITY;
                    let currentValue = quick !== null && quick !== void 0 ? quick : Number.NEGATIVE_INFINITY;
                    if (currentValue > existingValue) {
                        bestStats.set(row.teamNumber, { row, quick, eventCode });
                    }
                }
                let eventCodes = new Set(candidateStats.map((r) => r.eventCode));
                let events = yield Event_1.Event.find({
                    season: event.season,
                    code: { $in: [...eventCodes] },
                });
                let eventMap = new Map(events.map((e) => [e.code, e]));
                return teamNumbers.map((teamNumber) => {
                    var _a, _b, _c;
                    let entry = bestStats.get(teamNumber);
                    return {
                        teamNumber,
                        npOpr: (_a = entry === null || entry === void 0 ? void 0 : entry.quick) !== null && _a !== void 0 ? _a : null,
                        stats: entry ? (0, tep_1.addTypename)(entry.row) : null,
                        event: (_c = eventMap.get((_b = entry === null || entry === void 0 ? void 0 : entry.eventCode) !== null && _b !== void 0 ? _b : "")) !== null && _c !== void 0 ? _c : null,
                    };
                });
            }) }),
    }),
});
const EventPreviewStatGQL = new graphql_1.GraphQLObjectType({
    name: "EventPreviewStat",
    fields: {
        teamNumber: common_1.IntTy,
        npOpr: (0, common_1.nullTy)(common_1.FloatTy),
        stats: { type: dyn_types_schema_1.TepStatsUnionGQL },
        event: { type: exports.EventGQL },
    },
});
const EventLivestreamDayGQL = new graphql_1.GraphQLObjectType({
    name: "EventLivestreamDay",
    fields: {
        day: common_1.DateTy,
        liveStreamURL: (0, common_1.nullTy)(common_1.StrTy),
        webcasts: (0, common_1.listTy)(common_1.StrTy),
    },
});
exports.EventQueries = {
    eventByCode: {
        type: exports.EventGQL,
        args: { season: common_1.IntTy, code: common_1.StrTy },
        resolve: (0, utils_1.dataLoaderResolverSingle)((_, a) => a, (keys) => Event_1.Event.find(keys)),
    },
    eventsSearch: {
        type: (0, common_1.list)((0, common_1.nn)(exports.EventGQL)),
        args: {
            season: common_1.IntTy,
            region: { type: enums_1.RegionOptionGQL },
            type: { type: enums_1.EventTypeOptionGQL },
            hasMatches: (0, common_1.nullTy)(common_1.BoolTy),
            start: (0, common_1.nullTy)(common_1.DateTy),
            end: (0, common_1.nullTy)(common_1.DateTy),
            limit: (0, common_1.nullTy)(common_1.IntTy),
            searchText: (0, common_1.nullTy)(common_1.StrTy),
        },
        resolve: (_, { season, region, type, hasMatches, start, end, limit, searchText, }) => __awaiter(void 0, void 0, void 0, function* () {
            let query = { season };
            if (region && region != common_1.RegionOption.All) {
                query.regionCode = { $in: (0, common_1.getRegionCodes)(region) };
            }
            if (type && type != common_1.EventTypeOption.All) {
                query.type = { $in: (0, common_1.getEventTypes)(type) };
            }
            if (start) {
                query.start = { $gte: new Date(start.toISOString().split("T")[0]) };
            }
            if (end) {
                query.end = { $lte: new Date(end.toISOString().split("T")[0]) };
            }
            let options = {};
            if (limit && (!searchText || searchText.trim() == "")) {
                options.limit = limit;
            }
            let entities = yield Event_1.Event.find(query, {}, options);
            for (let entity of entities) {
                const match = yield Match_2.Match.findOne({
                    eventSeason: entity.season,
                    eventCode: entity.code,
                    hasBeenPlayed: true,
                });
                entity.hasMatches = !!match;
            }
            if (hasMatches != null) {
                entities = entities.filter((e) => e.hasMatches == hasMatches);
            }
            if (searchText && searchText.trim() != "") {
                let res = (0, common_1.fuzzySearch)(entities, searchText, limit !== null && limit !== void 0 ? limit : undefined, "name", true);
                entities = res.map((d) => d.document);
            }
            return entities;
        }),
    },
};
exports.EventSubscriptions = {
    newMatches: {
        type: (0, common_1.list)((0, common_1.nn)(Match_1.MatchGQL)).ofType,
        args: { season: common_1.IntTy, code: common_1.StrTy },
        subscribe: (_, { season, code }) => pubsub_1.pubsub.asyncIterator((0, pubsub_1.newMatchesKey)(season, code)),
    },
};
//# sourceMappingURL=Event.js.map