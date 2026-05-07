import { TeamMatchParticipationFtcApi } from "../ftc-api-types/Match";
export declare const Alliance: {
    readonly Red: "Red";
    readonly Blue: "Blue";
    readonly Solo: "Solo";
};
export type Alliance = (typeof Alliance)[keyof typeof Alliance];
export declare function allianceFromApiStation(station: TeamMatchParticipationFtcApi["station"]): Alliance;
export declare const AllianceRole: {
    readonly Captain: "Captain";
    readonly FirstPick: "FirstPick";
    readonly SecondPick: "SecondPick";
    readonly Solo: "Solo";
};
export type AllianceRole = (typeof AllianceRole)[keyof typeof AllianceRole];
export declare function allianceRoleFromApiStation(station: TeamMatchParticipationFtcApi["station"]): AllianceRole;
