import { Document } from "mongoose";
export interface IBestName extends Document {
    id: number;
    team1: number;
    team2: number;
    vote?: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BestName: any;
