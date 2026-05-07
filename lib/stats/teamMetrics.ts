import type { Match, ScoutingReport } from "@/lib/types";
import { allianceForTeam, getWinner, scoreForTeam } from "./matchUtils";

export function teamRecord(matches: Match[], teamNumber: number) {
  return matches.reduce(
    (record, match) => {
      const alliance = allianceForTeam(match, teamNumber);
      if (!alliance || match.status !== "complete") return record;
      const winner = getWinner(match);
      if (winner === "tie") record.ties += 1;
      else if (winner === alliance) record.wins += 1;
      else record.losses += 1;
      return record;
    },
    { wins: 0, losses: 0, ties: 0 },
  );
}

export function averageScore(matches: Match[], teamNumber: number) {
  const scores = matches.map((match) => scoreForTeam(match, teamNumber)).filter((score): score is number => typeof score === "number");
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
}

export function scoutAverages(reports: ScoutingReport[]) {
  const avg = (key: "driverSkill" | "reliability" | "defense" | "overall") =>
    reports.length ? reports.reduce((sum, report) => sum + report[key], 0) / reports.length : 0;
  return {
    driverSkill: avg("driverSkill"),
    reliability: avg("reliability"),
    defense: avg("defense"),
    overall: avg("overall"),
  };
}
