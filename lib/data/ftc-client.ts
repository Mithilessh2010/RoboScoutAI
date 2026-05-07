export type FtcApiSuccess<T> = { ok: true; data: T };
export type FtcApiFailure = { ok: false; error: { code: string; message: string; status: number } };
export type FtcApiResponse<T> = FtcApiSuccess<T> | FtcApiFailure;

type QueryValue = string | number | boolean | undefined;

function query(params: Record<string, QueryValue>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

async function get<T>(path: string): Promise<FtcApiResponse<T>> {
  const response = await fetch(path, { cache: "no-store" });
  return (await response.json()) as FtcApiResponse<T>;
}

export function fetchFtcApiIndex<T = unknown>() {
  return get<T>("/api/ftc/index");
}

export function fetchSeasonSummary<T = unknown>(season: number) {
  return get<T>(`/api/ftc/season/${season}`);
}

export function fetchTeams<T = unknown>(params: { season: number; teamNumber?: number; eventCode?: string; state?: string; excludeNonCompeting?: boolean; page?: number }) {
  return get<T>(`/api/ftc/teams${query(params)}`);
}

export function fetchEvents<T = unknown>(params: { season: number; eventCode?: string; teamNumber?: number }) {
  return get<T>(`/api/ftc/events${query(params)}`);
}

export function fetchSchedule<T = unknown>(params: { season: number; eventCode: string; tournamentLevel?: string; teamNumber?: number; start?: number; end?: number }) {
  return get<T>(`/api/ftc/schedule${query(params)}`);
}

export function fetchHybridSchedule<T = unknown>(params: { season: number; eventCode: string; tournamentLevel: string; start?: number; end?: number }) {
  return get<T>(`/api/ftc/schedule/hybrid${query(params)}`);
}

export function fetchRankings<T = unknown>(params: { season: number; eventCode: string; teamNumber?: number; top?: number }) {
  return get<T>(`/api/ftc/rankings${query(params)}`);
}

export function fetchMatches<T = unknown>(params: { season: number; eventCode: string; tournamentLevel?: string; teamNumber?: number; matchNumber?: number; start?: number; end?: number }) {
  return get<T>(`/api/ftc/matches${query(params)}`);
}

export function fetchScoreDetails<T = unknown>(params: { season: number; eventCode: string; tournamentLevel: string; teamNumber?: number; matchNumber?: number; start?: number; end?: number }) {
  return get<T>(`/api/ftc/scores${query(params)}`);
}

export function fetchAwards<T = unknown>(params: { season: number; eventCode?: string; teamNumber?: number }) {
  return get<T>(`/api/ftc/awards${query(params)}`);
}
