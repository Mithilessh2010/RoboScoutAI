"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleSeasonScoreAwareMatchLoader = exports.MatchGQL = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../utils");
const common_1 = require("@ftc-scout/common");
const Match_1 = require("../../db/entities/Match");
const Event_1 = require("../../db/entities/Event");
const enums_1 = require("./enums");
const dyn_types_schema_1 = require("../dyn/dyn-types-schema");
const match_score_1 = require("../dyn/match-score");
const data_source_1 = require("../../db/data-source");
const graphql_fields_1 = __importDefault(require("graphql-fields"));
const TeamMatchParticipation_1 = require("./TeamMatchParticipation");
const Event_2 = require("./Event");
exports.MatchGQL = new graphql_1.GraphQLObjectType({
    name: "Match",
    fields: () => ({
        season: Object.assign(Object.assign({}, common_1.IntTy), { resolve: (m) => m.eventSeason }),
        eventCode: common_1.StrTy,
        id: common_1.IntTy,
        hasBeenPlayed: common_1.BoolTy,
        scheduledStartTime: (0, common_1.nullTy)(common_1.DateTimeTy),
        actualStartTime: (0, common_1.nullTy)(common_1.DateTimeTy),
        postResultTime: (0, common_1.nullTy)(common_1.DateTimeTy),
        tournamentLevel: { type: (0, common_1.nn)(enums_1.TournamentLevelGQL) },
        series: common_1.IntTy,
        matchNum: common_1.IntTy,
        description: common_1.StrTy,
        createdAt: common_1.DateTimeTy,
        updatedAt: common_1.DateTimeTy,
        scores: {
            type: dyn_types_schema_1.MatchScoresUnionGQL,
            resolve: (m) => (0, match_score_1.frontendMSFromDB)(m.scores),
        },
        teams: { type: (0, common_1.list)((0, common_1.nn)(TeamMatchParticipation_1.TeamMatchParticipationGQL)) },
        event: {
            type: (0, common_1.nn)(Event_2.EventGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((m) => ({ season: m.eventSeason, code: m.eventCode }), (keys) => Event_1.Event.find({ where: keys })),
        },
    }),
});
function singleSeasonScoreAwareMatchLoader(keys, info, includeScores = false, includeTeams = false) {
    includeScores || (includeScores = info.some((i) => "scores" in (0, graphql_fields_1.default)(i)));
    includeTeams || (includeTeams = info.some((i) => "teams" in (0, graphql_fields_1.default)(i)));
    let season = keys[0].eventSeason;
    let q = data_source_1.DATA_SOURCE.getRepository(Match_1.Match)
        .createQueryBuilder("m")
        .where((0, utils_1.keyListToWhereClause)("m", keys));
    if (includeScores) {
        q.leftJoinAndMapMany("m.scores", `match_score_${season}`, "ms", "m.event_season = ms.season AND m.event_code = ms.event_code AND m.id = ms.match_id");
    }
    if (includeTeams) {
        q.leftJoinAndMapMany("m.teams", "team_match_participation", "tmp", "m.event_season = tmp.season AND m.event_code = tmp.event_code AND m.id = tmp.match_id");
    }
    return q.getMany();
}
exports.singleSeasonScoreAwareMatchLoader = singleSeasonScoreAwareMatchLoader;
//# sourceMappingURL=Match.js.map