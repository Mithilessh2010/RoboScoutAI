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
exports.TeamEventParticipationGQL = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
const utils_1 = require("../utils");
const Event_1 = require("../../db/schemas/Event");
const Team_1 = require("./Team");
const Team_2 = require("../../db/schemas/Team");
const Award_1 = require("./Award");
const TeamMatchParticipation_1 = require("../../db/schemas/TeamMatchParticipation");
const dyn_types_schema_1 = require("../dyn/dyn-types-schema");
const tep_1 = require("../dyn/tep");
const Event_2 = require("./Event");
const TeamMatchParticipation_2 = require("./TeamMatchParticipation");
exports.TeamEventParticipationGQL = new graphql_1.GraphQLObjectType({
    name: "TeamEventParticipation",
    fields: () => ({
        season: common_1.IntTy,
        eventCode: common_1.StrTy,
        teamNumber: common_1.IntTy,
        stats: {
            type: dyn_types_schema_1.TepStatsUnionGQL,
            resolve: (tep) => (tep.hasStats ? (0, tep_1.addTypename)(tep) : null),
        },
        event: {
            type: (0, common_1.nn)(Event_2.EventGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((tep) => ({ season: tep.season, code: tep.eventCode }), (keys) => __awaiter(void 0, void 0, void 0, function* () { return Event_1.Event.find(keys); })),
        },
        team: {
            type: (0, common_1.nn)(Team_1.TeamGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((tep) => tep.teamNumber, (keys) => Team_2.Team.find({ number: { $in: keys } }), (k, t) => k == t.number),
        },
        awards: {
            type: (0, common_1.list)((0, common_1.nn)(Award_1.AwardGQL)),
            resolve: (0, utils_1.dataLoaderResolverList)((tep) => ({
                season: tep.season,
                eventCode: tep.eventCode,
                teamNumber: tep.teamNumber,
            }), Award_1.teamAwareAwardLoader),
        },
        matches: {
            type: (0, common_1.list)((0, common_1.nn)(TeamMatchParticipation_2.TeamMatchParticipationGQL)),
            resolve: (0, utils_1.dataLoaderResolverList)((tep) => ({
                season: tep.season,
                eventCode: tep.eventCode,
                teamNumber: tep.teamNumber,
            }), (keys) => TeamMatchParticipation_1.TeamMatchParticipation.find(keys)),
        },
    }),
});
//# sourceMappingURL=TeamEventParticipation.js.map