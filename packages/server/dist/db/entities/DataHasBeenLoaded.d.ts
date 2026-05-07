import { Season } from "@ftc-scout/common";
import { BaseEntity } from "typeorm";
export declare class DataHasBeenLoaded extends BaseEntity {
    season: Season;
    teams: boolean;
    events: boolean;
    matches: boolean;
    awards: boolean;
    createdAt: Date;
    updatedAt: Date;
    static teamsHaveBeenLoaded(season: Season): Promise<boolean>;
    static eventsHaveBeenLoaded(season: Season): Promise<boolean>;
    static matchesHaveBeenLoaded(season: Season): Promise<boolean>;
    static awardsHaveBeenLoaded(season: Season): Promise<boolean>;
}
