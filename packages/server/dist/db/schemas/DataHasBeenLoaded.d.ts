import { Document } from "mongoose";
import { Season } from "@ftc-scout/common";
export interface IDataHasBeenLoaded extends Document {
    season: Season;
    teams?: boolean;
    events?: boolean;
    matches?: boolean;
    awards?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DataHasBeenLoaded: any;
export declare function checkDataLoaded(season: Season): Promise<{
    teams: any;
    events: any;
    matches: any;
    awards: any;
}>;
export declare function markDataLoaded(season: Season, type: "teams" | "events" | "matches" | "awards"): Promise<any>;
