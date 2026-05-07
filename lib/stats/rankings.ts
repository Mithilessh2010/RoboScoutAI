import type { Match, Ranking } from "@/lib/types";
import { getWinner } from "./matchUtils";

export function buildRankingsFromMatches(matches: Match[]): Ranking[] {
  const stats = new Map<number, Ranking>();
  for (const match of matches.filter((item) => item.status === "complete")) {
    const winner = getWinner(match);
    for (const color of ["red", "blue"] as const) {
      for (const teamNumber of match[color].teams) {
        const row =
          stats.get(teamNumber) ??
          { season: match.season, eventCode: match.eventCode, teamNumber, rank: 0, wins: 0, losses: 0, ties: 0, rp: 0, tbp: 0 };
        if (winner === "tie") row.ties += 1;
        else if (winner === color) row.wins += 1;
        else row.losses += 1;
        row.rp += match[color].rp ?? 0;
        row.tbp += match[color].score;
        stats.set(teamNumber, row);
      }
    }
  }
  return [...stats.values()]
    .sort((a, b) => b.rp - a.rp || b.tbp - a.tbp || b.wins - a.wins)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
