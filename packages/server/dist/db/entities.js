"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTITIES = exports.DEV_ENTITIES = void 0;
const Team_1 = require("./entities/Team");
const Event_1 = require("./entities/Event");
const constants_1 = require("../constants");
const FtcApiReq_1 = require("./entities/FtcApiReq");
const DataHasBeenLoaded_1 = require("./entities/DataHasBeenLoaded");
const match_score_1 = require("./entities/dyn/match-score");
const Match_1 = require("./entities/Match");
const TeamMatchParticipation_1 = require("./entities/TeamMatchParticipation");
const Award_1 = require("./entities/Award");
const team_event_participation_1 = require("./entities/dyn/team-event-participation");
const ApiReq_1 = require("./entities/ApiReq");
const Analytics_1 = require("./entities/Analytics");
const BestName_1 = require("./entities/BestName");
exports.DEV_ENTITIES = [FtcApiReq_1.FtcApiReq];
exports.ENTITIES = [
    DataHasBeenLoaded_1.DataHasBeenLoaded,
    Team_1.Team,
    Event_1.Event,
    Award_1.Award,
    Match_1.Match,
    TeamMatchParticipation_1.TeamMatchParticipation,
    ...Object.values(match_score_1.MatchScoreSchemas),
    ...Object.values(team_event_participation_1.TeamEventParticipationSchemas),
    BestName_1.BestName,
    ApiReq_1.ApiReq,
    Analytics_1.Analytics,
    ...(constants_1.IS_DEV ? exports.DEV_ENTITIES : []),
];
//# sourceMappingURL=entities.js.map