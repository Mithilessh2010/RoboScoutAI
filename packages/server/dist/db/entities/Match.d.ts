import { FrontendMatch, MatchFtcApi, Season, TournamentLevel } from "@ftc-scout/common";
import { BaseEntity } from "typeorm";
import { Event } from "./Event";
import { MatchScore } from "./dyn/match-score";
import { TeamMatchParticipation } from "./TeamMatchParticipation";
export declare class Match extends BaseEntity {
    eventSeason: Season;
    eventCode: string;
    id: number;
    event: Event;
    scores: MatchScore[];
    teams: TeamMatchParticipation[];
    hasBeenPlayed: boolean;
    scheduledStartTime: Date | null;
    actualStartTime: Date | null;
    postResultTime: Date | null;
    tournamentLevel: TournamentLevel;
    series: number;
    get matchNum(): number;
    get description(): string;
    createdAt: Date;
    updatedAt: Date;
    static fromApi(api: MatchFtcApi, event: Event, hasBeenPlayed: boolean, allMatches: MatchFtcApi[]): Match;
    toFrontend(): FrontendMatch;
}
