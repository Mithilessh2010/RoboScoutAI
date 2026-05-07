import { Matrix, SingularValueDecomposition } from "ml-matrix";
import type { Match } from "@/lib/types";

export type OprBreakdown = {
  teamNumber: number;
  opr: number;
  autoOpr: number;
  teleopOpr: number;
  endgameOpr: number;
};

type AllianceRow = {
  teams: number[];
  score: number;
  auto: number;
  teleop: number;
  endgame: number;
};

function solveLeastSquares(rows: AllianceRow[], value: keyof Omit<AllianceRow, "teams">) {
  if (!rows.length) return new Map<number, number>();

  const teams = [...new Set(rows.flatMap((row) => row.teams))].sort((a, b) => a - b);
  const a = new Matrix(rows.map((row) => teams.map((team) => (row.teams.includes(team) ? 1 : 0))));
  const b = Matrix.columnVector(rows.map((row) => Number(row[value])));

  // OPR estimates team contribution by solving A*x = b in a least-squares sense.
  // Each alliance is a row, each team is a column, and alliance score is the target.
  const solution = new SingularValueDecomposition(a, { autoTranspose: true }).solve(b);
  return new Map(teams.map((team, index) => [team, solution.get(index, 0)]));
}

export function calculateOpr(matches: Match[]): OprBreakdown[] {
  const completed = matches.filter((match) => match.status === "complete");
  const rows: AllianceRow[] = completed.flatMap((match) => [
    {
      teams: match.red.teams,
      score: match.red.score,
      auto: match.red.auto ?? 0,
      teleop: match.red.teleop ?? 0,
      endgame: match.red.endgame ?? 0,
    },
    {
      teams: match.blue.teams,
      score: match.blue.score,
      auto: match.blue.auto ?? 0,
      teleop: match.blue.teleop ?? 0,
      endgame: match.blue.endgame ?? 0,
    },
  ]);

  const total = solveLeastSquares(rows, "score");
  const auto = solveLeastSquares(rows, "auto");
  const teleop = solveLeastSquares(rows, "teleop");
  const endgame = solveLeastSquares(rows, "endgame");

  return [...total.keys()]
    .map((teamNumber) => ({
      teamNumber,
      opr: total.get(teamNumber) ?? 0,
      autoOpr: auto.get(teamNumber) ?? 0,
      teleopOpr: teleop.get(teamNumber) ?? 0,
      endgameOpr: endgame.get(teamNumber) ?? 0,
    }))
    .sort((a, b) => b.opr - a.opr);
}

export function getTeamOpr(matches: Match[], teamNumber: number) {
  return calculateOpr(matches).find((row) => row.teamNumber === teamNumber);
}
