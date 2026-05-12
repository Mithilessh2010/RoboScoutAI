import { GraphQLFieldConfig, GraphQLObjectType } from "graphql";
import { RegionOption } from "@ftc-scout/common";
import { Season } from "@ftc-scout/common";
export declare function getQuickStats(number: number, season: Season, region: RegionOption | null): Promise<{
    season: Season;
    number: number;
    tot: {
        value: any;
        rank: any;
    };
    auto: {
        value: any;
        rank: any;
    };
    dc: {
        value: any;
        rank: any;
    };
    eg: {
        value: any;
        rank: any;
    };
    count: any;
} | null>;
export declare const TeamGQL: GraphQLObjectType;
export declare const TeamQueries: Record<string, GraphQLFieldConfig<any, any>>;
