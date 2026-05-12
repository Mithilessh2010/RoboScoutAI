import {
    DateTimeTy,
    EventTypeOption,
    IntTy,
    Season,
    getEventTypes,
    list,
    nn,
    nullTy,
} from "@ftc-scout/common";
import { GraphQLFieldConfig } from "graphql";
import { TeamEventParticipation } from "../../db/schemas/dyn/team-event-participation";
import { Match } from "../../db/schemas/Match";
import { EventGQL } from "./Event";
import { Event } from "../../db/schemas/Event";
import { MatchGQL } from "./Match";
import { MatchScore } from "../../db/schemas/dyn/match-score";
import { EventTypeOptionGQL } from "./enums";

export const HomeQueries: Record<string, GraphQLFieldConfig<any, any>> = {
    activeTeamsCount: {
        ...IntTy,
        args: { season: IntTy },
        resolve: async (_, { season }: { season: number }) => {
            let tep = TeamEventParticipation[season as Season];
            if (!tep) return 0;

            let teams = await tep.distinct("teamNumber", {});
            return teams.length;
        },
    },

    matchesPlayedCount: {
        ...IntTy,
        args: { season: IntTy },
        resolve: async (_, { season }: { season: number }) => {
            return await Match.countDocuments({
                eventSeason: season,
                hasBeenPlayed: true,
            });
        },
    },

    eventsOnDate: {
        type: list(nn(EventGQL)),
        args: { date: nullTy(DateTimeTy), type: { type: EventTypeOptionGQL } },
        resolve: async (_, { date, type }: { date: Date; type: EventTypeOption }) => {
            let query: any = {};
            const queryDate = date ? new Date(date.toISOString().split("T")[0]) : new Date();

            query.$and = [
                { start: { $lte: queryDate } },
                { end: { $gte: queryDate } },
            ];

            if (type && type != EventTypeOption.All) {
                query.type = { $in: getEventTypes(type) };
            }

            return Event.find(query).sort({ start: 1, name: -1 });
        },
    },

    tradWorldRecord: {
        type: nn(MatchGQL),
        args: { season: IntTy },
        resolve: async (_, { season }: { season: number }) =>
            getWorldRecordMatch(season, false),
    },

    tradWorldRecordWithPenalties: {
        type: nn(MatchGQL),
        args: { season: IntTy },
        resolve: async (_, { season }: { season: number }) =>
            getWorldRecordMatch(season, true),
    },
};

async function getWorldRecordMatch(
    season: number,
    includePenalties: boolean
) {
    let ms = MatchScore[season as Season];
    if (!ms) throw "Use a valid season";

    // Find the match with the highest score
    const sortField = includePenalties ? "totalPoints" : "totalPointsNp";
    let match = await Match.findOne({
        eventSeason: season,
        hasBeenPlayed: true,
    })
        .sort({ [sortField]: -1 })
        .lean();

    if (!match) throw "No match found for world record";

    // Get the full match with scores and teams
    let fullMatch = await Match.findOne({
        eventSeason: match.eventSeason,
        eventCode: match.eventCode,
        id: match.id,
    });

    return fullMatch;
}
