import { Document } from "mongoose";
import { Season, TournamentLevel } from "@ftc-scout/common";
export interface IMatch extends Document {
    eventSeason: Season;
    eventCode: string;
    id: number;
    hasBeenPlayed: boolean;
    scheduledStartTime?: Date | null;
    actualStartTime?: Date | null;
    postResultTime?: Date | null;
    tournamentLevel: TournamentLevel;
    series: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Match: any;
