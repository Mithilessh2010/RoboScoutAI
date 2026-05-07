import "server-only";
import type { FtcApiRequestOptions } from "./types";

export function endpointFor(kind: string, options: FtcApiRequestOptions = {}) {
  const season = options.season ?? new Date().getFullYear();
  const eventCode = options.eventCode;

  switch (kind) {
    case "seasons":
      return "/v2.0";
    case "teams":
      return `/v2.0/${season}/teams`;
    case "events":
      return `/v2.0/${season}/events`;
    case "matches":
      if (!eventCode) throw new Error("eventCode is required for FTC matches");
      return `/v2.0/${season}/matches/${eventCode}`;
    case "rankings":
      if (!eventCode) throw new Error("eventCode is required for FTC rankings");
      return `/v2.0/${season}/rankings/${eventCode}`;
    case "awards":
      if (!eventCode) throw new Error("eventCode is required for FTC awards");
      return `/v2.0/${season}/awards/${eventCode}`;
    default:
      throw new Error(`Unsupported FTC API endpoint: ${kind}`);
  }
}

export function cacheKeyFor(kind: string, options: FtcApiRequestOptions = {}) {
  const params = options.params ? new URLSearchParams(Object.entries(options.params).flatMap(([key, value]) => (value === undefined ? [] : [[key, String(value)]]))).toString() : "";
  return [kind, options.season, options.eventCode, options.teamNumber, params].filter(Boolean).join(":");
}
