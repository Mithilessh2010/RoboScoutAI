// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";
import { TeamFtcApi } from "@ftc-scout/common";

export interface ITeam extends Document {
    number: number;
    name: string;
    schoolName: string;
    sponsors: string[];
    country: string;
    state: string;
    city: string;
    rookieYear: number;
    website?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
    {
        number: { type: Number, primaryKey: true, required: true },
        name: { type: String, required: true },
        schoolName: { type: String, required: true },
        sponsors: [String],
        country: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        rookieYear: { type: Number, required: true },
        website: { type: String, default: null },
    },
    { timestamps: true }
);

teamSchema.index({ number: 1 }, { unique: true });

export const Team = mongoose.model<ITeam>("Team", teamSchema);

export function teamFromApi(api: TeamFtcApi): Omit<ITeam, keyof Document> | null {
    if (api.nameShort == null || api.rookieYear == null) {
        console.warn(`Rejecting api team ${api.teamNumber}.`);
        return null;
    }

    function fixLocations(event_name: string) {
        const replacements = [["Chinese Taipei", "Taiwan"]];
        for (const [old_str, new_str] of replacements) {
            if (event_name.includes(old_str)) {
                return event_name.replace(old_str, new_str);
            }
        }
        return event_name;
    }

    let name = api.nameShort.trim();
    let schoolName: string | null;
    let sponsors: string[];

    if (api.nameFull == null) {
        schoolName = "Unknown";
        sponsors = [];
    } else if (api.nameFull.includes("&")) {
        let index = api.nameFull.lastIndexOf("&");
        let teamNamePart = api.nameFull.slice(index + 1);
        let sponsorsPart = api.nameFull.slice(0, index);

        schoolName = teamNamePart.trim();
        sponsors = sponsorsPart
            .split("/")
            .map((s) => s.trim())
            .filter((s) => !!s);
    } else {
        schoolName = api.nameFull?.trim() ?? null;
        sponsors = [];
    }

    return {
        number: api.teamNumber,
        name,
        schoolName,
        sponsors,
        country: fixLocations(api.country ?? ""),
        state: fixLocations(api.stateProv ?? ""),
        city: fixLocations(api.city ?? ""),
        rookieYear: api.rookieYear,
        website: api.website ?? null,
    };
}
