import "server-only";

export type FtcScoutTeam = {
  number: number;
  name: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
};

export type FtcScoutEvent = {
  season: number;
  code: string;
  name: string;
  type?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
};

type FtcScoutSearchPayload = {
  teams: FtcScoutTeam[];
  events: FtcScoutEvent[];
  fetchedAt: string;
};

const FTCScoutSearchQuery = `
  query CombinedSearch($season: Int!) {
    eventsSearch(season: $season) {
      season
      code
      name
      type
      location {
        city
        state
        country
      }
    }
    teamsSearch {
      number
      name
      location {
        city
        state
        country
      }
    }
  }
`;

const CACHE = new Map<number, FtcScoutSearchPayload>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getFtcScoutSearchData(season: number): Promise<FtcScoutSearchPayload> {
  const cached = CACHE.get(season);
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_TTL_MS) return cached;

  const response = await fetch("https://api.ftcscout.org/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      query: FTCScoutSearchQuery,
      variables: { season },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`FTCScout API request failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as {
    data?: {
      teamsSearch?: FtcScoutTeam[];
      eventsSearch?: FtcScoutEvent[];
    };
    errors?: Array<{ message?: string }>;
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).filter(Boolean).join("; ") || "FTCScout API returned an error.");
  }

  const payload = {
    teams: json.data?.teamsSearch ?? [],
    events: json.data?.eventsSearch ?? [],
    fetchedAt: new Date().toISOString(),
  };

  CACHE.set(season, payload);
  return payload;
}

export async function getFtcScoutTeam(teamNumber: number, season: number) {
  const data = await getFtcScoutSearchData(season);
  return data.teams.find((team) => team.number === teamNumber);
}
