import { GraphQLFieldConfig, GraphQLObjectType } from "graphql";
import { RegionOption } from "@ftc-scout/common";
import { Season } from "@ftc-scout/common";
export declare function getQuickStats(number: number, season: Season, region: RegionOption | null): Promise<{
    season: Season;
    number: number;
    tot: {
        value: any;
        rank: number;
    };
    auto: {
        value: any;
        rank: number;
    };
    dc: {
        value: any;
        rank: number;
    };
    eg: {
        value: any;
        rank: number;
    };
    count: number;
} | null>;
export declare const TeamGQL: GraphQLObjectType;
export declare const TeamQueries: Record<string, GraphQLFieldConfig<any, any>>;
