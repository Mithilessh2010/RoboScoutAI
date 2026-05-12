// @ts-nocheck
import { IntTy, Season, StrTy, list, nn } from "@ftc-scout/common";
import { GraphQLObjectType } from "graphql";
import { dataLoaderResolverList, dataLoaderResolverSingle } from "../utils";
import { TeamEventParticipation } from "../../db/schemas/dyn/team-event-participation";
import { Event } from "../../db/schemas/Event";
import { TeamGQL } from "./Team";
import { Team } from "../../db/schemas/Team";
import { AwardGQL, teamAwareAwardLoader } from "./Award";
import { Award } from "../../db/schemas/Award";
import { TeamMatchParticipation } from "../../db/schemas/TeamMatchParticipation";
import { TepStatsUnionGQL } from "../dyn/dyn-types-schema";
import { addTypename } from "../dyn/tep";
import { EventGQL } from "./Event";
import { TeamMatchParticipationGQL } from "./TeamMatchParticipation";

export const TeamEventParticipationGQL = new GraphQLObjectType({
    name: "TeamEventParticipation",
    fields: () => ({
        season: IntTy,
        eventCode: StrTy,
        teamNumber: IntTy,
        stats: {
            type: TepStatsUnionGQL,
            resolve: (tep) => (tep.hasStats ? addTypename(tep) : null),
        },

        event: {
            type: nn(EventGQL),
            resolve: dataLoaderResolverSingle<
                TeamEventParticipation,
                Event,
                { season: Season; code: string }
            >(
                (tep) => ({ season: tep.season, code: tep.eventCode }),
                async (keys) => Event.find(keys)
            ),
        },
        team: {
            type: nn(TeamGQL),
            resolve: dataLoaderResolverSingle<TeamEventParticipation, Team, number>(
                (tep) => tep.teamNumber,
                (keys) => Team.find({ number: { $in: keys } }),
                (k, t) => k == t.number
            ),
        },
        awards: {
            type: list(nn(AwardGQL)),
            resolve: dataLoaderResolverList<
                TeamEventParticipation,
                Award,
                { season: Season; eventCode: string; teamNumber: number }
            >(
                (tep) => ({
                    season: tep.season,
                    eventCode: tep.eventCode,
                    teamNumber: tep.teamNumber,
                }),
                teamAwareAwardLoader
            ),
        },
        matches: {
            type: list(nn(TeamMatchParticipationGQL)),
            resolve: dataLoaderResolverList<
                TeamEventParticipation,
                TeamMatchParticipation,
                { season: Season; eventCode: string; teamNumber: number }
            >(
                (tep) => ({
                    season: tep.season,
                    eventCode: tep.eventCode,
                    teamNumber: tep.teamNumber,
                }),
                (keys) => TeamMatchParticipation.find(keys)
            ),
        },
    }),
});
