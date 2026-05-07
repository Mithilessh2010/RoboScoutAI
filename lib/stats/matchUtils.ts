import type { AllianceColor, Match } from "@/lib/types";

export function getWinner(match: Match): AllianceColor | "tie" | "scheduled" {
  if (match.status !== "complete") return "scheduled";
  if (match.red.score === match.blue.score) return "tie";
  return match.red.score > match.blue.score ? "red" : "blue";
}

export function allianceForTeam(match: Match, teamNumber: number): AllianceColor | undefined {
  if (match.red.teams.includes(teamNumber)) return "red";
  if (match.blue.teams.includes(teamNumber)) return "blue";
}

export function scoreForTeam(match: Match, teamNumber: number) {
  const alliance = allianceForTeam(match, teamNumber);
  return alliance ? match[alliance].score : undefined;
}
