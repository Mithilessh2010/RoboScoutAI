"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TepStatsUnionGQL = exports.MatchScoresUnionGQL = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
const match_score_1 = require("./match-score");
const tep_1 = require("./tep");
exports.MatchScoresUnionGQL = new graphql_1.GraphQLUnionType({
    name: "MatchScores",
    types: common_1.DESCRIPTORS_LIST.flatMap(match_score_1.makeMatchScoreTys),
});
exports.TepStatsUnionGQL = new graphql_1.GraphQLUnionType({
    name: "TeamEventStats",
    types: common_1.DESCRIPTORS_LIST.flatMap(tep_1.makeTepTypes),
});
//# sourceMappingURL=dyn-types-schema.js.map