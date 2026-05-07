"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamAwareAwardLoader = exports.AwardGQL = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../utils");
const enums_1 = require("./enums");
const Team_1 = require("./Team");
const Award_1 = require("../../db/entities/Award");
const Event_1 = require("./Event");
const Event_2 = require("../../db/entities/Event");
const common_1 = require("@ftc-scout/common");
const graphql_fields_1 = __importDefault(require("graphql-fields"));
const data_source_1 = require("../../db/data-source");
exports.AwardGQL = new graphql_1.GraphQLObjectType({
    name: "Award",
    fields: () => ({
        season: common_1.IntTy,
        eventCode: common_1.StrTy,
        teamNumber: common_1.IntTy,
        divisionName: (0, common_1.nullTy)(common_1.StrTy),
        personName: (0, common_1.nullTy)(common_1.StrTy),
        type: { type: (0, common_1.nn)(enums_1.AwardTypeGQL) },
        placement: common_1.IntTy,
        createdAt: common_1.DateTimeTy,
        updatedAt: common_1.DateTimeTy,
        team: { type: (0, common_1.nn)(Team_1.TeamGQL) },
        event: {
            type: (0, common_1.nn)(Event_1.EventGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((a) => ({ season: a.season, code: a.eventCode }), (keys) => Event_2.Event.find({ where: keys })),
        },
    }),
});
function teamAwareAwardLoader(keys, info) {
    let includeTeam = info.some((i) => "team" in (0, graphql_fields_1.default)(i));
    let q = data_source_1.DATA_SOURCE.getRepository(Award_1.Award)
        .createQueryBuilder("a")
        .where((0, utils_1.keyListToWhereClause)("a", keys));
    if (includeTeam) {
        q.leftJoinAndMapOne("a.team", "team", "t", "a.team_number = t.number");
    }
    return q.getMany();
}
exports.teamAwareAwardLoader = teamAwareAwardLoader;
//# sourceMappingURL=Award.js.map