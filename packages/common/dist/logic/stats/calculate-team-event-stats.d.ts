import { Alliance } from "../Alliance";
import { Season } from "../Season";
import { Station } from "../Station";
import { TournamentLevel } from "../TournamentLevel";
type AnyObject = Record<string, any>;
export type FrontendMatch = {
    tournamentLevel: TournamentLevel;
    teams: Tmp[];
    scores: Score | {
        red: Score;
        blue: Score;
    } | null;
};
type Tmp = {
    matchId: number;
    teamNumber: number;
    alliance: Alliance;
    station: Station;
    surrogate: boolean;
    dq: boolean;
    onField: boolean;
};
type Score = {
    matchId: number;
    alliance: Alliance;
    totalPoints: number;
    totalPointsNp: number;
} & Record<string, any>;
type Tep = {
    season: Season;
    eventCode: string;
    teamNumber: number;
    isRemote: boolean;
    hasStats: boolean;
    rank: number;
    rp: number;
    tb1: number;
    tb2: number;
    wins: number;
    losses: number;
    ties: number;
    dqs: number;
    qualMatchesPlayed: number;
    tot: AnyObject;
    avg: AnyObject;
    min: AnyObject;
    max: AnyObject;
    dev: AnyObject;
    opr: AnyObject;
};
export declare function calculateTeamEventStats(season: Season, eventCode: string, isRemote: boolean, matches: FrontendMatch[], teams: number[]): Tep[];
export {};
