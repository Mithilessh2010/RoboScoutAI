import { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
export declare const MatchGQL: GraphQLObjectType;
export declare function singleSeasonScoreAwareMatchLoader(keys: any[], info: GraphQLResolveInfo[], includeScores?: boolean, includeTeams?: boolean): Promise<any[]>;
