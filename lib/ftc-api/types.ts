import "server-only";

export type FtcApiStatus = {
  configured: boolean;
  baseUrl: string;
  usernameConfigured: boolean;
  tokenConfigured: boolean;
};

export type FtcApiRequestOptions = {
  season?: string | number;
  eventCode?: string;
  teamNumber?: string | number;
  params?: Record<string, string | number | boolean | undefined>;
};

export type FtcApiCacheEnvelope<T = unknown> = {
  source: "ftc-api" | "database-cache" | "mock-data";
  cached: boolean;
  fetchedAt: string;
  data: T;
  warning?: string;
  error?: string;
};

export type FtcSyncLogEntry = {
  id?: string;
  scope: string;
  season?: string;
  eventCode?: string;
  status: "success" | "error" | "skipped";
  message: string;
  createdAt: string;
};

export type FtcSeasonResponse = {
  seasons?: number[];
  eventCount?: number;
  teamCount?: number;
};

export type FtcTeam = {
  teamNumber: number;
  nameFull?: string;
  nameShort?: string;
  city?: string;
  stateProv?: string;
  country?: string;
  rookieYear?: number;
};

export type FtcEvent = {
  code: string;
  name: string;
  city?: string;
  stateprov?: string;
  country?: string;
  venue?: string;
  dateStart?: string;
  dateEnd?: string;
};

export type FtcMatch = {
  actualStartTime?: string;
  description?: string;
  tournamentLevel?: string;
  series?: number;
  matchNumber: number;
  postResultTime?: string;
  scoreRedFinal?: number;
  scoreBlueFinal?: number;
  teams?: Array<{
    teamNumber: number;
    station: string;
    surrogate?: boolean;
    dq?: boolean;
  }>;
};

export type FtcRanking = {
  teamNumber: number;
  rank: number;
  wins?: number;
  losses?: number;
  ties?: number;
  rankingPoints?: number;
  tieBreakerPoints?: number;
};

export type FtcAward = {
  name: string;
  teamNumber?: number;
  person?: string;
};
