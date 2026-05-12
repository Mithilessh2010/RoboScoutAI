import { GraphQLFieldConfig, GraphQLObjectType } from "graphql";
import { dataLoaderResolverList, dataLoaderResolverSingle } from "../utils";
import { EventTypeGQL, EventTypeOptionGQL, RegionOptionGQL } from "./enums";
import { AwardGQL, teamAwareAwardLoader } from "./Award";
import { Event } from "../../db/schemas/Event";
import { Award } from "../../db/schemas/Award";
import {
    BoolTy,
    DateTimeTy,
    DateTy,
    EventTypeOption,
    FloatTy,
    IntTy,
    RegionOption,
    Season,
    StrTy,
    DESCRIPTORS,
    fuzzySearch,
    getEventTypes,
    getRegionCodes,
    groupBy,
    list,
    listTy,
    nn,
    nullTy,
    wr,
} from "@ftc-scout/common";
import { TeamMatchParticipationGQL } from "./TeamMatchParticipation";
import { TeamMatchParticipation } from "../../db/schemas/TeamMatchParticipation";
import { MatchGQL, singleSeasonScoreAwareMatchLoader } from "./Match";
import { Match } from "../../db/schemas/Match";
import { TeamEventParticipationGQL } from "./TeamEventParticipation";
import { TeamEventParticipation } from "../../db/schemas/dyn/team-event-participation";
import { LocationGQL } from "../objs/Location";
import { DateTime } from "luxon";
import { newMatchesKey, pubsub } from "./pubsub";
import { TepStatsUnionGQL } from "../dyn/dyn-types-schema";
import { addTypename } from "../dyn/tep";

export const EventGQL: GraphQLObjectType = new GraphQLObjectType({
    name: "Event",
    fields: () => ({
        season: IntTy,
        code: StrTy,
        divisionCode: nullTy(StrTy),
        name: StrTy,
        remote: BoolTy,
        hybrid: BoolTy,
        fieldCount: IntTy,
        published: BoolTy,
        type: { type: nn(EventTypeGQL) },
        regionCode: nullTy(StrTy),
        leagueCode: nullTy(StrTy),
        districtCode: nullTy(StrTy),
        address: nullTy(StrTy),
        location: {
            type: nn(LocationGQL),
            resolve: (e) =>
                !!e ? { venue: e.venue, city: e.city, state: e.state, country: e.country } : null,
        },
        website: nullTy(StrTy),
        liveStreamURL: nullTy(StrTy),
        livestreamsByDay: {
            type: list(nn(EventLivestreamDayGQL)),
            resolve: (e) => {
                if (
                    e.livestreamsByDay &&
                    Array.isArray(e.livestreamsByDay) &&
                    e.livestreamsByDay.length > 0
                ) {
                    return e.livestreamsByDay.map((ls) => ({
                        day: DateTime.fromISO(ls.day as any).toJSDate(),
                        liveStreamURL: ls.liveStreamURL,
                        webcasts: ls.webcasts ?? [],
                    }));
                }

                if (e.liveStreamURL) {
                    for (let day of [e.start, e.end]) {
                        if (day) {
                            return [
                                {
                                    day,
                                    liveStreamURL: e.liveStreamURL,
                                    webcasts: e.webcasts,
                                    label: null,
                                },
                            ];
                        }
                    }
                }

                return [];
            },
        },
        webcasts: listTy(StrTy),
        timezone: StrTy,
        start: DateTy,
        end: DateTy,
        createdAt: DateTimeTy,
        updatedAt: DateTimeTy,

        started: {
            ...BoolTy,
            resolve: (e) => DateTime.fromISO(e.start as any, { zone: e.timezone }) < DateTime.now(),
        },
        ongoing: {
            ...BoolTy,
            resolve: (e) =>
                DateTime.fromISO(e.start as any, { zone: e.timezone }) < DateTime.now() &&
                DateTime.now() < DateTime.fromISO(e.end as any, { zone: e.timezone }).endOf("day"),
        },
        finished: {
            ...BoolTy,
            resolve: (e) =>
                DateTime.fromISO(e.end as any, { zone: e.timezone }).endOf("day") < DateTime.now(),
        },

        relatedEvents: {
            type: list(nn(EventGQL)),
            resolve: async (e) => {
                const query: any = { season: e.season, code: { $ne: e.code } };
                if (e.divisionCode) {
                    query.$or = [
                        { code: e.divisionCode },
                        { divisionCode: e.divisionCode },
                        { divisionCode: e.code }
                    ];
                } else {
                    query.divisionCode = e.code;
                }
                return Event.find(query);
            },
        },

        awards: {
            type: list(nn(AwardGQL)),
            resolve: dataLoaderResolverList<Event, Award, { season: Season; eventCode: string }>(
                (event) => ({ season: event.season, eventCode: event.code }),
                teamAwareAwardLoader
            ),
        },
        teams: {
            type: list(nn(TeamEventParticipationGQL)),
            resolve: dataLoaderResolverList<
                Event,
                TeamEventParticipation,
                { season: Season; eventCode: string }
            >(
                (event) => ({ season: event.season, eventCode: event.code }),
                async (keys) => {
                    let groups = groupBy(keys, (k) => k.season);
                    let qs = Object.entries(groups).map(([season, k]) =>
                        TeamEventParticipation[+season as Season].find({ where: k })
                    );
                    return (await Promise.all(qs)).flat();
                }
            ),
        },
        teamMatches: {
            type: list(nn(TeamMatchParticipationGQL)),
            args: { teamNumber: nullTy(IntTy) },
            resolve: dataLoaderResolverList<
                Event,
                TeamMatchParticipation,
                { season: Season; eventCode: string; teamNumber?: number },
                { teamNumber: number }
            >(
                (e, { teamNumber }) =>
                    teamNumber != null
                        ? { season: e.season, eventCode: e.code, teamNumber }
                        : { season: e.season, eventCode: e.code },
                (keys) => TeamMatchParticipation.find({ where: keys })
            ),
        },
        hasMatches: {
            ...BoolTy,
            resolve: async (
                e //("hasMatches" in e ? e.hasMatches : false),
            ) =>
                "hasMatches" in e
                    ? e.hasMatches
                    : (
                          await DATA_SOURCE.getRepository(Event)
                              .createQueryBuilder("e")
                              .distinctOn(["code"])
                              .addSelect("coalesce(m.has_been_played, false)", "has_matches")
                              .leftJoin(
                                  Match,
                                  "m",
                                  "e.season = m.event_season AND e.code = m.event_code"
                              )
                              .where("season = :season", { season: e.season })
                              .andWhere("code = :code", { code: e.code })
                              .getRawOne()
                      ).has_matches,
        },
        matches: {
            type: list(nn(MatchGQL)),
            resolve: dataLoaderResolverList<
                Event,
                Match,
                { eventSeason: Season; eventCode: string; id?: number },
                { id: number | null }
            >(
                (e, { id }) =>
                    id != null
                        ? { eventSeason: e.season, eventCode: e.code, id }
                        : { eventSeason: e.season, eventCode: e.code },
                singleSeasonScoreAwareMatchLoader
            ),
        },
        previewStats: {
            ...nullTy(wr(list(nn(EventPreviewStatGQL)))),
            resolve: async (event) => {
                if (event.published) {
                    return null;
                }

                let roster = await TeamEventParticipation[event.season].find(
                    { season: event.season, eventCode: event.code },
                    { select: ["teamNumber"] }
                );
                let teamNumbers = roster.map((r) => r.teamNumber);
                if (!teamNumbers.length) return [];

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

                return teamNumbers.map((teamNumber) => {
                    let entry = bestStats.get(teamNumber);
                    return {
                        teamNumber,
                        npOpr: entry?.quick ?? null,
                        stats: entry ? addTypename(entry.row) : null,
                        event: eventMap.get(entry?.eventCode ?? "") ?? null,
                    };
                });
            },
        },
    }),
});

const EventPreviewStatGQL = new GraphQLObjectType({
    name: "EventPreviewStat",
    fields: {
        teamNumber: IntTy,
        npOpr: nullTy(FloatTy),
        stats: { type: TepStatsUnionGQL },
        event: { type: EventGQL },
    },
});

const EventLivestreamDayGQL: GraphQLObjectType = new GraphQLObjectType({
    name: "EventLivestreamDay",
    fields: {
        day: DateTy,
        liveStreamURL: nullTy(StrTy),
        webcasts: listTy(StrTy),
    },
});

export const EventQueries: Record<string, GraphQLFieldConfig<any, any>> = {
    eventByCode: {
        type: EventGQL,
        args: { season: IntTy, code: StrTy },
        resolve: dataLoaderResolverSingle<
            {},
            Event,
            { season: Season; code: string },
            { season: Season; code: string }
        >(
            (_, a) => a,
            (keys) => Event.find(keys)
        ),
    },

    eventsSearch: {
        type: list(nn(EventGQL)),
        args: {
            season: IntTy,
            region: { type: RegionOptionGQL },
            type: { type: EventTypeOptionGQL },
            hasMatches: nullTy(BoolTy),
            start: nullTy(DateTy),
            end: nullTy(DateTy),
            limit: nullTy(IntTy),
            searchText: nullTy(StrTy),
        },
        resolve: async (
            _,
            {
                season,
                region,
                type,
                hasMatches,
                start,
                end,
                limit,
                searchText,
            }: {
                season: Season;
                region: RegionOption | null;
                type: EventTypeOption | null;
                hasMatches: boolean | null;
                start: Date | null;
                end: Date | null;
                limit: number | null;
                searchText: string | null;
            }
        ) => {
            let query: any = { season };

            if (region && region != RegionOption.All) {
                query.regionCode = { $in: getRegionCodes(region) };
            }

            if (type && type != EventTypeOption.All) {
                query.type = { $in: getEventTypes(type) };
            }

            if (start) {
                query.start = { $gte: new Date(start.toISOString().split("T")[0]) };
            }

            if (end) {
                query.end = { $lte: new Date(end.toISOString().split("T")[0]) };
            }

            let options: any = {};
            if (limit && (!searchText || searchText.trim() == "")) {
                options.limit = limit;
            }

            let entities = await Event.find(query, {}, options);

            // Add hasMatches flag
            for (let entity of entities) {
                const match = await Match.findOne({
                    eventSeason: entity.season,
                    eventCode: entity.code,
                    hasBeenPlayed: true,
                });
                (entity as any).hasMatches = !!match;
            }

            if (hasMatches != null) {
                entities = entities.filter((e) => (e as any).hasMatches == hasMatches);
            }

            if (searchText && searchText.trim() != "") {
                let res = fuzzySearch(entities, searchText, limit ?? undefined, "name", true);
                entities = res.map((d) => d.document);
            }

            return entities;
        },
    },
};

export const EventSubscriptions: Record<string, GraphQLFieldConfig<any, any>> = {
    newMatches: {
        type: list(nn(MatchGQL)).ofType,
        args: { season: IntTy, code: StrTy },
        subscribe: (_, { season, code }: { season: Season; code: string }) =>
            pubsub.asyncIterator(newMatchesKey(season, code)),
    },
};
