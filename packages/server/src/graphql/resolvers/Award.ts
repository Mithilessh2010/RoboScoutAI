// @ts-nocheck
import { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { dataLoaderResolverSingle } from "../utils";
import { AwardTypeGQL } from "./enums";
import { TeamGQL } from "./Team";
import { Award } from "../../db/schemas/Award";
import { EventGQL } from "./Event";
import { Event } from "../../db/schemas/Event";
import { DateTimeTy, IntTy, Season, StrTy, nn, nullTy } from "@ftc-scout/common";
import graphqlFields from "graphql-fields";

export const AwardGQL: GraphQLObjectType = new GraphQLObjectType({
    name: "Award",
    fields: () => ({
        season: IntTy,
        eventCode: StrTy,
        teamNumber: IntTy,
        divisionName: nullTy(StrTy),
        personName: nullTy(StrTy),
        type: { type: nn(AwardTypeGQL) },
        placement: IntTy,
        createdAt: DateTimeTy,
        updatedAt: DateTimeTy,

        // Must use aware loader
        team: { type: nn(TeamGQL) },

        event: {
            type: nn(EventGQL),
            resolve: dataLoaderResolverSingle<Award, Event, { season: Season; code: string }>(
                (a) => ({ season: a.season, code: a.eventCode }),
                (keys) => Event.find(keys)
            ),
        },
    }),
});

export async function teamAwareAwardLoader(keys: any[], info: GraphQLResolveInfo[]) {
    let includeTeam = info.some((i) => "team" in graphqlFields(i));

    // Build query from keys
    let awards: any[] = [];
    for (let key of keys) {
        let award = await Award.findOne(key);
        if (award) awards.push(award);
    }

    // If includeTeam is needed, populate the team data
    if (includeTeam) {
        const { Team } = await import("../../db/schemas/Team");
        for (let award of awards) {
            const team = await Team.findOne({ number: award.teamNumber });
            (award as any).team = team;
        }
    }

    return awards;
}
