"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentLevelValue = exports.tournamentLevelFromFtcApi = exports.TournamentLevel = void 0;
exports.TournamentLevel = {
    Quals: "Quals",
    Semis: "Semis",
    Finals: "Finals",
    DoubleElim: "DoubleElim",
};
function tournamentLevelFromFtcApi(str) {
    return {
        OTHER: exports.TournamentLevel.Quals,
        QUALIFICATION: exports.TournamentLevel.Quals,
        SEMIFINAL: exports.TournamentLevel.Semis,
        FINAL: exports.TournamentLevel.Finals,
        PLAYOFF: exports.TournamentLevel.DoubleElim,
    }[str];
}
exports.tournamentLevelFromFtcApi = tournamentLevelFromFtcApi;
function tournamentLevelValue(level) {
    switch (level) {
        case exports.TournamentLevel.Quals:
            return 0;
        case exports.TournamentLevel.Semis:
            return 1;
        default:
            return 2;
    }
}
exports.tournamentLevelValue = tournamentLevelValue;
//# sourceMappingURL=TournamentLevel.js.map