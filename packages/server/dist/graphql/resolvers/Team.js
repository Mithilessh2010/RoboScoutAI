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
const Team_1 = require("../../db/entities/Team");
const typeorm_1 = require("typeorm");
const Award_1 = require("./Award");
const common_2 = require("@ftc-scout/common");
const TeamMatchParticipation_1 = require("./TeamMatchParticipation");
const TeamMatchParticipation_2 = require("../../db/entities/TeamMatchParticipation");
const Location_1 = require("../objs/Location");
const team_event_participation_1 = require("../../db/entities/dyn/team-event-participation");
const TeamEventParticipation_1 = require("./TeamEventParticipation");
const enums_1 = require("./enums");
const data_source_1 = require("../../db/data-source");
const Event_1 = require("../../db/entities/Event");
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
        let q = data_source_1.DATA_SOURCE.createQueryBuilder(`tep_${season}`, "t")
            .leftJoin("event", "e", "e.season = t.season AND e.code = t.event_code")
            .select("count(distinct team_number)")
            .where("NOT is_remote")
            .andWhere("has_stats")
            .andWhere("NOT e.modified_rules");
        if (region && region != common_1.RegionOption.All) {
            q.andWhere("region_code IN (:...regions)", { regions: (0, common_1.getRegionCodes)(region) });
        }
        let raw = yield q.getRawOne();
        let count = +raw.count;
        if (!specialRegion) {
            cachedQSCount[season] = { count, time: Date.now() };
        }
        return count;
    });
}
function getQuickStats(number, season, region) {
    return __awaiter(this, void 0, void 0, function* () {
        let total = common_1.DESCRIPTORS[season].pensSubtract ? "total_points" : "total_points_np";
        let max = data_source_1.DATA_SOURCE.createQueryBuilder(`tep_${season}`, "t")
            .leftJoin("event", "e", "e.season = t.season AND e.code = t.event_code")
            .select("team_number")
            .addSelect(`max(opr_${total})`, "tot")
            .addSelect("max(opr_auto_points)", "auto")
            .addSelect("max(opr_dc_points)", "dc");
        let egColumn = "opr_eg_points";
        if (season == common_2.Season.IntoTheDeep) {
            egColumn = "opr_dc_park_points";
        }
        else if (season == common_2.Season.Decode) {
            egColumn = "opr_dc_base_points";
        }
        max = max.addSelect(`max(${egColumn})`, "eg");
        max = max
            .where("NOT is_remote")
            .andWhere("has_stats")
            .andWhere("NOT e.modified_rules")
            .groupBy("team_number");
        if (region && region != common_1.RegionOption.All) {
            max.andWhere("region_code IN (:...regions)", {
                regions: (0, common_1.getRegionCodes)(region),
            });
        }
        let ranks = data_source_1.DATA_SOURCE.createQueryBuilder()
            .from("max", "max")
            .select("*")
            .addSelect("rank() over (order by tot DESC)", "tot_rank")
            .addSelect("rank() over (order by auto DESC)", "auto_rank")
            .addSelect("rank() over (order by dc DESC)", "dc_rank")
            .addSelect("rank() over (order by eg DESC)", "eg_rank");
        let res = yield data_source_1.DATA_SOURCE.createQueryBuilder()
            .addCommonTableExpression(max, "max")
            .addCommonTableExpression(ranks, "ranks")
            .from("ranks", "ranks")
            .select("*")
            .where("team_number = :number", { number })
            .getRawOne();
        if (!res)
            return null;
        return {
            season,
            number: number,
            tot: { value: res.tot, rank: +res.tot_rank },
            auto: { value: res.auto, rank: +res.auto_rank },
            dc: { value: res.dc, rank: +res.dc_rank },
            eg: { value: res.eg, rank: +res.eg_rank },
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
                let seasons = yield data_source_1.DATA_SOURCE.getRepository(TeamMatchParticipation_2.TeamMatchParticipation)
                    .createQueryBuilder("tmp")
                    .select("DISTINCT season")
                    .where("team_number = :number", { number: t.number })
                    .getRawMany();
                return seasons.map((s) => s.season).concat(common_1.CURRENT_SEASON);
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
                let qs = Object.entries(groups).map(([season, k]) => team_event_participation_1.TeamEventParticipation[+season].find({ where: k }));
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
        resolve: (0, utils_1.dataLoaderResolverSingle)((_, a) => a.number, (keys) => Team_1.Team.find({ where: { number: (0, typeorm_1.In)(keys) } }), (k, r) => k == r.number),
    },
    teamByName: {
        type: exports.TeamGQL,
        args: { name: common_1.StrTy },
        resolve: (0, utils_1.dataLoaderResolverSingle)((_, a) => a.name, (keys) => Team_1.Team.find({ where: { name: (0, typeorm_1.In)(keys) } }), (k, r) => k == r.name),
    },
    teamsSearch: {
        type: (0, common_1.list)((0, common_1.nn)(exports.TeamGQL)),
        args: {
            region: { type: enums_1.RegionOptionGQL },
            limit: (0, common_1.nullTy)(common_1.IntTy),
            searchText: (0, common_1.nullTy)(common_1.StrTy),
        },
        resolve: (_, { region, limit, searchText, }) => __awaiter(void 0, void 0, void 0, function* () {
            let q = data_source_1.DATA_SOURCE.getRepository(Team_1.Team).createQueryBuilder("t").distinctOn(["number"]);
            if (region && region != common_1.RegionOption.All) {
                q.leftJoin(TeamMatchParticipation_2.TeamMatchParticipation, "m", "t.number = m.team_number")
                    .leftJoin(Event_1.Event, "e", "e.season = m.season AND e.code = m.event_code")
                    .andWhere("e.region_code IN (:...regions)", {
                    regions: (0, common_1.getRegionCodes)(region),
                });
            }
            if (limit && (!searchText || searchText.trim() == "")) {
                q.limit(limit);
            }
            let entities = yield q.getMany();
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