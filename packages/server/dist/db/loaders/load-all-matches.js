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
function loadAllMatches(season, loadType, eventCodes) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading matches for season ${season}. (${loadType})`);
        let events = yield eventsToFetch(season, loadType, eventCodes);
        console.info(`Got ${events.length} events to fetch.`);
        let failedEvents = 0;
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
                allDbMatches = uniqueBy(allDbMatches, (m) => `${m.eventSeason}:${m.eventCode}:${m.id}`);
                allDbScores = uniqueBy(allDbScores, (s) => `${s.season}:${s.eventCode}:${s.matchId}:${s.alliance}`);
                allDbTmps = uniqueBy(allDbTmps, (t) => `${t.season}:${t.eventCode}:${t.matchId}:${t.alliance}:${t.station}`);
                let allDbTeps = (0, common_1.calculateTeamEventStats)(season, event.code, event.remote, allDbMatches.map((m) => m.toFrontend()), allTeams);
                allDbTeps = uniqueBy(allDbTeps, (t) => `${t.season}:${t.eventCode}:${t.teamNumber}`);
                yield data_source_1.DATA_SOURCE.transaction((em) => __awaiter(this, void 0, void 0, function* () {
                    yield em.query(`DELETE FROM tep_${season} WHERE season = $1 AND event_code = $2`, [
                        season,
                        event.code,
                    ]);
                    yield em.query(`DELETE FROM match_score_${season} WHERE season = $1 AND event_code = $2`, [season, event.code]);
                    yield em.query(`DELETE FROM team_match_participation WHERE season = $1 AND event_code = $2`, [season, event.code]);
                    yield em.query(`DELETE FROM match WHERE event_season = $1 AND event_code = $2`, [season, event.code]);
                    if (allDbMatches.length) {
                        yield em.upsert(Match_1.Match, allDbMatches, ["eventSeason", "eventCode", "id"]);
                    }
                    if (allDbTmps.length) {
                        yield em.upsert(TeamMatchParticipation_1.TeamMatchParticipation, allDbTmps, [
                            "season",
                            "eventCode",
                            "matchId",
                            "alliance",
                            "station",
                        ]);
                    }
                    if (allDbScores.length) {
                        yield em
                            .getRepository(match_score_1.MatchScoreSchemas[season])
                            .upsert(allDbScores, ["season", "eventCode", "matchId", "alliance"]);
                    }
                    if (allDbTeps.length) {
                        yield em
                            .getRepository(team_event_participation_1.TeamEventParticipationSchemas[season])
                            .upsert(allDbTeps, ["season", "eventCode", "teamNumber"]);
                    }
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
                failedEvents += 1;
                console.error(`Loaded ${i + 1}/${events.length} !!! ERROR !!!`);
                console.error(e);
            }
        }
        if (loadType == watch_1.LoadType.Full && !(eventCodes === null || eventCodes === void 0 ? void 0 : eventCodes.length) && failedEvents == 0) {
            yield DataHasBeenLoaded_1.DataHasBeenLoaded.create({
                season,
                matches: true,
            }).save();
        }
        else if (failedEvents > 0) {
            console.error(`Skipped marking season ${season} matches loaded; ${failedEvents} events failed.`);
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
function eventsToFetch(season, loadType, eventCodes) {
    return __awaiter(this, void 0, void 0, function* () {
        if (eventCodes === null || eventCodes === void 0 ? void 0 : eventCodes.length) {
            return data_source_1.DATA_SOURCE.getRepository(Event_1.Event)
                .createQueryBuilder("e")
                .select(["e.season", "e.code", "e.remote", "e.timezone"])
                .where("e.season = :season", { season })
                .andWhere("e.code IN (:...eventCodes)", { eventCodes })
                .getMany();
        }
        let loaded = yield DataHasBeenLoaded_1.DataHasBeenLoaded.matchesHaveBeenLoaded(season);
        if (!loaded && loadType == watch_1.LoadType.Full) {
            return data_source_1.DATA_SOURCE.getRepository(Event_1.Event)
                .createQueryBuilder("e")
                .select(["e.season", "e.code", "e.remote", "e.timezone"])
                .leftJoin(`tep_${season}`, "tep", "e.season = tep.season AND e.code = tep.event_code")
                .where("e.season = :season", { season })
                .andWhere("e.type IN (:...types)", { types: (0, common_1.getEventTypes)(common_1.EventTypeOption.Competition) })
                .andWhere("tep.event_code IS NULL")
                .getMany();
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
function uniqueBy(items, key) {
    return [...new Map(items.map((item) => [key(item), item])).values()];
}
//# sourceMappingURL=load-all-matches.js.map