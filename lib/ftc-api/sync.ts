import "server-only";
import { awards, events, matches, rankings, seasons, teams } from "@/lib/mock-data";
import { requestFtcApi } from "./client";

function seasonYear(season?: string | number) {
  if (!season) return new Date().getFullYear();
  return typeof season === "number" ? season : Number(String(season).slice(0, 4));
}

export async function syncFtcScope(scope: string, options: { season?: string; eventCode?: string } = {}) {
  const season = seasonYear(options.season);
  switch (scope) {
    case "seasons":
      return requestFtcApi("seasons", {}, { seasons: seasons.map((item) => item.year) });
    case "teams":
      return requestFtcApi("teams", { season }, { teams });
    case "events":
      return requestFtcApi("events", { season }, { events: events.filter((event) => event.season.startsWith(String(season))) });
    case "matches":
      return requestFtcApi("matches", { season, eventCode: options.eventCode }, { matches: matches.filter((match) => match.eventCode === options.eventCode) });
    case "rankings":
      return requestFtcApi("rankings", { season, eventCode: options.eventCode }, { rankings: rankings.filter((row) => row.eventCode === options.eventCode) });
    case "awards":
      return requestFtcApi("awards", { season, eventCode: options.eventCode }, { awards: awards.filter((award) => award.eventCode === options.eventCode) });
    default:
      throw new Error(`Unsupported sync scope: ${scope}`);
  }
}
