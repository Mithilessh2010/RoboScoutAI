import { BaseEntity } from "typeorm";
import { Team } from "./Team";
export declare class BestName extends BaseEntity {
    id: number;
    team1: number;
    team1D: Team;
    team2: number;
    team2D: Team;
    vote: number;
    createdAt: Date;
    updatedAt: Date;
}
