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
const team_event_participation_1 = require("../../db/entities/dyn/team-event-participation");
const data_source_1 = require("../../db/data-source");
const Match_1 = require("../../db/entities/Match");
const Event_1 = require("./Event");
const Event_2 = require("../../db/entities/Event");
const Match_2 = require("./Match");
const match_score_1 = require("../../db/entities/dyn/match-score");
const enums_1 = require("./enums");
exports.HomeQueries = {
    activeTeamsCount: Object.assign(Object.assign({}, common_1.IntTy), { args: { season: common_1.IntTy }, resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () {
            let tep = team_event_participation_1.TeamEventParticipation[season];
            if (!tep)
                return 0;
            let res = (yield tep
                .createQueryBuilder("tep")
                .select('COUNT(DISTINCT("team_number"))')
                .getRawOne());
            return +res.count;
        }) }),
    matchesPlayedCount: Object.assign(Object.assign({}, common_1.IntTy), { args: { season: common_1.IntTy }, resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () {
            return data_source_1.DATA_SOURCE.getRepository(Match_1.Match)
                .createQueryBuilder("m")
                .select()
                .where("m.event_season = :season", { season })
                .andWhere("m.has_been_played")
                .getCount();
        }) }),
    eventsOnDate: {
        type: (0, common_1.list)((0, common_1.nn)(Event_1.EventGQL)),
        args: { date: (0, common_1.nullTy)(common_1.DateTimeTy), type: { type: enums_1.EventTypeOptionGQL } },
        resolve: (_, { date, type }) => __awaiter(void 0, void 0, void 0, function* () {
            let q = data_source_1.DATA_SOURCE.getRepository(Event_2.Event)
                .createQueryBuilder("e")
                .where("e.start <= (:e at time zone timezone)::date", { e: date !== null && date !== void 0 ? date : "NOW()" })
                .andWhere("e.end >= (:e at time zone timezone)::date")
                .orderBy("e.start", "ASC")
                .addOrderBy("e.name", "DESC");
            if (type && type != common_1.EventTypeOption.All) {
                q.andWhere("type IN (:...types)", { types: (0, common_1.getEventTypes)(type) });
            }
            return q.getMany();
        }),
    },
    tradWorldRecord: {
        type: (0, common_1.nn)(Match_2.MatchGQL),
        args: { season: common_1.IntTy },
        resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () { return getWorldRecordMatch(season, "s.total_points_np"); }),
    },
    tradWorldRecordWithPenalties: {
        type: (0, common_1.nn)(Match_2.MatchGQL),
        args: { season: common_1.IntTy },
        resolve: (_, { season }) => __awaiter(void 0, void 0, void 0, function* () { return getWorldRecordMatch(season, "s.total_points"); }),
    },
};
function getWorldRecordMatch(season, orderColumn) {
    return __awaiter(this, void 0, void 0, function* () {
        let ms = match_score_1.MatchScore[season];
        if (!ms)
            throw "Use a valid season";
        let match = yield data_source_1.DATA_SOURCE.getRepository(Match_1.Match)
            .createQueryBuilder("m")
            .leftJoin(`match_score_${season}`, "s", "s.season = m.event_season AND s.event_code = m.event_code AND s.match_id = m.id")
            .leftJoin(Event_2.Event, "e", "e.season = m.event_season AND e.code = m.event_code")
            .orderBy(orderColumn, "DESC")
            .where("m.has_been_played")
            .andWhere("NOT e.remote")
            .andWhere("e.type <> 'OffSeason'")
            .andWhere("NOT e.modified_rules")
            .andWhere('m."event_season" = :season', { season })
            .limit(1)
            .getOne();
        if (!match)
            throw "No match found for world record";
        return data_source_1.DATA_SOURCE.getRepository(Match_1.Match)
            .createQueryBuilder("m")
            .where("m.event_season = :season", { season: match.eventSeason })
            .andWhere("m.event_code = :code", { code: match.eventCode })
            .andWhere("m.id = :id", { id: match.id })
            .leftJoinAndMapMany("m.scores", `match_score_${season}`, "ms", "m.event_season = ms.season AND m.event_code = ms.event_code AND m.id = ms.match_id")
            .leftJoinAndMapMany("m.teams", "team_match_participation", "tmp", "m.event_season = tmp.season AND m.event_code = tmp.event_code AND m.id = tmp.match_id")
            .getOne();
    });
}
//# sourceMappingURL=Home.js.map