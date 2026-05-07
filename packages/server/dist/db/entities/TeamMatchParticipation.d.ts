import { Alliance, AllianceRole, Season, Station, TeamMatchParticipationFtcApi } from "@ftc-scout/common";
import { BaseEntity } from "typeorm";
import { Match } from "./Match";
import { Team } from "./Team";
export declare class TeamMatchParticipation extends BaseEntity {
    season: Season;
    eventCode: string;
    matchId: number;
    alliance: Alliance;
    station: Station;
    match: Match;
    team: Team;
    teamNumber: number;
    allianceRole: AllianceRole;
    surrogate: boolean;
    noShow: boolean;
    dq: boolean;
    onField: boolean;
    createdAt: Date;
    updatedAt: Date;
    static fromApi(teams: TeamMatchParticipationFtcApi[], match: Match, remote: boolean): TeamMatchParticipation[];
}
