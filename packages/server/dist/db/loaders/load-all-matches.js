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
exports.loadAllMatches = void 0;
const common_1 = require("@ftc-scout/common");
const DataHasBeenLoaded_1 = require("../entities/DataHasBeenLoaded");
const Event_1 = require("../entities/Event");
const data_source_1 = require("../data-source");
const Match_1 = require("../entities/Match");
const get_matches_1 = require("../../ftc-api/get-matches");
const get_match_scores_1 = require("../../ftc-api/get-match-scores");
const get_teams_1 = require("../../ftc-api/get-teams");
const match_score_1 = require("../entities/dyn/match-score");
const TeamMatchParticipation_1 = require("../entities/TeamMatchParticipation");
const watch_1 = require("../../ftc-api/watch");
const team_event_participation_1 = require("../entities/dyn/team-event-participation");
const process_1 = require("process");
const constants_1 = require("../../constants");
const pubsub_1 = require("../../graphql/resolvers/pubsub");
const IGNORED_MATCHES = [
    { season: common_1.Season.UltimateGoal, eventCode: "USNYEXS1", teamNumber: 14903 },
    { season: common_1.Season.UltimateGoal, eventCode: "USNYEXS1", teamNumber: 17222 },
    { season: common_1.Season.UltimateGoal, eventCode: "USNJCWS1", teamNumber: 9889 },
];
function isIgnored(season, eCode, m) {
    return IGNORED_MATCHES.some((im) => im.season == season &&
        im.eventCode == eCode &&
        m.teams.some((t) => im.teamNumber == t.teamNumber));
}
function loadAllMatches(season, loadType) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading matches for season ${season}. (${loadType})`);
        let events = yield eventsToFetch(season, loadType);
        console.info(`Got ${events.length} events to fetch.`);
        for (let i = 0; i < events.length; i++) {
            let event = events[i];
            if (event.remote && !common_1.DESCRIPTORS[season].hasRemote)
                continue;
            try {
                let [matches, scores, teams] = yield Promise.all([
                    (0, get_matches_1.getMatches)(season, event.code),
                    (0, get_match_scores_1.getMatchScores)(season, event.code),
                    (0, get_teams_1.getTeams)(season, event.code),
                ]);
                let allDbMatches = [];
                let allDbScores = [];
                let allDbTmps = [];
                for (let match of matches) {
                    if (isIgnored(season, event.code, match))
                        continue;
                    let theseScores = findScores(match, scores);
                    let hasBeenPlayed = !!theseScores.length;
                    let dbMatch = Match_1.Match.fromApi(match, event, hasBeenPlayed, matches);
                    let dbTmps = TeamMatchParticipation_1.TeamMatchParticipation.fromApi(match.teams, dbMatch, event.remote);
                    let dbScores = event.remote && dbTmps[0].noShow
                        ? []
                        : theseScores.flatMap((s) => match_score_1.MatchScore.fromApi(s, dbMatch, event.remote));
                    dbMatch.teams = dbTmps;
                    dbMatch.scores = dbScores;
                    allDbMatches.push(dbMatch);
                    allDbScores.push(...dbScores);
                    allDbTmps.push(...dbTmps);
                }
                let allTeams = allDbMatches.flatMap((m) => m.teams.map((t) => t.teamNumber));
                allTeams = allTeams.concat(teams.map((t) => t.teamNumber));
                allTeams = [...new Set(allTeams)];
                let allDbTeps = (0, common_1.calculateTeamEventStats)(season, event.code, event.remote, allDbMatches.map((m) => m.toFrontend()), allTeams);
                yield data_source_1.DATA_SOURCE.transaction((em) => __awaiter(this, void 0, void 0, function* () {
                    yield em.save(allDbMatches, { chunk: 100 });
                    yield em.save(allDbTmps, { chunk: 500 });
                    yield em.getRepository(match_score_1.MatchScoreSchemas[season]).save(allDbScores, { chunk: 100 });
                    yield em.getRepository(team_event_participation_1.TeamEventParticipationSchemas[season]).save(allDbTeps, { chunk: 100 });
                }));
                let updatedScores = allDbScores.filter((m) => "updatedAt" in m);
                let updatedTmps = allDbTmps.filter((tmp) => "updatedAt" in tmp);
                let updatedMatches = allDbMatches.filter((m) => {
                    return ("updatedAt" in m ||
                        updatedScores.some((s) => m.eventCode == s.eventCode && m.id == s.matchId) ||
                        updatedTmps.some((tmp) => m.eventCode == tmp.eventCode && m.id == tmp.matchId));
                });
                publishMatchUpdates(updatedMatches);
                console.info(`Loaded ${i + 1}/${events.length}.`);
            }
            catch (e) {
                console.error(`Loaded ${i + 1}/${events.length} !!! ERROR !!!`);
                console.error(e);
                if (constants_1.IS_DEV) {
                    (0, process_1.exit)(1);
                }
            }
        }
        if (loadType == watch_1.LoadType.Full) {
            yield DataHasBeenLoaded_1.DataHasBeenLoaded.create({
                season,
                matches: true,
            }).save();
        }
        console.info(`Finished loading events.`);
    });
}
exports.loadAllMatches = loadAllMatches;
function findScores(match, scores) {
    return scores.filter((s) => "teamNumber" in s
        ? match.teams[0].teamNumber == s.teamNumber && match.matchNumber == s.matchNumber
        : match.tournamentLevel == s.matchLevel &&
            match.series == s.matchSeries &&
            match.matchNumber == s.matchNumber);
}
function eventsToFetch(season, loadType) {
    return __awaiter(this, void 0, void 0, function* () {
        let loaded = yield DataHasBeenLoaded_1.DataHasBeenLoaded.matchesHaveBeenLoaded(season);
        if (!loaded) {
            return Event_1.Event.findBy({ season });
        }
        if (loadType == watch_1.LoadType.Full) {
            return data_source_1.DATA_SOURCE.getRepository(Event_1.Event)
                .createQueryBuilder("e")
                .select(["e.season", "e.code", "e.remote", "e.timezone"])
                .distinct(true)
                .leftJoin(Match_1.Match, "m", "e.season = m.event_season AND e.code = m.event_code")
                .leftJoin(`match_score_${season}`, "s", "s.season = m.event_season AND s.event_code = m.event_code AND m.id = s.match_id")
                .where("e.season = :season", { season })
                .andWhere("start < now()")
                .andWhere("start > 'now'::timestamp - '1 month'::interval")
                .andWhere("type IN (:...types)", { types: (0, common_1.getEventTypes)(common_1.EventTypeOption.Competition) })
                .getMany();
        }
        else {
            return data_source_1.DATA_SOURCE.getRepository(Event_1.Event)
                .createQueryBuilder("e")
                .select(["e.season", "e.code", "e.remote", "e.timezone"])
                .distinct(true)
                .where("season = :season", { season })
                .andWhere("start <= (NOW() at time zone timezone)::date")
                .andWhere(`"end" >= (NOW() at time zone timezone)::date`)
                .andWhere("type IN (:...types)", { types: (0, common_1.getEventTypes)(common_1.EventTypeOption.Competition) })
                .getMany();
        }
    });
}
function publishMatchUpdates(matches) {
    let grouped = (0, common_1.groupBy)(matches, (m) => m.eventCode);
    for (let eventCode of Object.keys(grouped)) {
        let eMatches = grouped[eventCode];
        pubsub_1.pubsub.publish((0, pubsub_1.newMatchesKey)(matches[0].eventSeason, eventCode), { newMatches: eMatches });
    }
}
//# sourceMappingURL=load-all-matches.js.map