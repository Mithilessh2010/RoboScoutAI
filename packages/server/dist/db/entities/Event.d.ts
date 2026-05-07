import { BaseEntity } from "typeorm";
import { EventFtcApi, EventType, Season } from "@ftc-scout/common";
import { Match } from "./Match";
export type EventLivestreamDay = {
    day: Date;
    liveStreamURL?: string | null;
    webcasts?: string[] | null;
};
export declare class Event extends BaseEntity {
    season: Season;
    code: string;
    matches: Match[];
    divisionCode: string | null;
    name: string;
    remote: boolean;
    hybrid: boolean;
    fieldCount: number;
    published: boolean;
    type: EventType;
    regionCode: string | null;
    leagueCode: string | null;
    districtCode: string | null;
    venue: string | null;
    address: string | null;
    country: string;
    state: string;
    city: string;
    website: string | null;
    liveStreamURL: string | null;
    livestreamsByDay: EventLivestreamDay[] | null;
    webcasts: string[];
    timezone: string;
    start: Date;
    end: Date;
    modifiedRules: boolean;
    createdAt: Date;
    updatedAt: Date;
    static fromApi(api: EventFtcApi, season: Season): Event | null;
}
