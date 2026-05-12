/**
 * MongoDB Query Adapter
 * Provides helper functions to replace TypeORM QueryBuilder patterns
 */
import { Team } from "./schemas/Team";
import { Event } from "./schemas/Event";
import { Award } from "./schemas/Award";
import { Match } from "./schemas/Match";
import { TeamMatchParticipation } from "./schemas/TeamMatchParticipation";

export const DBAdapter = {
    // Team queries
    async findTeamByNumber(number: number) {
        return Team.findOne({ number });
    },

    async findTeamsByNumbers(numbers: number[]) {
        return Team.find({ number: { $in: numbers } });
    },

    async findAllTeams() {
        return Team.find();
    },

    async upsertTeam(data: any) {
        return Team.findOneAndUpdate({ number: data.number }, data, {
            upsert: true,
            new: true,
        });
    },

    // Event queries
    async findEventBySeasonAndCode(season: number, code: string) {
        return Event.findOne({ season, code });
    },

    async findEventsBySeason(season: number) {
        return Event.find({ season });
    },

    async findEventsBySeasonAndCodes(season: number, codes: string[]) {
        return Event.find({ season, code: { $in: codes } });
    },

    async upsertEvent(data: any) {
        return Event.findOneAndUpdate(
            { season: data.season, code: data.code },
            data,
            { upsert: true, new: true }
        );
    },

    // Match queries
    async findMatchesByEvent(season: number, eventCode: string) {
        return Match.find({ eventSeason: season, eventCode });
    },

    async findMatchByEventAndId(season: number, eventCode: string, id: number) {
        return Match.findOne({ eventSeason: season, eventCode, id });
    },

    async upsertMatch(data: any) {
        return Match.findOneAndUpdate(
            { eventSeason: data.eventSeason, eventCode: data.eventCode, id: data.id },
            data,
            { upsert: true, new: true }
        );
    },

    // Award queries
    async findAwardsByEvent(season: number, eventCode: string) {
        return Award.find({ season, eventCode });
    },

    async findAwardsByTeam(number: number, season?: number) {
        const query: any = { teamNumber: number };
        if (season !== undefined) query.season = season;
        return Award.find(query);
    },

    async upsertAward(data: any) {
        return Award.findOneAndUpdate(
            {
                season: data.season,
                eventCode: data.eventCode,
                teamNumber: data.teamNumber,
                type: data.type,
                placement: data.placement,
            },
            data,
            { upsert: true, new: true }
        );
    },

    // TeamMatchParticipation queries
    async findTeamParticipationInMatch(
        season: number,
        eventCode: string,
        matchId: number,
        teamNumber: number
    ) {
        return TeamMatchParticipation.findOne({
            season,
            eventCode,
            matchId,
            teamNumber,
        });
    },

    async findTeamParticipationsInMatch(season: number, eventCode: string, matchId: number) {
        return TeamMatchParticipation.find({ season, eventCode, matchId });
    },

    async upsertTeamParticipation(data: any) {
        return TeamMatchParticipation.findOneAndUpdate(
            {
                season: data.season,
                eventCode: data.eventCode,
                matchId: data.matchId,
                alliance: data.alliance,
                station: data.station,
            },
            data,
            { upsert: true, new: true }
        );
    },
};
