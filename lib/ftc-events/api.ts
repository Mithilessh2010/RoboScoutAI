import "server-only";
import { ftcEventsFetch } from "./client";

type TournamentLevel = "qual" | "playoff";

type QueryValue = string | number | boolean | undefined;

function cleanParams(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

function requireParam(value: unknown, name: string) {
  if (value === undefined || value === null || value === "") throw new Error(`${name} is required.`);
}

function assertLevel(level?: string): asserts level is TournamentLevel | undefined {
  if (level && level !== "qual" && level !== "playoff") throw new Error("tournamentLevel must be 'qual' or 'playoff'.");
}

export function getApiIndex() {
  return ftcEventsFetch<unknown>("/");
}

export function getSeasonSummary(season: number) {
  requireParam(season, "season");
  return ftcEventsFetch<unknown>(`/${season}`);
}

export function getTeams(params: { season: number; teamNumber?: number; eventCode?: string; state?: string; excludeNonCompeting?: boolean; page?: number }) {
  requireParam(params.season, "season");
  if (params.teamNumber && (params.eventCode || params.state)) throw new Error("Do not send eventCode or state when teamNumber is provided.");
  return ftcEventsFetch<unknown>(`/${params.season}/teams${cleanParams({
    teamNumber: params.teamNumber,
    eventCode: params.eventCode,
    state: params.state,
    excludeNonCompeting: params.excludeNonCompeting,
    page: params.page,
  })}`);
}

export function getEvents(params: { season: number; eventCode?: string; teamNumber?: number }) {
  requireParam(params.season, "season");
  if (params.eventCode && params.teamNumber) throw new Error("Do not send teamNumber when eventCode is specified.");
  return ftcEventsFetch<unknown>(`/${params.season}/events${cleanParams({ eventCode: params.eventCode, teamNumber: params.teamNumber })}`);
}

export function getSchedule(params: { season: number; eventCode: string; tournamentLevel?: TournamentLevel; teamNumber?: number; start?: number; end?: number }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  assertLevel(params.tournamentLevel);
  if (!params.tournamentLevel && !params.teamNumber) throw new Error("Schedule endpoint requires tournamentLevel or teamNumber.");
  return ftcEventsFetch<unknown>(`/${params.season}/schedule/${params.eventCode}${cleanParams({
    tournamentLevel: params.tournamentLevel,
    teamNumber: params.teamNumber,
    start: params.start,
    end: params.end,
  })}`);
}

export function getHybridSchedule(params: { season: number; eventCode: string; tournamentLevel: TournamentLevel; start?: number; end?: number }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  requireParam(params.tournamentLevel, "tournamentLevel");
  assertLevel(params.tournamentLevel);
  return ftcEventsFetch<unknown>(`/${params.season}/schedule/${params.eventCode}/${params.tournamentLevel}/hybrid${cleanParams({ start: params.start, end: params.end })}`);
}

export function getRankings(params: { season: number; eventCode: string; teamNumber?: number; top?: number }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  if (params.top && params.teamNumber) throw new Error("Do not send both top and teamNumber.");
  return ftcEventsFetch<unknown>(`/${params.season}/rankings/${params.eventCode}${cleanParams({ teamNumber: params.teamNumber, top: params.top })}`);
}

export function getMatches(params: { season: number; eventCode: string; tournamentLevel?: TournamentLevel; teamNumber?: number; matchNumber?: number; start?: number; end?: number }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  assertLevel(params.tournamentLevel);
  if ((params.matchNumber || params.start || params.end) && !params.tournamentLevel) throw new Error("matchNumber/start/end require tournamentLevel.");
  if (params.teamNumber && params.matchNumber) throw new Error("Do not send matchNumber when teamNumber is specified.");
  if (params.matchNumber && (params.start || params.end)) throw new Error("Do not send start/end when matchNumber is specified.");
  return ftcEventsFetch<unknown>(`/${params.season}/matches/${params.eventCode}${cleanParams({
    tournamentLevel: params.tournamentLevel,
    teamNumber: params.teamNumber,
    matchNumber: params.matchNumber,
    start: params.start,
    end: params.end,
  })}`);
}

export function getScoreDetails(params: { season: number; eventCode: string; tournamentLevel: TournamentLevel; teamNumber?: number; matchNumber?: number; start?: number; end?: number }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  requireParam(params.tournamentLevel, "tournamentLevel");
  assertLevel(params.tournamentLevel);
  return ftcEventsFetch<unknown>(`/${params.season}/scores/${params.eventCode}/${params.tournamentLevel}${cleanParams({
    teamNumber: params.teamNumber,
    matchNumber: params.matchNumber,
    start: params.start,
    end: params.end,
  })}`);
}

export function getAlliances(params: { season: number; eventCode: string }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  return ftcEventsFetch<unknown>(`/${params.season}/alliances/${params.eventCode}`);
}

export function getAllianceSelection(params: { season: number; eventCode: string }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  return ftcEventsFetch<unknown>(`/${params.season}/alliances/${params.eventCode}/selection`);
}

export function getAwardList(season: number) {
  requireParam(season, "season");
  return ftcEventsFetch<unknown>(`/${season}/awards/list`);
}

export function getAwards(params: { season: number; eventCode?: string; teamNumber?: number }) {
  requireParam(params.season, "season");
  if (params.eventCode && params.teamNumber) return ftcEventsFetch<unknown>(`/${params.season}/awards/${params.eventCode}/${params.teamNumber}`);
  if (params.eventCode) return ftcEventsFetch<unknown>(`/${params.season}/awards/${params.eventCode}`);
  if (params.teamNumber) return ftcEventsFetch<unknown>(`/${params.season}/awards/${params.teamNumber}`);
  throw new Error("eventCode or teamNumber is required for awards.");
}

export function getAdvancement(params: { season: number; eventCode: string }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  return ftcEventsFetch<unknown>(`/${params.season}/advancement/${params.eventCode}`);
}

export function getAdvancementPoints(params: { season: number; eventCode: string }) {
  requireParam(params.season, "season");
  requireParam(params.eventCode, "eventCode");
  return ftcEventsFetch<unknown>(`/${params.season}/advancement/${params.eventCode}/points`);
}
