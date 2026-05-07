import type { Award, Event, Match, Ranking, Team } from "@/lib/types";

type AnyRecord = Record<string, unknown>;

function list(data: unknown, keys: string[]) {
  const obj = data as AnyRecord | null;
  if (!obj) return [];
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value as AnyRecord[];
  }
  if (Array.isArray(data)) return data as AnyRecord[];
  return [];
}

function str(value: unknown, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeTeams(data: unknown): Team[] {
  return list(data, ["teams", "Teams", "team"]).map((team) => ({
    number: num(team.teamNumber ?? team.number),
    name: str(team.nameFull ?? team.nameShort ?? team.name ?? "FTC Team"),
    city: str(team.city),
    state: str(team.stateProv ?? team.state),
    country: str(team.country),
    rookieYear: num(team.rookieYear),
  }));
}

export function normalizeEvents(data: unknown, seasonId: string): Event[] {
  return list(data, ["events", "Events", "event"]).map((event) => ({
    code: str(event.code ?? event.eventCode),
    season: seasonId,
    name: str(event.name ?? event.eventName ?? "FTC Event"),
    city: str(event.city),
    state: str(event.stateprov ?? event.stateProv ?? event.state),
    venue: str(event.venue ?? event.venueName),
    startDate: str(event.dateStart ?? event.startDate ?? event.start),
    endDate: str(event.dateEnd ?? event.endDate ?? event.end ?? event.dateStart),
    teamNumbers: [],
  }));
}

function allianceTeams(match: AnyRecord, alliance: "Red" | "Blue") {
  const teams = list(match, ["teams", "Teams", "alliances", "Alliances"]);
  return teams
    .filter((team) => str(team.station ?? team.Station ?? team.alliance).toLowerCase().includes(alliance.toLowerCase()))
    .map((team) => num(team.teamNumber ?? team.number))
    .filter(Boolean);
}

export function normalizeMatches(data: unknown, seasonId: string, eventCode: string): Match[] {
  return list(data, ["matches", "Matches", "schedule", "Schedule"]).map((match, index) => {
    const redScore = num(match.scoreRedFinal ?? match.redScore ?? match.scoreRed, 0);
    const blueScore = num(match.scoreBlueFinal ?? match.blueScore ?? match.scoreBlue, 0);
    const complete = match.scoreRedFinal !== undefined || match.scoreBlueFinal !== undefined || match.postResultTime !== undefined;
    const level = str(match.tournamentLevel ?? match.level ?? "Qualification").toLowerCase().includes("playoff") ? "Final" : "Qualification";
    return {
      id: str(match.description ?? match.id ?? `${eventCode}-${index}`),
      season: seasonId,
      eventCode,
      level,
      matchNumber: num(match.matchNumber, index + 1),
      scheduledTime: str(match.startTime ?? match.actualStartTime ?? match.description ?? new Date().toISOString()),
      status: complete ? "complete" : "scheduled",
      red: { teams: allianceTeams(match, "Red"), score: redScore },
      blue: { teams: allianceTeams(match, "Blue"), score: blueScore },
    };
  });
}

export function normalizeRankings(data: unknown, seasonId: string, eventCode: string): Ranking[] {
  return list(data, ["rankings", "Rankings"]).map((row) => ({
    season: seasonId,
    eventCode,
    teamNumber: num(row.teamNumber ?? row.number),
    rank: num(row.rank),
    wins: num(row.wins),
    losses: num(row.losses),
    ties: num(row.ties),
    rp: num(row.rankingPoints ?? row.rp),
    tbp: num(row.tieBreakerPoints ?? row.tbp),
  }));
}

export function normalizeAwards(data: unknown, seasonId: string, eventCode: string): Award[] {
  return list(data, ["awards", "Awards"]).map((award) => ({
    season: seasonId,
    eventCode,
    teamNumber: award.teamNumber === undefined ? undefined : num(award.teamNumber),
    name: str(award.name ?? award.awardName ?? award.award),
    recipient: str(award.recipient ?? award.person ?? award.teamNumber ?? "Recipient"),
  }));
}
