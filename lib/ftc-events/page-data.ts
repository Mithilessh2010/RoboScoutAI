import "server-only";
import { awards, events, getSeasonEvents, getSeasonTeams, matches, rankings, seasons } from "@/lib/mock-data";
import { getFtcScoutSearchData } from "@/lib/ftcscout-api/client";
import type { Event, Team } from "@/lib/types";
import { getApiIndex, getAwards, getEvents, getHybridSchedule, getMatches, getRankings, getSeasonSummary, getTeams } from "./api";
import { hasFtcEventsCredentials } from "./client";
import { normalizeAwards, normalizeEvents, normalizeMatches, normalizeRankings, normalizeTeams } from "./normalize";

export type LiveResult<T> = {
  data: T;
  usingMock: boolean;
  warning?: string;
};

export function seasonYear(season: string | number) {
  return typeof season === "number" ? season : Number(String(season).slice(0, 4));
}

export function seasonId(year: number) {
  return seasons.find((season) => season.year === year)?.id ?? `${year}-${year + 1}`;
}

async function publicFallback<T>(mockFallback: T, load?: () => Promise<T>): Promise<LiveResult<T>> {
  if (!load) {
    return { data: mockFallback, usingMock: true, warning: "Using mock data because FTC Events API is not configured." };
  }

  try {
    const data = await load();
    const emptyArray = Array.isArray(data) && data.length === 0;
    return emptyArray
      ? { data: mockFallback, usingMock: true, warning: "FTC Events API is not configured and no public fallback rows were found. Using mock data." }
      : { data, usingMock: true, warning: "Using FTCScout public search fallback because FTC Events API is not configured." };
  } catch {
    return { data: mockFallback, usingMock: true, warning: "Using mock data because FTC Events API is not configured." };
  }
}

async function live<T>(fallback: T, load: () => Promise<T>, fallbackLoad?: () => Promise<T>): Promise<LiveResult<T>> {
  if (!hasFtcEventsCredentials()) {
    return publicFallback(fallback, fallbackLoad);
  }
  try {
    const data = await load();
    const emptyArray = Array.isArray(data) && data.length === 0;
    if (!emptyArray) return { data, usingMock: false };
    if (fallbackLoad) return publicFallback(fallback, fallbackLoad);
    return { data: fallback, usingMock: true, warning: "FTC Events API returned no rows; using mock fallback." };
  } catch (error) {
    if (fallbackLoad) {
      const result = await publicFallback(fallback, fallbackLoad);
      return {
        ...result,
        warning: error instanceof Error ? `${error.message} ${result.warning}` : result.warning,
      };
    }
    return {
      data: fallback,
      usingMock: true,
      warning: error instanceof Error ? `${error.message} Using mock fallback.` : "FTC Events API failed. Using mock fallback.",
    };
  }
}

async function getFtcScoutTeamsFallback(season: string, teamNumber?: number, page = 1): Promise<Team[]> {
  const data = await getFtcScoutSearchData(seasonYear(season));
  const pageSize = 100;
  const start = Math.max(0, page - 1) * pageSize;
  return data.teams
    .filter((team) => (teamNumber ? team.number === teamNumber : true))
    .slice(start, start + pageSize)
    .map((team) => ({
      number: team.number,
      name: team.name || "FTC Team",
      city: team.location?.city ?? "",
      state: team.location?.state ?? "",
      country: team.location?.country ?? "",
      rookieYear: 0,
    }));
}

async function getFtcScoutEventsFallback(season: string, teamNumber?: number, eventCode?: string): Promise<Event[]> {
  const data = await getFtcScoutSearchData(seasonYear(season));
  return data.events
    .filter((event) => (eventCode ? event.code.toLowerCase() === eventCode.toLowerCase() : true))
    .map((event) => ({
      code: event.code,
      season,
      name: event.name,
      city: event.location?.city ?? "",
      state: event.location?.state ?? event.location?.country ?? "",
      venue: event.type ?? "",
      startDate: `${seasonYear(season)}-01-01`,
      endDate: `${seasonYear(season)}-01-01`,
      teamNumbers: teamNumber ? [teamNumber] : [],
    }));
}

export function getLiveApiIndex() {
  return live({ seasons: seasons.map((season) => season.year), currentSeason: seasonYear(seasons.find((season) => season.current)?.id ?? seasons[0].id) }, () => getApiIndex());
}

export function getLiveSeasonSummary(year: number) {
  const fallback = seasons.find((season) => season.year === year) ?? seasons[0];
  return live(fallback, () => getSeasonSummary(year));
}

export function getLiveTeams(season: string, page = 1) {
  return live(getSeasonTeams(season), async () => normalizeTeams(await getTeams({ season: seasonYear(season), page })), () => getFtcScoutTeamsFallback(season, undefined, page));
}

export function getLiveTeam(teamNumber: number, season: string) {
  return live(getSeasonTeams(season).filter((team) => team.number === teamNumber), async () => normalizeTeams(await getTeams({ season: seasonYear(season), teamNumber })), () =>
    getFtcScoutTeamsFallback(season, teamNumber),
  );
}

export function getLiveEvents(season: string) {
  return live(getSeasonEvents(season), async () => normalizeEvents(await getEvents({ season: seasonYear(season) }), season), () => getFtcScoutEventsFallback(season));
}

export function getLiveTeamEvents(teamNumber: number, season: string) {
  return live(
    getSeasonEvents(season).filter((event) => event.teamNumbers.includes(teamNumber)),
    async () => normalizeEvents(await getEvents({ season: seasonYear(season), teamNumber }), season),
    () => getFtcScoutEventsFallback(season, teamNumber),
  );
}

export function getLiveEvent(eventCode: string, season: string) {
  return live(getSeasonEvents(season).filter((event) => event.code === eventCode), async () => normalizeEvents(await getEvents({ season: seasonYear(season), eventCode }), season), () =>
    getFtcScoutEventsFallback(season, undefined, eventCode),
  );
}

export function getLiveEventTeams(eventCode: string, season: string) {
  return live(getSeasonTeams(season).filter((team) => getSeasonEvents(season).find((event) => event.code === eventCode)?.teamNumbers.includes(team.number)), async () =>
    normalizeTeams(await getTeams({ season: seasonYear(season), eventCode })),
  );
}

export function getLiveEventMatches(eventCode: string, season: string) {
  return live(matches.filter((match) => match.eventCode === eventCode), async () =>
    normalizeMatches(await getMatches({ season: seasonYear(season), eventCode, tournamentLevel: "qual" }), season, eventCode),
  );
}

export function getLiveEventSchedule(eventCode: string, season: string) {
  return live([], async () => normalizeMatches(await getHybridSchedule({ season: seasonYear(season), eventCode, tournamentLevel: "qual" }), season, eventCode));
}

export function getLiveEventRankings(eventCode: string, season: string) {
  return live(rankings.filter((ranking) => ranking.eventCode === eventCode), async () => normalizeRankings(await getRankings({ season: seasonYear(season), eventCode }), season, eventCode));
}

export function getLiveEventAwards(eventCode: string, season: string) {
  return live(awards.filter((award) => award.eventCode === eventCode), async () => normalizeAwards(await getAwards({ season: seasonYear(season), eventCode }), season, eventCode));
}

export function getMockEvents() {
  return events;
}
