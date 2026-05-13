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
exports.setupRest = void 0;
const Team_1 = require("../db/schemas/Team");
const team_event_participation_1 = require("../db/schemas/dyn/team-event-participation");
const common_1 = require("@ftc-scout/common");
const Award_1 = require("../db/schemas/Award");
const TeamMatchParticipation_1 = require("../db/schemas/TeamMatchParticipation");
const Event_1 = require("../db/schemas/Event");
const luxon_1 = require("luxon");
const Match_1 = require("../db/schemas/Match");
const match_score_1 = require("../graphql/dyn/match-score");
const Team_2 = require("../graphql/resolvers/Team");
const tep_1 = require("../graphql/dyn/tep");
const store_1 = require("../watch-room/store");
const pre = "/rest/v1/";
function isSeason(season) {
    return common_1.ALL_SEASONS.indexOf(season) != -1;
}
function isRegion(region) {
    return !!common_1.RegionOption[region];
}
function isEventType(type) {
    return !!common_1.EventTypeOption[type];
}
function isNumber(num) {
    return !Number.isNaN(+num);
}
function isDate(date) {
    return !!new Date(date);
}
function setupRest(app) {
    app.get(pre + "teams/:number(\\d+)", teamByNumber);
    app.get(pre + "teams/:number(\\d+)/events/:season(\\d+)", teamEvents);
    app.get(pre + "teams/:number(\\d+)/awards", teamAwards);
    app.get(pre + "teams/:number(\\d+)/matches", teamMatches);
    app.get(pre + "teams/:number(\\d+)/quick-stats", teamQuickStats);
    app.get(pre + "teams/search", teamSearch);
    app.get(pre + "events/:season(\\d+)/:code", eventByCode);
    app.get(pre + "events/:season(\\d+)/:code/matches", eventMatches);
    app.get(pre + "events/:season(\\d+)/:code/awards", eventAwards);
    app.get(pre + "events/:season(\\d+)/:code/teams", eventTeams);
    app.get(pre + "events/:season(\\d+)/:code/preview", eventPreview);
    app.get(pre + "events/search/:season(\\d+)", eventSearch);
    app.get(pre + "watch/rooms", watchRoomList);
    app.post(pre + "watch/rooms", watchRoomCreate);
    app.get(pre + "watch/rooms/:roomId", watchRoomGet);
    app.patch(pre + "watch/rooms/:roomId", watchRoomPatch);
    app.delete(pre + "watch/rooms/:roomId", watchRoomDelete);
    app.get(pre + "watch/rooms/:roomId/messages", watchRoomMessages);
    app.post(pre + "watch/rooms/:roomId/messages", watchRoomMessageCreate);
}
exports.setupRest = setupRest;
function watchRoomList(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.send(yield (0, store_1.listWatchRooms)());
    });
}
function watchRoomCreate(req, res) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        if (!((_a = req.body) === null || _a === void 0 ? void 0 : _a.participantId)) {
            res.status(400).send({ error: "participantId is required" });
            return;
        }
        let controlMode = req.body.controlMode === "EVERYONE" ? "EVERYONE" : "HOST_ONLY";
        let room = yield (0, store_1.createWatchRoom)({
            name: req.body.name || "RoboScoutAI Watch Room",
            season: (_b = req.body.season) !== null && _b !== void 0 ? _b : null,
            eventCode: (_c = req.body.eventCode) !== null && _c !== void 0 ? _c : null,
            participantId: req.body.participantId,
            displayName: req.body.displayName || "Host",
            controlMode,
        });
        res.status(201).send(room);
    });
}
function watchRoomGet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let room = yield (0, store_1.getWatchRoom)(req.params.roomId);
        if (!room) {
            res.status(404).send({ error: "Room not found" });
            return;
        }
        res.send(room);
    });
}
function watchRoomPatch(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let room = yield (0, store_1.mutateWatchRoom)(req.params.roomId, (current) => {
            var _a, _b, _c, _d, _e;
            let next = Object.assign(Object.assign({}, current), { name: ((_a = req.body.name) === null || _a === void 0 ? void 0 : _a.trim()) || current.name, season: (_b = req.body.season) !== null && _b !== void 0 ? _b : current.season, eventCode: req.body.eventCode !== undefined ? ((_c = req.body.eventCode) === null || _c === void 0 ? void 0 : _c.trim().toUpperCase()) || null : current.eventCode, hostParticipantId: (_d = req.body.hostParticipantId) !== null && _d !== void 0 ? _d : current.hostParticipantId, controlMode: req.body.controlMode === "EVERYONE" ? "EVERYONE" : req.body.controlMode === "HOST_ONLY" ? "HOST_ONLY" : current.controlMode, layoutPreference: req.body.layoutPreference || current.layoutPreference, focusStreamId: (_e = req.body.focusStreamId) !== null && _e !== void 0 ? _e : current.focusStreamId, streams: req.body.streams ? req.body.streams.map((stream, index) => {
                    var _a;
                    return (Object.assign(Object.assign({}, stream), { position: Number.isFinite(stream.position) ? stream.position : index, embedUrl: (_a = stream.embedUrl) !== null && _a !== void 0 ? _a : null }));
                }) : current.streams, playbackState: req.body.playbackState ? Object.assign(Object.assign({}, current.playbackState), req.body.playbackState) : current.playbackState, participants: req.body.participants || current.participants, createdAt: current.createdAt, updatedAt: current.updatedAt });
            if (req.body.participantId) {
                next = (0, store_1.upsertRoomParticipant)(next, req.body.participantId, req.body.participantId);
            }
            return next;
        });
        if (!room) {
            res.status(404).send({ error: "Room not found" });
            return;
        }
        res.send(room);
    });
}
function watchRoomDelete(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, store_1.deleteWatchRoom)(req.params.roomId);
        res.status(204).end();
    });
}
function watchRoomMessages(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let room = yield (0, store_1.getWatchRoom)(req.params.roomId);
        if (!room) {
            res.status(404).send({ error: "Room not found" });
            return;
        }
        res.send(yield (0, store_1.listWatchRoomMessages)(req.params.roomId));
    });
}
function watchRoomMessageCreate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let room = yield (0, store_1.getWatchRoom)(req.params.roomId);
        if (!room) {
            res.status(404).send({ error: "Room not found" });
            return;
        }
        if (!req.body.participantId || !req.body.message) {
            res.status(400).send({ error: "participantId and message are required" });
            return;
        }
        let message = yield (0, store_1.addWatchRoomMessage)(req.params.roomId, req.body.participantId, req.body.senderName || "Guest", req.body.message);
        res.status(201).send(message);
    });
}
function teamByNumber(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let number = +req.params.number;
        let team = yield Team_1.Team.findOne({ number });
        if (!team) {
            res.status(404).send(`No team with number ${number}.`);
            return;
        }
        res.send(team);
    });
}
function getTeps(season, findOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        let participations = yield team_event_participation_1.TeamEventParticipation[season].find(findOptions);
        let results = [];
        for (let p of participations) {
            if (p.hasStats) {
                results.push({
                    season: p.season,
                    eventCode: p.eventCode,
                    teamNumber: p.teamNumber,
                    isRemote: p.isRemote,
                    stats: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ rank: p.rank, rp: p.rp, tb1: p.tb1 }, ("tb2" in p ? { tb2: p.tb2 } : {})), ("wins" in p ? { wins: p.wins } : {})), ("losses" in p ? { losses: p.losses } : {})), ("ties" in p ? { ties: p.ties } : {})), ("dqs" in p ? { dqs: p.dqs } : {})), { qualMatchesPlayed: p.qualMatchesPlayed, tot: p.tot, avg: p.avg, opr: p.opr, min: p.min, max: p.max, dev: p.dev }),
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                });
            }
            else {
                results.push({
                    season: p.season,
                    eventCode: p.eventCode,
                    teamNumber: p.teamNumber,
                    isRemote: p.isRemote,
                    stats: null,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                });
            }
        }
        return results;
    });
}
function teamEvents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let teamNumber = +req.params.number;
        let season = +req.params.season;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        res.send(yield getTeps(season, { teamNumber }));
    });
}
function teamAwards(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let teamNumber = +req.params.number;
        let season = req.query.season;
        let eventCode = req.query.eventCode;
        if (season && !isSeason(+season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        let awards = yield Award_1.Award.findBy(Object.assign(Object.assign({ teamNumber }, (season ? { season: +season } : {})), (eventCode ? { eventCode } : {})));
        res.send(awards);
    });
}
function teamMatches(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let teamNumber = +req.params.number;
        let season = req.query.season;
        let eventCode = req.query.eventCode;
        if (season && !isSeason(+season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        let tmps = yield TeamMatchParticipation_1.TeamMatchParticipation.findBy(Object.assign(Object.assign({ teamNumber }, (season ? { season: +season } : {})), (eventCode ? { eventCode } : {})));
        res.send(tmps);
    });
}
function teamQuickStats(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let teamNumber = +req.params.number;
        let season = +((_a = req.query.season) !== null && _a !== void 0 ? _a : common_1.CURRENT_SEASON);
        let region = req.query.region;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        if (region && !isRegion(region)) {
            res.status(400).send(`Invalid region ${region}.`);
            return;
        }
        let stats = yield (0, Team_2.getQuickStats)(teamNumber, season, region !== null && region !== void 0 ? region : null);
        if (!stats) {
            res.status(404).send(`Team ${teamNumber} has no stats for ${season}.`);
        }
        else {
            res.send(stats);
        }
    });
}
function teamSearch(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let region = req.query.region;
        let limit = req.query.limit;
        let searchText = req.query.searchText;
        if (region && !isRegion(region)) {
            res.status(400).send(`Invalid region ${region}.`);
            return;
        }
        if (limit && !isNumber(limit)) {
            res.status(400).send(`Invalid limit ${limit}.`);
            return;
        }
        let entities = yield Team_1.Team.find();
        if (region && region != common_1.RegionOption.All) {
            let regionSet = new Set((0, common_1.getRegionCodes)(region));
            let events = yield Event_1.Event.find();
            let allowedEvents = new Set(events.filter((event) => event.regionCode != null && regionSet.has(event.regionCode)).map((event) => `${event.season}:${event.code}`));
            let participations = yield TeamMatchParticipation_1.TeamMatchParticipation.find();
            let allowedTeams = new Set(participations
                .filter((participation) => allowedEvents.has(`${participation.season}:${participation.eventCode}`))
                .map((participation) => participation.teamNumber));
            entities = entities.filter((team) => allowedTeams.has(team.number));
        }
        if (limit && (!searchText || searchText.trim() == "")) {
            entities = entities.slice(0, +limit);
        }
        if (searchText)
            searchText = searchText.trim();
        if (searchText && searchText != "") {
            if (searchText.match(/^\d+$/)) {
                entities = entities
                    .filter((e) => (e.number + "").startsWith(searchText))
                    .sort((a, b) => a.number - b.number);
            }
            else {
                let res = (0, common_1.fuzzySearch)(entities, searchText, limit != undefined ? +limit : undefined, "name", true);
                entities = res.map((d) => d.document);
            }
        }
        res.send(entities);
    });
}
function eventByCode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let season = +req.params.season;
        let code = req.params.code;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        let event = yield Event_1.Event.findOne({ season, code });
        if (!event) {
            res.status(404).send(`No event in season ${season} with code ${code}.`);
            return;
        }
        res.send(Object.assign(Object.assign({}, event), { started: luxon_1.DateTime.fromISO(event.start, { zone: event.timezone }) < luxon_1.DateTime.now(), ongoing: luxon_1.DateTime.fromISO(event.start, { zone: event.timezone }) < luxon_1.DateTime.now() &&
                luxon_1.DateTime.now() < luxon_1.DateTime.fromISO(event.end, { zone: event.timezone }), finished: luxon_1.DateTime.fromISO(event.end, { zone: event.timezone }) < luxon_1.DateTime.now() }));
    });
}
function eventMatches(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let season = +req.params.season;
        let code = req.params.code;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        let event = yield Event_1.Event.findOne({ season, code });
        if (!event) {
            res.status(404).send(`No event in season ${season} with code ${code}.`);
            return;
        }
        let matches = yield Match_1.Match.find({ eventSeason: season, eventCode: code });
        for (let m of matches) {
            m.scores = (0, match_score_1.frontendMSFromDB)(m.scores);
            if (m.scores)
                m.scores.__typename = undefined;
        }
        res.send(matches);
    });
}
function eventAwards(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let season = +req.params.season;
        let eventCode = req.params.code;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        let awards = yield Award_1.Award.findBy({ season, eventCode });
        res.send(awards);
    });
}
function eventTeams(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let season = +req.params.season;
        let eventCode = req.params.code;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        res.send(yield getTeps(season, { eventCode }));
    });
}
function eventSearch(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let season = +req.params.season;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        let region = req.query.region;
        let type = req.query.type;
        let hasMatches = req.query.hasMatches;
        let start = req.query.start;
        let end = req.query.start;
        let limit = req.query.limit;
        let searchText = req.query.searchText;
        if (region && !isRegion(region)) {
            res.status(400).send(`Invalid region ${region}.`);
            return;
        }
        if (type && !isEventType(type)) {
            res.status(400).send(`Invalid event type ${type}.`);
            return;
        }
        if (hasMatches != undefined && hasMatches != "true" && hasMatches != "false") {
            res.status(400).send(`Invalid boolean ${hasMatches} for hasMatches.`);
            return;
        }
        if (start && !isDate(start)) {
            res.status(400).send(`Invalid start date ${start}.`);
            return;
        }
        if (end && !isDate(end)) {
            res.status(400).send(`Invalid end date ${end}.`);
            return;
        }
        if (limit && !isNumber(limit)) {
            res.status(400).send(`Invalid limit ${limit}.`);
            return;
        }
        let entities = yield Event_1.Event.find({ season });
        if (region && region != common_1.RegionOption.All) {
            let regionSet = new Set((0, common_1.getRegionCodes)(region));
            entities = entities.filter((event) => event.regionCode != null && regionSet.has(event.regionCode));
        }
        if (type && type != common_1.EventTypeOption.All) {
            let typeSet = new Set((0, common_1.getEventTypes)(type));
            entities = entities.filter((event) => typeSet.has(event.type));
        }
        if (start) {
            let startDate = new Date(start).toISOString().split("T")[0];
            entities = entities.filter((event) => new Date(event.start).toISOString().split("T")[0] >= startDate);
        }
        if (end) {
            let endDate = new Date(end).toISOString().split("T")[0];
            entities = entities.filter((event) => new Date(event.end).toISOString().split("T")[0] <= endDate);
        }
        if (hasMatches != null) {
            let eventCodesWithMatches = new Set((yield Match_1.Match.find({ eventSeason: season }).distinct("eventCode")));
            entities = entities.filter((event) => eventCodesWithMatches.has(event.code) == (hasMatches == "true"));
        }
        if (searchText && searchText.trim() != "") {
            let res = (0, common_1.fuzzySearch)(entities, searchText, limit != undefined ? +limit : undefined, "name", true);
            entities = res.map((d) => d.document);
        }
        if (limit && (!searchText || searchText.trim() == "")) {
            entities = entities.slice(0, +limit);
        }
        res.send(entities);
    });
}
function eventPreview(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let season = +req.params.season;
        let code = req.params.code;
        if (!isSeason(season)) {
            res.status(400).send(`Invalid season ${season}.`);
            return;
        }
        let event = yield Event_1.Event.findOne({ season, code });
        if (!event) {
            res.status(404).send(`No event in season ${season} with code ${code}.`);
            return;
        }
        if (event.published) {
            res.status(204).send(`Event ${code} in season ${season} has already finished.`);
            return;
        }
        let roster = yield team_event_participation_1.TeamEventParticipation[event.season].find({ season: event.season, eventCode: event.code }, { teamNumber: 1 });
        let teamNumbers = roster.map((r) => r.teamNumber);
        if (!teamNumbers.length) {
            res.status(404).send(`No teams found for event ${event.code} in season ${event.season}.`);
            return;
        }
        let descriptor = common_1.DESCRIPTORS[event.season];
        let getQuickOpr = (t) => {
            var _a, _b, _c, _d, _e, _f;
            let val = descriptor.pensSubtract
                ? (_b = (_a = t.opr) === null || _a === void 0 ? void 0 : _a.totalPoints) !== null && _b !== void 0 ? _b : null
                : (_f = (_d = (_c = t.opr) === null || _c === void 0 ? void 0 : _c.totalPointsNp) !== null && _d !== void 0 ? _d : (_e = t.opr) === null || _e === void 0 ? void 0 : _e.totalPoints) !== null && _f !== void 0 ? _f : null;
            return val == null ? null : +val;
        };
        let candidateStats = yield team_event_participation_1.TeamEventParticipation[event.season].find({
            teamNumber: { $in: teamNumbers },
            isRemote: false,
            hasStats: true,
            season: event.season,
        });
        let bestStats = new Map();
        for (let row of candidateStats) {
            let quick = getQuickOpr(row);
            let eventCode = row.eventCode;
            let existing = bestStats.get(row.teamNumber);
            if (!existing) {
                bestStats.set(row.teamNumber, { row, quick, eventCode });
                continue;
            }
            let existingValue = (_a = existing.quick) !== null && _a !== void 0 ? _a : Number.NEGATIVE_INFINITY;
            let currentValue = quick !== null && quick !== void 0 ? quick : Number.NEGATIVE_INFINITY;
            if (currentValue > existingValue) {
                bestStats.set(row.teamNumber, { row, quick, eventCode });
            }
        }
        let eventCodes = new Set(candidateStats.map((r) => r.eventCode));
        let events = yield Event_1.Event.find({
            season: event.season,
            code: { $in: [...eventCodes] },
        });
        let eventMap = new Map(events.map((e) => [e.code, e]));
        res.send(teamNumbers.map((teamNumber) => {
            var _a, _b, _c;
            let entry = bestStats.get(teamNumber);
            return {
                teamNumber,
                npOpr: (_a = entry === null || entry === void 0 ? void 0 : entry.quick) !== null && _a !== void 0 ? _a : null,
                stats: entry ? (0, tep_1.addTypename)(entry.row) : null,
                event: (_c = eventMap.get((_b = entry === null || entry === void 0 ? void 0 : entry.eventCode) !== null && _b !== void 0 ? _b : "")) !== null && _c !== void 0 ? _c : null,
            };
        }));
    });
}
//# sourceMappingURL=setupRest.js.map