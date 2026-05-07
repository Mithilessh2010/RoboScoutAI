"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamMatchParticipationGQL = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../utils");
const common_1 = require("@ftc-scout/common");
const enums_1 = require("./enums");
const Team_1 = require("./Team");
const Team_2 = require("../../db/entities/Team");
const typeorm_1 = require("typeorm");
const Event_1 = require("./Event");
const Event_2 = require("../../db/entities/Event");
const Match_1 = require("./Match");
exports.TeamMatchParticipationGQL = new graphql_1.GraphQLObjectType({
    name: "TeamMatchParticipation",
    fields: () => ({
        season: common_1.IntTy,
        eventCode: common_1.StrTy,
        matchId: common_1.IntTy,
        alliance: { type: (0, common_1.nn)(enums_1.AllianceGQL) },
        station: { type: (0, common_1.nn)(enums_1.StationGQL) },
        teamNumber: common_1.IntTy,
        allianceRole: { type: (0, common_1.nn)(enums_1.AllianceRoleGQL) },
        surrogate: common_1.BoolTy,
        noShow: common_1.BoolTy,
        dq: common_1.BoolTy,
        onField: common_1.BoolTy,
        createdAt: common_1.DateTimeTy,
        updatedAt: common_1.DateTimeTy,
        team: {
            type: (0, common_1.nn)(Team_1.TeamGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((tmp) => tmp.teamNumber, (keys) => Team_2.Team.find({ where: { number: (0, typeorm_1.In)(keys) } }), (k, r) => k == r.number),
        },
        match: {
            type: (0, common_1.nn)(Match_1.MatchGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((tmp) => ({ eventSeason: tmp.season, eventCode: tmp.eventCode, id: tmp.matchId }), Match_1.singleSeasonScoreAwareMatchLoader),
        },
        event: {
            type: (0, common_1.nn)(Event_1.EventGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((tmp) => ({ season: tmp.season, code: tmp.eventCode }), (keys) => Event_2.Event.find({ where: keys })),
        },
    }),
});
//# sourceMappingURL=TeamMatchParticipation.js.map