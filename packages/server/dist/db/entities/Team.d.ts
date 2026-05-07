import { TeamFtcApi } from "@ftc-scout/common";
import { BaseEntity } from "typeorm";
import { TeamMatchParticipation } from "./TeamMatchParticipation";
export declare class Team extends BaseEntity {
    number: number;
    matches: TeamMatchParticipation[];
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
    static fromApi(api: TeamFtcApi): Team | null;
}
