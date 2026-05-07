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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordQueries = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
const TeamEventParticipation_1 = require("../TeamEventParticipation");
const team_event_participation_1 = require("../../../db/entities/dyn/team-event-participation");
const data_source_1 = require("../../../db/data-source");
const enums_1 = require("../enums");
const filter_gql_1 = require("./filter-gql");
const match_score_1 = require("../../../db/entities/dyn/match-score");
const Match_1 = require("../Match");
const graphql_fields_1 = __importDefault(require("graphql-fields"));
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
function name(ns, exp) {
    return exp.match(/^\w+$/) ? ns.columnName(exp, undefined, []) : exp;
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
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                let Tep = team_event_participation_1.TeamEventParticipation[season];
                if (!Tep)
                    return { data: [], offset: 0, count: 0 };
                take = Math.min(take, 50);
                let descriptor = common_1.DESCRIPTORS[season];
                let statSet = (0, common_1.getTepStatSet)(season, false);
                let ns = data_source_1.DATA_SOURCE.namingStrategy;
                let defaultRankerSqlName = descriptor.pensSubtract
                    ? "oprTotalPoints"
                    : "oprTotalPointsNp";
                let rankerExp = (_b = (_a = statSet.getStat(sortBy !== null && sortBy !== void 0 ? sortBy : "")) === null || _a === void 0 ? void 0 : _a.sqlExpr) !== null && _b !== void 0 ? _b : defaultRankerSqlName;
                let rankerSql = name(ns, rankerExp);
                let defaultSortSql = name(ns, defaultRankerSqlName) + " DESC NULLS LAST";
                let sortDirSql = sortDir !== null && sortDir !== void 0 ? sortDir : common_1.SortDir.Desc;
                let chosenRegion = region !== null && region !== void 0 ? region : common_1.RegionOption.All;
                let chosenType = type !== null && type !== void 0 ? type : common_1.EventTypeOption.Competition;
                let filterSql = filter ? (0, filter_gql_1.filterGQLToSql)(filter, statSet, (s) => name(ns, s)) : "true";
                let contextAddedQ = Tep.createQueryBuilder("tep")
                    .select("tep.event_code", "tep_ec")
                    .addSelect("tep.team_number", "tep_tn")
                    .addSelect(`ROW_NUMBER() OVER (PARTITION BY "team_number" ORDER BY ${rankerSql} ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "ranking")
                    .addSelect(`ROW_NUMBER() OVER (PARTITION BY "team_number", ${filterSql} ORDER BY ${rankerSql} ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "filter_ranking")
                    .addSelect(`${rankerSql}`, "ranker")
                    .addSelect(name(ns, defaultRankerSqlName))
                    .leftJoin("event", "e", "tep.season = e.season AND tep.event_code = e.code")
                    .andWhere("has_stats")
                    .andWhere("NOT e.modified_rules");
                let countQ = Tep.createQueryBuilder("tep")
                    .leftJoin("event", "e", "tep.season = e.season AND tep.event_code = e.code")
                    .where("has_stats")
                    .andWhere("NOT e.modified_rules");
                if (chosenRegion != common_1.RegionOption.All) {
                    contextAddedQ.andWhere("region_code IN (:...regions)", {
                        regions: (0, common_1.getRegionCodes)(chosenRegion),
                    });
                    countQ.andWhere("region_code IN (:...regions)", {
                        regions: (0, common_1.getRegionCodes)(chosenRegion),
                    });
                }
                if (chosenType != common_1.EventTypeOption.All && chosenType != common_1.EventTypeOption.Competition) {
                    contextAddedQ.andWhere("type IN (:...types)", {
                        types: (0, common_1.getEventTypes)(chosenType),
                    });
                    countQ.andWhere("type IN (:...types)", {
                        types: (0, common_1.getEventTypes)(chosenType),
                    });
                }
                if (remote == common_1.RemoteOption.Trad) {
                    contextAddedQ.andWhere("NOT remote");
                    countQ.andWhere("NOT remote");
                }
                else if (remote == common_1.RemoteOption.Remote) {
                    contextAddedQ.andWhere("remote");
                    countQ.andWhere("remote");
                }
                if (start) {
                    contextAddedQ.andWhere(`"start" >= :start`, {
                        start: start.toISOString().split("T")[0],
                    });
                    countQ.andWhere(`"start" >= :start`, { start: start.toISOString().split("T")[0] });
                }
                if (end) {
                    contextAddedQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
                    countQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
                }
                contextAddedQ.addSelect(filterSql, "is_in");
                let count = yield countQ.andWhere(filterSql).getCount();
                if (skip >= count) {
                    return { data: [], offset: skip, count };
                }
                let rankedQ = data_source_1.DATA_SOURCE.createQueryBuilder()
                    .from("context_added", "context_added")
                    .addSelect("*")
                    .addSelect(`RANK() over (order by ranking, ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "no_filter_skip_rank")
                    .addSelect(`RANK() over (partition by is_in order by filter_ranking, ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "filter_skip_rank")
                    .addSelect(`RANK() over (order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "no_filter_rank")
                    .addSelect(`RANK() over (partition by is_in order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "filter_rank")
                    .orderBy("ranker", sortDir == common_1.SortDir.Asc ? "ASC" : "DESC", "NULLS LAST")
                    .addOrderBy(name(ns, defaultRankerSqlName), "DESC", "NULLS LAST");
                let finalQ = yield data_source_1.DATA_SOURCE.createQueryBuilder()
                    .addCommonTableExpression(contextAddedQ, "context_added")
                    .addCommonTableExpression(rankedQ, "ranked")
                    .from("ranked", "ranked")
                    .addSelect("filter_rank")
                    .addSelect("no_filter_rank")
                    .addSelect("CASE WHEN filter_ranking = 1 THEN filter_skip_rank END", "filter_skip_rank")
                    .addSelect("CASE WHEN ranking = 1 THEN no_filter_skip_rank END", "no_filter_skip_rank")
                    .addSelect("tep_ec")
                    .addSelect("tep_tn")
                    .where("is_in")
                    .limit(take)
                    .offset(skip)
                    .getRawMany();
                let where = finalQ.map((r) => ({
                    season,
                    eventCode: r.tep_ec,
                    teamNumber: r.tep_tn,
                }));
                let entities = yield Tep.find({ where });
                let data = finalQ.map((r) => ({
                    data: entities.find((e) => e.eventCode == r.tep_ec && e.teamNumber == r.tep_tn),
                    noFilterRank: +r.no_filter_rank,
                    filterRank: +r.filter_rank,
                    noFilterSkipRank: +r.no_filter_skip_rank,
                    filterSkipRank: +r.filter_skip_rank,
                }));
                return { data, offset: skip, count };
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
            var _a, _b, _c, _d, _e;
            return __awaiter(this, void 0, void 0, function* () {
                let Ms = match_score_1.MatchScore[season];
                if (!Ms)
                    return { data: [], offset: 0, count: 0 };
                take = Math.min(take, 50);
                let descriptor = common_1.DESCRIPTORS[season];
                let statSet = (0, common_1.getMatchStatSet)(season, false);
                let ns = data_source_1.DATA_SOURCE.namingStrategy;
                let defaultRankerSqlName = descriptor.pensSubtract ? "totalPoints" : "totalPointsNp";
                let rankerExp = (_b = (_a = statSet.getStat(sortBy !== null && sortBy !== void 0 ? sortBy : "")) === null || _a === void 0 ? void 0 : _a.sqlExpr) !== null && _b !== void 0 ? _b : defaultRankerSqlName;
                let rankerSql = name(ns, rankerExp);
                let defaultSortSql = name(ns, defaultRankerSqlName) + " DESC NULLS LAST";
                let sortDirSql = sortDir !== null && sortDir !== void 0 ? sortDir : common_1.SortDir.Desc;
                let chosenRegion = region !== null && region !== void 0 ? region : common_1.RegionOption.All;
                let chosenType = type !== null && type !== void 0 ? type : common_1.EventTypeOption.Competition;
                let filterSql = filter ? (0, filter_gql_1.filterGQLToSql)(filter, statSet, (s) => name(ns, s)) : "true";
                let joinOurTeams = (0, filter_gql_1.isFilteringOn)(filter, (id) => id == "team1This") ||
                    (0, filter_gql_1.isFilteringOn)(filter, (id) => id == "team2This") ||
                    sortBy == "team1This" ||
                    sortBy == "team2This";
                let joinOtherTeams = (0, filter_gql_1.isFilteringOn)(filter, (id) => id == "team1Opp") ||
                    (0, filter_gql_1.isFilteringOn)(filter, (id) => id == "team2Opp") ||
                    sortBy == "team1Opp" ||
                    sortBy == "team2Opp";
                let joinOtherScore = (0, filter_gql_1.isFilteringOn)(filter, (id) => id.endsWith("Opp")) || (sortBy === null || sortBy === void 0 ? void 0 : sortBy.endsWith("Opp"));
                let contextAddedQ = Ms.createQueryBuilder("ms")
                    .select("ms.event_code", "ms_ec")
                    .addSelect("ms.match_id", "ms_id")
                    .addSelect("ms.alliance", "ms_al")
                    .addSelect(`${rankerSql}`, "ranker")
                    .addSelect("ms." + defaultRankerSqlName, name(ns, defaultRankerSqlName))
                    .leftJoin("event", "e", "ms.season = e.season AND ms.event_code = e.code")
                    .where("NOT e.modified_rules");
                let countQ = Ms.createQueryBuilder("ms")
                    .leftJoin("event", "e", "ms.season = e.season AND ms.event_code = e.code")
                    .where("NOT e.modified_rules");
                if (joinOurTeams) {
                    contextAddedQ.leftJoin("team_match_participation", "tmp1", `ms.season = tmp1.season AND ms.event_code = tmp1.event_code AND ms.match_id = 
                    tmp1.match_id AND ms.alliance = tmp1.alliance AND (tmp1.station = 'Solo' OR 
                    tmp1.station = 'One')`);
                    countQ.leftJoin("team_match_participation", "tmp1", `ms.season = tmp1.season AND ms.event_code = tmp1.event_code AND ms.match_id = 
                    tmp1.match_id AND ms.alliance = tmp1.alliance AND (tmp1.station = 'Solo' OR 
                    tmp1.station = 'One')`);
                    contextAddedQ.leftJoin("team_match_participation", "tmp2", `ms.season = tmp2.season AND ms.event_code = tmp2.event_code AND ms.match_id = 
                    tmp2.match_id AND ms.alliance = tmp2.alliance AND tmp2.station = 'Two'`);
                    countQ.leftJoin("team_match_participation", "tmp2", `ms.season = tmp2.season AND ms.event_code = tmp2.event_code AND ms.match_id = 
                    tmp2.match_id AND ms.alliance = tmp2.alliance AND tmp2.station = 'Two'`);
                }
                if (joinOtherTeams) {
                    contextAddedQ.leftJoin("team_match_participation", "tmp1Opp", `ms.season = tmp1Opp.season AND ms.event_code = tmp1Opp.event_code AND ms.match_id = 
                    tmp1Opp.match_id AND ms.alliance <> tmp1Opp.alliance AND tmp1Opp.station = 'One'`);
                    countQ.leftJoin("team_match_participation", "tmp1Opp", `ms.season = tmp1Opp.season AND ms.event_code = tmp1Opp.event_code AND ms.match_id = 
                    tmp1Opp.match_id AND ms.alliance <> tmp1Opp.alliance AND tmp1Opp.station = 'One'`);
                    contextAddedQ.leftJoin("team_match_participation", "tmp2Opp", `ms.season = tmp2Opp.season AND ms.event_code = tmp2Opp.event_code AND ms.match_id = 
                    tmp2Opp.match_id AND ms.alliance <> tmp2Opp.alliance AND tmp2Opp.station = 'Two'`);
                    countQ.leftJoin("team_match_participation", "tmp2Opp", `ms.season = tmp2Opp.season AND ms.event_code = tmp2Opp.event_code AND ms.match_id = 
                    tmp2Opp.match_id AND ms.alliance <> tmp2Opp.alliance AND tmp2Opp.station = 'Two'`);
                }
                if (joinOtherScore) {
                    contextAddedQ.leftJoin(`match_score_${season}`, "msOpp", `ms.season = msOpp.season AND ms.event_code = msOpp.eventCode AND ms.match_id = 
                    msOpp.matchId AND ms.alliance <> msOpp.alliance`);
                    countQ.leftJoin(`match_score_${season}`, "msOpp", `ms.season = msOpp.season AND ms.event_code = msOpp.eventCode AND ms.match_id = 
                    msOpp.matchId AND ms.alliance <> msOpp.alliance`);
                }
                if (chosenRegion != common_1.RegionOption.All) {
                    contextAddedQ.andWhere("region_code IN (:...regions)", {
                        regions: (0, common_1.getRegionCodes)(chosenRegion),
                    });
                    countQ.andWhere("region_code IN (:...regions)", {
                        regions: (0, common_1.getRegionCodes)(chosenRegion),
                    });
                }
                if (chosenType != common_1.EventTypeOption.All && chosenType != common_1.EventTypeOption.Competition) {
                    contextAddedQ.andWhere("type IN (:...types)", {
                        types: (0, common_1.getEventTypes)(chosenType),
                    });
                    countQ.andWhere("type IN (:...types)", {
                        types: (0, common_1.getEventTypes)(chosenType),
                    });
                }
                if (remote == common_1.RemoteOption.Trad) {
                    contextAddedQ.andWhere("NOT remote");
                    countQ.andWhere("NOT remote");
                }
                else if (remote == common_1.RemoteOption.Remote) {
                    contextAddedQ.andWhere("remote");
                    countQ.andWhere("remote");
                }
                if (start) {
                    contextAddedQ.andWhere(`"start" >= :start`, {
                        start: start.toISOString().split("T")[0],
                    });
                    countQ.andWhere(`"start" >= :start`, { start: start.toISOString().split("T")[0] });
                }
                if (end) {
                    contextAddedQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
                    countQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
                }
                contextAddedQ.addSelect(filterSql, "is_in");
                let count = yield countQ.andWhere(filterSql).getCount();
                if (skip >= count) {
                    return { data: [], offset: skip, count };
                }
                let rankedQ = data_source_1.DATA_SOURCE.createQueryBuilder()
                    .from("context_added", "context_added")
                    .addSelect("*")
                    .addSelect(`RANK() over (order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "no_filter_rank")
                    .addSelect(`RANK() over (partition by is_in order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`, "filter_rank")
                    .orderBy("ranker", sortDir == common_1.SortDir.Asc ? "ASC" : "DESC", "NULLS LAST")
                    .addOrderBy(name(ns, defaultRankerSqlName), "DESC", "NULLS LAST");
                let finalQ = yield data_source_1.DATA_SOURCE.createQueryBuilder()
                    .addCommonTableExpression(contextAddedQ, "context_added")
                    .addCommonTableExpression(rankedQ, "ranked")
                    .from("ranked", "ranked")
                    .addSelect("filter_rank")
                    .addSelect("no_filter_rank")
                    .addSelect("filter_rank", "filter_skip_rank")
                    .addSelect("no_filter_rank", "no_filter_skip_rank")
                    .addSelect("ms_ec")
                    .addSelect("ms_id")
                    .addSelect("ms_al")
                    .where("is_in")
                    .limit(take)
                    .offset(skip)
                    .getRawMany();
                let where = finalQ.map((r) => ({
                    eventSeason: season,
                    eventCode: r.ms_ec,
                    id: r.ms_id,
                }));
                let fields = (_e = (_d = (_c = (0, graphql_fields_1.default)(info)) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.match;
                let entities = yield (0, Match_1.singleSeasonScoreAwareMatchLoader)(where, [], fields && "scores" in fields, fields && "teams" in fields);
                let data = finalQ.map((r) => ({
                    data: {
                        match: entities.find((e) => e.eventCode == r.ms_ec && e.id == r.ms_id),
                        alliance: r.ms_al,
                    },
                    noFilterRank: +r.no_filter_rank,
                    filterRank: +r.filter_rank,
                    noFilterSkipRank: +r.no_filter_skip_rank,
                    filterSkipRank: +r.filter_skip_rank,
                }));
                return { data, offset: skip, count };
            });
        } }),
};
//# sourceMappingURL=Records.js.map