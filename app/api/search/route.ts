import { NextResponse } from "next/server";
import { currentSeason, events, seasons, teams } from "@/lib/mock-data";
import { getFtcScoutSearchData, type FtcScoutEvent, type FtcScoutTeam } from "@/lib/ftcscout-api/client";
import { getTeams } from "@/lib/ftc-events/api";
import { normalizeTeams } from "@/lib/ftc-events/normalize";
import { calcCutoff, fuzzySearch } from "@/lib/search/fuzzy";

type SearchResult = {
  href: string;
  label: string;
  meta: string;
  type: "Team" | "Event" | "Season" | "Action";
};

function seasonYear(season: string) {
  return Number(season.slice(0, 4));
}

function seasonIdFromYear(year: number) {
  return seasons.find((season) => season.year === year)?.id ?? `${year}-${year + 1}`;
}

function normalizeFtcScoutTeam(team: FtcScoutTeam) {
  return {
    number: team.number,
    name: team.name || "FTC Team",
    city: team.location?.city || "",
    state: team.location?.state || "",
    country: team.location?.country || "",
  };
}

function uniqueResults(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.type}:${result.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function teamResult(team: { number: number; name: string; city?: string; state?: string; country?: string }, season: string, metaFallback = "FTC team"): SearchResult {
  return {
    href: `/seasons/${season}/teams/${team.number}`,
    label: `${team.number} - ${team.name}`,
    meta: [team.city, team.state || team.country].filter(Boolean).join(", ") || metaFallback,
    type: "Team",
  };
}

function searchTeamsFTCScoutStyle(teamDocs: Array<{ number: number; name: string; city?: string; state?: string; country?: string }>, needle: string, season: string, max = 8) {
  if (/^\d+$/.test(needle)) {
    return teamDocs
      .filter((team) => String(team.number).startsWith(needle))
      .sort((a, b) => a.number - b.number)
      .slice(0, max)
      .map((team) => teamResult(team, season));
  }

  return fuzzySearch(teamDocs, needle, max, "name", true).map((result) => teamResult(result.document, season));
}

function searchEventsFTCScoutStyle(
  needle: string,
  eventDocs: Array<{ season: string | number; code: string; name: string; city?: string; state?: string; country?: string }>,
) {
  const fuzzyEvents = fuzzySearch(eventDocs, needle, 10, "name", true);
  const eventCodeMatches = eventDocs
    .filter((event) => needle.length >= 4 && event.code.toLowerCase().startsWith(needle.toLowerCase().trim()))
    .map((event) => ({ document: event, distance: event.code.length - needle.length, highlights: [] }));

  const allEvents = [...fuzzyEvents, ...eventCodeMatches];
  const bestDistance = Math.min(...allEvents.map((event) => event.distance), Infinity);
  const cutoff = calcCutoff(bestDistance, needle.length);

  return allEvents
    .filter((event) => event.distance <= cutoff)
    .slice(0, 5)
    .map<SearchResult>(({ document: event }) => ({
      href: `/seasons/${typeof event.season === "number" ? seasonIdFromYear(event.season) : event.season}/events/${event.code}`,
      label: event.name,
      meta: `${typeof event.season === "number" ? seasonIdFromYear(event.season) : event.season} · ${[event.city, event.state || event.country].filter(Boolean).join(", ")}`,
      type: "Event",
    }));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim().slice(0, 50);
  const season = params.get("season") ?? currentSeason.id;
  const seasonYearNumber = seasonYear(season);
  const q = query.toLowerCase();

  if (!q) return NextResponse.json({ results: [] });

  const numericQuery = /^\d+$/.test(q);
  const localTeamResults = searchTeamsFTCScoutStyle(teams, q, season, numericQuery ? 10 : 6);

  let ftcTeamResults: SearchResult[] = [];
  let ftcScoutTeamResults: SearchResult[] = [];
  let ftcScoutEventResults: SearchResult[] = [];
  let realDataWarning: string | undefined;

  try {
    const ftcScoutData = await getFtcScoutSearchData(seasonYearNumber);
    const ftcScoutTeams = ftcScoutData.teams.map(normalizeFtcScoutTeam);
    ftcScoutTeamResults = searchTeamsFTCScoutStyle(ftcScoutTeams, q, season, numericQuery ? 10 : 6);
    if (!numericQuery) {
      const ftcScoutEvents = ftcScoutData.events.map((event: FtcScoutEvent) => ({
        season: event.season,
        code: event.code,
        name: event.name,
        city: event.location?.city || "",
        state: event.location?.state || "",
        country: event.location?.country || "",
      }));
      ftcScoutEventResults = searchEventsFTCScoutStyle(q, ftcScoutEvents);
    }
  } catch (error) {
    realDataWarning = error instanceof Error ? error.message : "FTCScout API unavailable.";
  }

  if (numericQuery || q.length >= 3) {
    try {
      const officialTeams = numericQuery ? normalizeTeams(await getTeams({ season: seasonYearNumber, teamNumber: Number(q) })) : [];
      ftcTeamResults = searchTeamsFTCScoutStyle(officialTeams, q, season, numericQuery ? 10 : 6);
    } catch {
      // FTCScout public search remains available when official FTC Events credentials are not configured.
    }
  }

  const eventResults = numericQuery
    ? []
    : searchEventsFTCScoutStyle(
        q,
        events.map((event) => ({
          season: event.season,
          code: event.code,
          name: event.name,
          city: event.city,
          state: event.state,
        })),
      );

  const seasonResults = seasons
    .filter((item) => `${item.id} ${item.gameName}`.toLowerCase().includes(q))
    .map<SearchResult>((item) => ({
      href: `/seasons/${item.id}`,
      label: `${item.id} ${item.gameName}`,
      meta: item.current ? "Current season" : "Past season",
      type: "Season",
    }));

  const directTeamResult =
    numericQuery && query.length >= 2
      ? [
          {
            href: `/seasons/${season}/teams/${Number(query)}`,
            label: `${Number(query)} - FTC Team`,
            meta: "Team number lookup",
            type: "Team" as const,
          },
        ]
      : [];

  return NextResponse.json({
    results: uniqueResults(
      numericQuery
        ? [...ftcScoutTeamResults, ...ftcTeamResults, ...localTeamResults, ...directTeamResult]
        : [...ftcScoutTeamResults, ...ftcScoutEventResults, ...localTeamResults, ...eventResults, ...ftcTeamResults, ...seasonResults],
    ).slice(0, 10),
    season: seasonIdFromYear(seasonYearNumber),
    source: ftcScoutTeamResults.length || ftcScoutEventResults.length ? "ftcscout-api" : "mock-data",
    warning: realDataWarning,
  });
}
