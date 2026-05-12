// @ts-nocheck
import type { Express, Request, Response } from "express";
import { Team } from "../db/schemas/Team";
import { TeamEventParticipation } from "../db/schemas/dyn/team-event-participation";
import {
    ALL_SEASONS,
    CURRENT_SEASON,
    EventTypeOption,
    RegionOption,
    Season,
    fuzzySearch,
    getEventTypes,
    getRegionCodes,
    DESCRIPTORS,
} from "@ftc-scout/common";
import { Award } from "../db/schemas/Award";
import { TeamMatchParticipation } from "../db/schemas/TeamMatchParticipation";
import { Event } from "../db/schemas/Event";
import { DateTime } from "luxon";
import { Match } from "../db/schemas/Match";
import { frontendMSFromDB } from "../graphql/dyn/match-score";
import { getQuickStats } from "../graphql/resolvers/Team";
import { addTypename } from "../graphql/dyn/tep";
import {
    addWatchRoomMessage,
    createWatchRoom,
    deleteWatchRoom,
    getWatchRoom,
    listWatchRoomMessages,
    listWatchRooms,
    mutateWatchRoom,
    upsertRoomParticipant,
} from "../watch-room/store";
import type { CreateWatchRoomInput, WatchControlMode, WatchRoom } from "../watch-room/types";

const pre = "/rest/v1/";

function isSeason(season: number): season is Season {
    return (ALL_SEASONS as readonly number[]).indexOf(season) != -1;
}

function isRegion(region: string): region is RegionOption {
    return !!(RegionOption as any)[region];
}

function isEventType(type: string): type is EventTypeOption {
    return !!(EventTypeOption as any)[type];
}

function isNumber(num: string) {
    return !Number.isNaN(+num);
}

function isDate(date: string): boolean {
    return !!new Date(date);
}

export function setupRest(app: Express) {
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

async function watchRoomList(_req: Request, res: Response) {
    res.send(await listWatchRooms());
}

async function watchRoomCreate(req: Request<unknown, unknown, Partial<CreateWatchRoomInput>>, res: Response) {
    if (!req.body?.participantId) {
        res.status(400).send({ error: "participantId is required" });
        return;
    }

    let controlMode: WatchControlMode = req.body.controlMode === "EVERYONE" ? "EVERYONE" : "HOST_ONLY";

    let room = await createWatchRoom({
        name: req.body.name || "RoboScoutAI Watch Room",
        season: req.body.season ?? null,
        eventCode: req.body.eventCode ?? null,
        participantId: req.body.participantId,
        displayName: req.body.displayName || "Host",
        controlMode,
    });

    res.status(201).send(room);
}

async function watchRoomGet(req: Request<{ roomId: string }>, res: Response) {
    let room = await getWatchRoom(req.params.roomId);
    if (!room) {
        res.status(404).send({ error: "Room not found" });
        return;
    }

    res.send(room);
}

async function watchRoomPatch(req: Request<{ roomId: string }, unknown, Partial<WatchRoom> & { participantId?: string }>, res: Response) {
    let room = await mutateWatchRoom(req.params.roomId, (current) => {
        let next: WatchRoom = {
            ...current,
            name: req.body.name?.trim() || current.name,
            season: req.body.season ?? current.season,
            eventCode: req.body.eventCode !== undefined ? req.body.eventCode?.trim().toUpperCase() || null : current.eventCode,
            hostParticipantId: req.body.hostParticipantId ?? current.hostParticipantId,
            controlMode: req.body.controlMode === "EVERYONE" ? "EVERYONE" : req.body.controlMode === "HOST_ONLY" ? "HOST_ONLY" : current.controlMode,
            layoutPreference: req.body.layoutPreference || current.layoutPreference,
            focusStreamId: req.body.focusStreamId ?? current.focusStreamId,
            streams: req.body.streams ? req.body.streams.map((stream, index) => ({
                ...stream,
                position: Number.isFinite(stream.position) ? stream.position : index,
                embedUrl: stream.embedUrl ?? null,
            })) : current.streams,
            playbackState: req.body.playbackState ? { ...current.playbackState, ...req.body.playbackState } : current.playbackState,
            participants: req.body.participants || current.participants,
            createdAt: current.createdAt,
            updatedAt: current.updatedAt,
        };

        if (req.body.participantId) {
            next = upsertRoomParticipant(next, req.body.participantId, req.body.participantId);
        }

        return next;
    });

    if (!room) {
        res.status(404).send({ error: "Room not found" });
        return;
    }

    res.send(room);
}

async function watchRoomDelete(req: Request<{ roomId: string }>, res: Response) {
    await deleteWatchRoom(req.params.roomId);
    res.status(204).end();
}

async function watchRoomMessages(req: Request<{ roomId: string }>, res: Response) {
    let room = await getWatchRoom(req.params.roomId);
    if (!room) {
        res.status(404).send({ error: "Room not found" });
        return;
    }

    res.send(await listWatchRoomMessages(req.params.roomId));
}

async function watchRoomMessageCreate(req: Request<{ roomId: string }, unknown, { participantId?: string; senderName?: string; message?: string }>, res: Response) {
    let room = await getWatchRoom(req.params.roomId);
    if (!room) {
        res.status(404).send({ error: "Room not found" });
        return;
    }

    if (!req.body.participantId || !req.body.message) {
        res.status(400).send({ error: "participantId and message are required" });
        return;
    }

    let message = await addWatchRoomMessage(req.params.roomId, req.body.participantId, req.body.senderName || "Guest", req.body.message);
    res.status(201).send(message);
}

async function teamByNumber(req: Request<{ number: string }>, res: Response) {
    let number = +req.params.number;
    let team = await Team.findOne({ number });

    if (!team) {
        res.status(404).send(`No team with number ${number}.`);
        return;
    }

    res.send(team);
}

async function getTeps(
    season: Season,
    findOptions: Record<string, any>
): Promise<any> {
    let participations = await TeamEventParticipation[season].find(findOptions);
    let results = [];

    for (let p of participations) {
        if (p.hasStats) {
            results.push({
                season: p.season,
                eventCode: p.eventCode,
                teamNumber: p.teamNumber,
                isRemote: p.isRemote,
                stats: {
                    rank: p.rank,
                    rp: p.rp,
                    tb1: p.tb1,
                    ...("tb2" in p ? { tb2: p.tb2 } : {}),
                    ...("wins" in p ? { wins: p.wins } : {}),
                    ...("losses" in p ? { losses: p.losses } : {}),
                    ...("ties" in p ? { ties: p.ties } : {}),
                    ...("dqs" in p ? { dqs: p.dqs } : {}),
                    qualMatchesPlayed: p.qualMatchesPlayed,
                    tot: p.tot,
                    avg: p.avg,
                    opr: p.opr,
                    min: p.min,
                    max: p.max,
                    dev: p.dev,
                },
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            });
        } else {
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
}

async function teamEvents(req: Request<{ number: string; season: string }>, res: Response) {
    let teamNumber = +req.params.number;
    let season = +req.params.season;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    res.send(await getTeps(season, { teamNumber }));
}

async function teamAwards(req: Request<{ number: string }>, res: Response) {
    let teamNumber = +req.params.number;
    let season = req.query.season as string | undefined;
    let eventCode = req.query.eventCode as string | undefined;

    if (season && !isSeason(+season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    let awards = await Award.findBy({
        teamNumber,
        ...(season ? { season: +season as Season } : {}),
        ...(eventCode ? { eventCode } : {}),
    });

    res.send(awards);
}

async function teamMatches(req: Request<{ number: string }>, res: Response) {
    let teamNumber = +req.params.number;
    let season = req.query.season as string | undefined;
    let eventCode = req.query.eventCode as string | undefined;

    if (season && !isSeason(+season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    let tmps = await TeamMatchParticipation.findBy({
        teamNumber,
        ...(season ? { season: +season as Season } : {}),
        ...(eventCode ? { eventCode } : {}),
    });

    res.send(tmps);
}

async function teamQuickStats(req: Request<{ number: string }>, res: Response) {
    let teamNumber = +req.params.number;
    let season = +((req.query.season as string | undefined) ?? CURRENT_SEASON);
    let region = req.query.region as RegionOption | undefined;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    if (region && !isRegion(region)) {
        res.status(400).send(`Invalid region ${region}.`);
        return;
    }

    let stats = await getQuickStats(teamNumber, season, region ?? null);

    if (!stats) {
        res.status(404).send(`Team ${teamNumber} has no stats for ${season}.`);
    } else {
        res.send(stats);
    }
}

async function teamSearch(req: Request, res: Response) {
    let region = req.query.region as RegionOption | undefined;
    let limit = req.query.limit as string | undefined;
    let searchText = req.query.searchText as string | undefined;

    if (region && !isRegion(region)) {
        res.status(400).send(`Invalid region ${region}.`);
        return;
    }

    if (limit && !isNumber(limit)) {
        res.status(400).send(`Invalid limit ${limit}.`);
        return;
    }

    let entities = await Team.find();

    if (region && region != RegionOption.All) {
        let regionSet = new Set(getRegionCodes(region));
        let events = await Event.find();
        let allowedEvents = new Set(
            events.filter((event) => event.regionCode != null && regionSet.has(event.regionCode)).map((event) => `${event.season}:${event.code}`)
        );
        let participations = await TeamMatchParticipation.find();
        let allowedTeams = new Set(
            participations
                .filter((participation) => allowedEvents.has(`${participation.season}:${participation.eventCode}`))
                .map((participation) => participation.teamNumber)
        );
        entities = entities.filter((team) => allowedTeams.has(team.number));
    }

    if (limit && (!searchText || searchText.trim() == "")) {
        entities = entities.slice(0, +limit);
    }

    if (searchText) searchText = searchText.trim();
    if (searchText && searchText != "") {
        if (searchText.match(/^\d+$/)) {
            entities = entities
                .filter((e) => (e.number + "").startsWith(searchText!))
                .sort((a, b) => a.number - b.number);
        } else {
            let res = fuzzySearch(
                entities,
                searchText,
                limit != undefined ? +limit : undefined,
                "name",
                true
            );
            entities = res.map((d) => d.document);
        }
    }

    res.send(entities);
}

async function eventByCode(req: Request<{ season: string; code: string }>, res: Response) {
    let season = +req.params.season;
    let code = req.params.code;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    let event = await Event.findOne({ season, code });

    if (!event) {
        res.status(404).send(`No event in season ${season} with code ${code}.`);
        return;
    }

    res.send({
        ...event,
        started: DateTime.fromISO(event.start as any, { zone: event.timezone }) < DateTime.now(),
        ongoing:
            DateTime.fromISO(event.start as any, { zone: event.timezone }) < DateTime.now() &&
            DateTime.now() < DateTime.fromISO(event.end as any, { zone: event.timezone }),
        finished: DateTime.fromISO(event.end as any, { zone: event.timezone }) < DateTime.now(),
    });
}

async function eventMatches(req: Request<{ season: string; code: string }>, res: Response) {
    let season = +req.params.season;
    let code = req.params.code;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    let event = await Event.findOne({ season, code });

    if (!event) {
        res.status(404).send(`No event in season ${season} with code ${code}.`);
        return;
    }

    let matches = await Match.find({ eventSeason: season, eventCode: code });

    for (let m of matches) {
        (m as any).scores = frontendMSFromDB(m.scores);
        if (m.scores) (m as any).scores.__typename = undefined;
    }

    res.send(matches);
}

async function eventAwards(req: Request<{ season: string; code: string }>, res: Response) {
    let season = +req.params.season;
    let eventCode = req.params.code;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    let awards = await Award.findBy({ season, eventCode });

    res.send(awards);
}

async function eventTeams(req: Request<{ season: string; code: string }>, res: Response) {
    let season = +req.params.season;
    let eventCode = req.params.code;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    res.send(await getTeps(season, { eventCode }));
}

async function eventSearch(req: Request<{ season: string }>, res: Response) {
    let season = +req.params.season;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    let region = req.query.region as RegionOption | undefined;
    let type = req.query.type as EventTypeOption | undefined;
    let hasMatches = req.query.hasMatches;
    let start = req.query.start as string;
    let end = req.query.start as string;
    let limit = req.query.limit as string | undefined;
    let searchText = req.query.searchText as string | undefined;

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

    let entities = await Event.find({ season });

    if (region && region != RegionOption.All) {
        let regionSet = new Set(getRegionCodes(region));
        entities = entities.filter((event) => event.regionCode != null && regionSet.has(event.regionCode));
    }

    if (type && type != EventTypeOption.All) {
        let typeSet = new Set(getEventTypes(type));
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
        let eventCodesWithMatches = new Set(
            (await Match.find({ eventSeason: season }).distinct("eventCode")) as string[]
        );
        entities = entities.filter((event) => eventCodesWithMatches.has(event.code) == (hasMatches == "true"));
    }

    if (searchText && searchText.trim() != "") {
        let res = fuzzySearch(
            entities,
            searchText,
            limit != undefined ? +limit : undefined,
            "name",
            true
        );
        entities = res.map((d) => d.document);
    }

    if (limit && (!searchText || searchText.trim() == "")) {
        entities = entities.slice(0, +limit);
    }

    res.send(entities);
}

async function eventPreview(req: Request<{ season: string; code: string }>, res: Response) {
    let season = +req.params.season;
    let code = req.params.code;

    if (!isSeason(season)) {
        res.status(400).send(`Invalid season ${season}.`);
        return;
    }

    let event = await Event.findOne({ season, code });

    if (!event) {
        res.status(404).send(`No event in season ${season} with code ${code}.`);
        return;
    }

    if (event.published) {
        res.status(204).send(`Event ${code} in season ${season} has already finished.`);
        return;
    }

    let roster = await TeamEventParticipation[event.season].find(
        { season: event.season, eventCode: event.code },
        { teamNumber: 1 }
    );
    let teamNumbers = roster.map((r) => r.teamNumber);
    if (!teamNumbers.length) {
        res.status(404).send(`No teams found for event ${event.code} in season ${event.season}.`);
        return;
    }

    let descriptor = DESCRIPTORS[event.season];
    let getQuickOpr = (t: TeamEventParticipation) => {
        let val = descriptor.pensSubtract
            ? t.opr?.totalPoints ?? null
            : t.opr?.totalPointsNp ?? t.opr?.totalPoints ?? null;
        return val == null ? null : +val;
    };

    let candidateStats = await TeamEventParticipation[event.season].find({
        teamNumber: { $in: teamNumbers },
        isRemote: false,
        hasStats: true,
        season: event.season,
    });

    let bestStats = new Map<
        number,
        { row: TeamEventParticipation; quick: number | null; eventCode: string }
    >();
    for (let row of candidateStats) {
        let quick = getQuickOpr(row);
        let eventCode = row.eventCode;
        let existing = bestStats.get(row.teamNumber);
        if (!existing) {
            bestStats.set(row.teamNumber, { row, quick, eventCode });
            continue;
        }

        let existingValue = existing.quick ?? Number.NEGATIVE_INFINITY;
        let currentValue = quick ?? Number.NEGATIVE_INFINITY;
        if (currentValue > existingValue) {
            bestStats.set(row.teamNumber, { row, quick, eventCode });
        }
    }

    let eventCodes = new Set(candidateStats.map((r) => r.eventCode));
    let events = await Event.find({
        season: event.season,
        code: { $in: [...eventCodes] },
    });
    let eventMap = new Map(events.map((e) => [e.code, e]));

    res.send(
        teamNumbers.map((teamNumber) => {
            let entry = bestStats.get(teamNumber);
            return {
                teamNumber,
                npOpr: entry?.quick ?? null,
                stats: entry ? addTypename(entry.row) : null,
                event: eventMap.get(entry?.eventCode ?? "") ?? null,
            };
        })
    );
}
