import { AwardFtcApi, Season } from "@ftc-scout/common";
import { BaseEntity } from "typeorm";
export declare const AwardType: {
    readonly DeansListFinalist: "DeansListFinalist";
    readonly DeansListSemiFinalist: "DeansListSemiFinalist";
    readonly DeansListWinner: "DeansListWinner";
    readonly JudgesChoice: "JudgesChoice";
    readonly DivisionFinalist: "DivisionFinalist";
    readonly DivisionWinner: "DivisionWinner";
    readonly ConferenceFinalist: "ConferenceFinalist";
    readonly Compass: "Compass";
    readonly Promote: "Promote";
    readonly Control: "Control";
    readonly Motivate: "Motivate";
    readonly Reach: "Reach";
    readonly Sustain: "Sustain";
    readonly Design: "Design";
    readonly Innovate: "Innovate";
    readonly Connect: "Connect";
    readonly Think: "Think";
    readonly TopRanked: "TopRanked";
    readonly Inspire: "Inspire";
    readonly Winner: "Winner";
    readonly Finalist: "Finalist";
};
export type AwardType = (typeof AwardType)[keyof typeof AwardType];
export declare class Award extends BaseEntity {
    season: Season;
    eventCode: string;
    teamNumber: number;
    type: AwardType;
    placement: number;
    divisionName: string | null;
    personName: string | null;
    createdAt: Date;
    updatedAt: Date;
    static fromApi(season: Season, api: AwardFtcApi): Award | null;
}
export declare function awardCodeFromFtcApi(award: AwardFtcApi): [AwardType, number] | null;
