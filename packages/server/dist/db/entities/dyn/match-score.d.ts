import { Alliance, MatchScoresFtcApi, Season } from "@ftc-scout/common";
import { EntitySchema, Repository } from "typeorm";
import { Match } from "../Match";
import { AnyObject } from "../../../type-utils";
type BaseColumns = {
    season: Season;
    eventCode: string;
    matchId: number;
    alliance: Alliance;
    createdAt: Date;
    updatedAt: Date;
};
type KnownColumns = {
    totalPoints: number;
    totalPointsNp: number;
};
export declare let MatchScoreSchemas: Record<Season, EntitySchema<MatchScore>>;
export type MatchScore = BaseColumns & KnownColumns & AnyObject;
export declare let MatchScore: Record<Season, Repository<MatchScore>> & {
    fromApi(api: MatchScoresFtcApi, match: Match, remote: boolean): MatchScore[];
};
export declare function initMS(): void;
export {};
