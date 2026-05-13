import { Document } from "mongoose";
import { Season, EventType, EventFtcApi } from "@ftc-scout/common";
export interface IEventLivestreamDay {
    day: Date;
    liveStreamURL?: string | null;
    webcasts?: string[] | null;
}
export interface IEvent extends Document {
    season: Season;
    code: string;
    divisionCode?: string | null;
    name: string;
    remote: boolean;
    hybrid: boolean;
    fieldCount: number;
    published: boolean;
    type: EventType;
    regionCode?: string | null;
    leagueCode?: string | null;
    districtCode?: string | null;
    venue?: string | null;
    address?: string | null;
    country: string;
    state: string;
    city: string;
    website?: string | null;
    liveStreamURL?: string | null;
    livestreamsByDay?: IEventLivestreamDay[] | null;
    webcasts: string[];
    timezone: string;
    start: Date;
    end: Date;
    modifiedRules: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Event: any;
export declare function eventFromApi(api: EventFtcApi): Omit<IEvent, keyof Document> | null;
