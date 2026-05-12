import { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
export declare const AwardGQL: GraphQLObjectType;
export declare function teamAwareAwardLoader(keys: any[], info: GraphQLResolveInfo[]): Promise<any[]>;
