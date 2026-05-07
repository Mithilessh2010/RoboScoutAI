"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOpr = void 0;
const ml_matrix_1 = require("ml-matrix");
function calculateOpr(scores) {
    if (scores.length == 0)
        return [];
    let allTeams = [...new Set(scores.flatMap((s) => [s.team1, s.team2]))];
    let allianceMatrix = new ml_matrix_1.Matrix(scores.map((s) => allTeams.map((t) => (t == s.team1 || t == s.team2 ? 1 : 0))));
    let resultsVector = ml_matrix_1.Matrix.columnVector(scores.map((s) => s.result));
    let oprs = new ml_matrix_1.SingularValueDecomposition(allianceMatrix, {
        autoTranspose: true,
    }).solve(resultsVector);
    let ret = {};
    for (let i = 0; i < allTeams.length; i++) {
        ret[allTeams[i]] = oprs.get(i, 0);
    }
    return ret;
}
exports.calculateOpr = calculateOpr;
//# sourceMappingURL=calculate-opr.js.map