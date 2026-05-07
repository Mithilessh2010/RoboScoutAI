export declare const TournamentLevel: {
    readonly Quals: "Quals";
    readonly Semis: "Semis";
    readonly Finals: "Finals";
    readonly DoubleElim: "DoubleElim";
};
export type TournamentLevel = (typeof TournamentLevel)[keyof typeof TournamentLevel];
export declare function tournamentLevelFromFtcApi(str: "OTHER" | "QUALIFICATION" | "SEMIFINAL" | "FINAL" | "PLAYOFF"): TournamentLevel;
export declare function tournamentLevelValue(level: TournamentLevel): number;
