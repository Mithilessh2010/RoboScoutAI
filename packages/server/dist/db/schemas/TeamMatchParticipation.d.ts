import { Document } from "mongoose";
import { Alliance, Station, AllianceRole, Season } from "@ftc-scout/common";
export interface ITeamMatchParticipation extends Document {
    season: Season;
    eventCode: string;
    matchId: number;
    alliance: Alliance;
    station: Station;
    teamNumber: number;
    allianceRole: AllianceRole;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TeamMatchParticipation: any;
