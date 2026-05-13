import { Document } from "mongoose";
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
export declare const Team: any;
export declare function teamFromApi(api: TeamFtcApi): Omit<ITeam, keyof Document> | null;
