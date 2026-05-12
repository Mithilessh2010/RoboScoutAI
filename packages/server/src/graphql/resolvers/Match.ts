// @ts-nocheck
import { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { dataLoaderResolverSingle } from "../utils";
import { BoolTy, DateTimeTy, IntTy, StrTy, list, nn, nullTy } from "@ftc-scout/common";
import { Match } from "../../db/schemas/Match";
import { Event } from "../../db/schemas/Event";
import { TournamentLevelGQL } from "./enums";
import { Season } from "@ftc-scout/common";
import { MatchScoresUnionGQL } from "../dyn/dyn-types-schema";
import { frontendMSFromDB } from "../dyn/match-score";
import graphqlFields from "graphql-fields";
import { TeamMatchParticipationGQL } from "./TeamMatchParticipation";
import { EventGQL } from "./Event";

export const MatchGQL: GraphQLObjectType = new GraphQLObjectType({
    name: "Match",
    fields: () => ({
        season: {
            ...IntTy,
            resolve: (m: Match) => m.eventSeason,
        },
        eventCode: StrTy,
        id: IntTy,
        hasBeenPlayed: BoolTy,
        scheduledStartTime: nullTy(DateTimeTy),
        actualStartTime: nullTy(DateTimeTy),
        postResultTime: nullTy(DateTimeTy),
        tournamentLevel: { type: nn(TournamentLevelGQL) },
        series: IntTy,
        matchNum: IntTy,
        description: StrTy,
        createdAt: DateTimeTy,
        updatedAt: DateTimeTy,

        // Must use aware loader
        scores: {
            type: MatchScoresUnionGQL,
            resolve: (m) => frontendMSFromDB(m.scores),
        },
        teams: { type: list(nn(TeamMatchParticipationGQL)) },

        event: {
            type: nn(EventGQL),
            resolve: dataLoaderResolverSingle<Match, Event, { season: Season; code: string }>(
                (m) => ({ season: m.eventSeason, code: m.eventCode }),
                (keys) => Event.find(keys)
            ),
        },
    }),
});

export async function singleSeasonScoreAwareMatchLoader(
    keys: any[],
    info: GraphQLResolveInfo[],
    includeScores = false,
    includeTeams = false
) {
    includeScores ||= info.some((i) => "scores" in graphqlFields(i));
    includeTeams ||= info.some((i) => "teams" in graphqlFields(i));

    // Build query from keys - each key should have { eventSeason, eventCode, id, ...other fields }
    let matches: any[] = [];
    for (let key of keys) {
        let query: any = {};
        for (let [k, v] of Object.entries(key)) {
            if (k === "eventSeason") {
                query.eventSeason = v;
            } else if (k === "eventCode") {
                query.eventCode = v;
            } else {
                query[k] = v;
            }
        }
        let match = await Match.findOne(query);
        if (match) matches.push(match);
    }

    // Note: For includeScores and includeTeams, Mongoose will populate them if they're set up
    // as references or subdocuments in the schema. Otherwise, they need to be fetched separately
    // This is a simplified version - the actual implementation depends on the schema setup

    return matches;
}
