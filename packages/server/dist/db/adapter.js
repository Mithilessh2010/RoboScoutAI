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
exports.DBAdapter = void 0;
const Team_1 = require("./schemas/Team");
const Event_1 = require("./schemas/Event");
const Award_1 = require("./schemas/Award");
const Match_1 = require("./schemas/Match");
const TeamMatchParticipation_1 = require("./schemas/TeamMatchParticipation");
exports.DBAdapter = {
    findTeamByNumber(number) {
        return __awaiter(this, void 0, void 0, function* () {
            return Team_1.Team.findOne({ number });
        });
    },
    findTeamsByNumbers(numbers) {
        return __awaiter(this, void 0, void 0, function* () {
            return Team_1.Team.find({ number: { $in: numbers } });
        });
    },
    findAllTeams() {
        return __awaiter(this, void 0, void 0, function* () {
            return Team_1.Team.find();
        });
    },
    upsertTeam(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Team_1.Team.findOneAndUpdate({ number: data.number }, data, {
                upsert: true,
                new: true,
            });
        });
    },
    findEventBySeasonAndCode(season, code) {
        return __awaiter(this, void 0, void 0, function* () {
            return Event_1.Event.findOne({ season, code });
        });
    },
    findEventsBySeason(season) {
        return __awaiter(this, void 0, void 0, function* () {
            return Event_1.Event.find({ season });
        });
    },
    findEventsBySeasonAndCodes(season, codes) {
        return __awaiter(this, void 0, void 0, function* () {
            return Event_1.Event.find({ season, code: { $in: codes } });
        });
    },
    upsertEvent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Event_1.Event.findOneAndUpdate({ season: data.season, code: data.code }, data, { upsert: true, new: true });
        });
    },
    findMatchesByEvent(season, eventCode) {
        return __awaiter(this, void 0, void 0, function* () {
            return Match_1.Match.find({ eventSeason: season, eventCode });
        });
    },
    findMatchByEventAndId(season, eventCode, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Match_1.Match.findOne({ eventSeason: season, eventCode, id });
        });
    },
    upsertMatch(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Match_1.Match.findOneAndUpdate({ eventSeason: data.eventSeason, eventCode: data.eventCode, id: data.id }, data, { upsert: true, new: true });
        });
    },
    findAwardsByEvent(season, eventCode) {
        return __awaiter(this, void 0, void 0, function* () {
            return Award_1.Award.find({ season, eventCode });
        });
    },
    findAwardsByTeam(number, season) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = { teamNumber: number };
            if (season !== undefined)
                query.season = season;
            return Award_1.Award.find(query);
        });
    },
    upsertAward(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return Award_1.Award.findOneAndUpdate({
                season: data.season,
                eventCode: data.eventCode,
                teamNumber: data.teamNumber,
                type: data.type,
                placement: data.placement,
            }, data, { upsert: true, new: true });
        });
    },
    findTeamParticipationInMatch(season, eventCode, matchId, teamNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return TeamMatchParticipation_1.TeamMatchParticipation.findOne({
                season,
                eventCode,
                matchId,
                teamNumber,
            });
        });
    },
    findTeamParticipationsInMatch(season, eventCode, matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            return TeamMatchParticipation_1.TeamMatchParticipation.find({ season, eventCode, matchId });
        });
    },
    upsertTeamParticipation(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return TeamMatchParticipation_1.TeamMatchParticipation.findOneAndUpdate({
                season: data.season,
                eventCode: data.eventCode,
                matchId: data.matchId,
                alliance: data.alliance,
                station: data.station,
            }, data, { upsert: true, new: true });
        });
    },
};
//# sourceMappingURL=adapter.js.map