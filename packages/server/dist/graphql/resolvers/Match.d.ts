import { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { Match } from "../../db/entities/Match";
import { Season } from "@ftc-scout/common";
import { FindOptionsWhere } from "typeorm";
export declare const MatchGQL: GraphQLObjectType;
export declare function singleSeasonScoreAwareMatchLoader<K extends {
    eventSeason: Season;
} & FindOptionsWhere<Match>>(keys: K[], info: GraphQLResolveInfo[], includeScores?: boolean, includeTeams?: boolean): Promise<Match[]>;
