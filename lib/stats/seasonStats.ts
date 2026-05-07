import { events, getTeamMatches, matches } from "@/lib/mock-data";
import { calculateOpr } from "./opr";
import { averageScore, teamRecord } from "./teamMetrics";

export function seasonTeamTable(season: string) {
  const seasonMatches = matches.filter((match) => match.season === season);
  const opr = new Map(calculateOpr(seasonMatches).map((row) => [row.teamNumber, row]));
  const teams = [...new Set(seasonMatches.flatMap((match) => [...match.red.teams, ...match.blue.teams]))];
  return teams
    .map((teamNumber) => ({
      teamNumber,
      events: events.filter((event) => event.season === season && event.teamNumbers.includes(teamNumber)).length,
      record: teamRecord(getTeamMatches(teamNumber, season), teamNumber),
      avgScore: averageScore(getTeamMatches(teamNumber, season), teamNumber),
      ...opr.get(teamNumber),
    }))
    .sort((a, b) => (b.opr ?? 0) - (a.opr ?? 0));
}

export function multiSeasonTrend(teamNumber: number) {
  const seasons = [...new Set(matches.map((match) => match.season))];
  return seasons.map((season) => {
    const teamMatches = getTeamMatches(teamNumber, season);
    const opr = calculateOpr(matches.filter((match) => match.season === season)).find((row) => row.teamNumber === teamNumber);
    return {
      season,
      opr: Number((opr?.opr ?? 0).toFixed(1)),
      averageScore: Number(averageScore(teamMatches, teamNumber).toFixed(1)),
      matches: teamMatches.length,
    };
  });
}
