import mongoose, { Schema, Document } from "mongoose";
import { Season, EventType, EventFtcApi, eventTypeFromFtcApi } from "@ftc-scout/common";

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

const eventSchema = new Schema<IEvent>(
    {
        season: { type: Number, required: true },
        code: { type: String, required: true },
        divisionCode: { type: String, default: null },
        name: { type: String, required: true },
        remote: { type: Boolean, required: true },
        hybrid: { type: Boolean, required: true },
        fieldCount: { type: Number, required: true },
        published: { type: Boolean, required: true },
        type: { type: String, enum: Object.values(EventType), required: true },
        regionCode: { type: String, default: null },
        leagueCode: { type: String, default: null },
        districtCode: { type: String, default: null },
        venue: { type: String, default: null },
        address: { type: String, default: null },
        country: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        website: { type: String, default: null },
        liveStreamURL: { type: String, default: null },
        livestreamsByDay: [
            {
                day: Date,
                liveStreamURL: String,
                webcasts: [String],
            },
        ],
        webcasts: [String],
        timezone: { type: String, required: true },
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        modifiedRules: { type: Boolean, required: true },
    },
    { timestamps: true }
);

eventSchema.index({ season: 1, code: 1 }, { unique: true });

export const Event = mongoose.model<IEvent>("Event", eventSchema);

export function eventFromApi(api: EventFtcApi): Omit<IEvent, keyof Document> | null {
    return {
        season: api.season,
        code: api.code,
        divisionCode: api.divisionCode ?? null,
        name: api.name,
        remote: api.remote,
        hybrid: api.hybrid,
        fieldCount: api.fieldCount,
        published: api.published,
        type: eventTypeFromFtcApi(api.eventType),
        regionCode: api.regionCode ?? null,
        leagueCode: api.leagueCode ?? null,
        districtCode: api.districtCode ?? null,
        venue: api.venue ?? null,
        address: api.address ?? null,
        country: api.country,
        state: api.state,
        city: api.city,
        website: api.website ?? null,
        liveStreamURL: api.liveStreamURL ?? null,
        webcasts: api.webcasts ?? [],
        timezone: api.timezone,
        start: new Date(api.start),
        end: new Date(api.end),
        modifiedRules: api.modifiedRules,
    };
}
