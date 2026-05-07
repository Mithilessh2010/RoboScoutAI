export type AllianceColor = "red" | "blue";

export type Season = {
  id: string;
  year: number;
  name: string;
  gameName: string;
  current?: boolean;
  kickoff: string;
};

export type Team = {
  number: number;
  name: string;
  city: string;
  state: string;
  country: string;
  rookieYear: number;
};

export type TeamSeason = {
  season: string;
  teamNumber: number;
  events: string[];
  notes?: string;
};

export type Event = {
  code: string;
  season: string;
  name: string;
  city: string;
  state: string;
  venue: string;
  startDate: string;
  endDate: string;
  teamNumbers: number[];
};

export type MatchAlliance = {
  teams: number[];
  score: number;
  auto?: number;
  teleop?: number;
  endgame?: number;
  rp?: number;
};

export type Match = {
  id: string;
  season: string;
  eventCode: string;
  level: "Qualification" | "Semifinal" | "Final";
  matchNumber: number;
  scheduledTime: string;
  red: MatchAlliance;
  blue: MatchAlliance;
  status: "scheduled" | "complete";
};

export type Ranking = {
  season: string;
  eventCode: string;
  teamNumber: number;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  rp: number;
  tbp: number;
};

export type Award = {
  season: string;
  eventCode: string;
  teamNumber?: number;
  name: string;
  recipient: string;
};

export type StreamLink = {
  id: string;
  season: string;
  eventCode?: string;
  label: string;
  url: string;
  field?: string;
};

export type ScoutingReport = {
  id: string;
  season: string;
  eventCode: string;
  matchNumber: number;
  teamNumber: number;
  alliance: AllianceColor;
  auto: number;
  teleop: number;
  endgame: number;
  penalties: number;
  disabled: boolean;
  driverSkill: number;
  reliability: number;
  defense: number;
  overall: number;
  notes: string;
};

export type VideoUpload = {
  id: string;
  title: string;
  season: string;
  eventCode: string;
  matchNumber: number;
  teamNumber?: number;
  url: string;
};

export type TimelineEvent = {
  id: string;
  videoId: string;
  timestamp: number;
  type: string;
  teamNumber?: number;
  alliance?: AllianceColor;
  notes: string;
};

export type AutoscoreSuggestion = {
  id: string;
  jobId: string;
  timestamp: number;
  type: string;
  confidence: number;
  status: "pending" | "confirmed" | "corrected";
};

export type AutoscoreJob = {
  id: string;
  title: string;
  season: string;
  eventCode?: string;
  status: "uploaded" | "analyzing" | "review";
  confidence: number;
};

export type PicklistEntry = {
  teamNumber: number;
  notes: string;
  rank: number;
};

export type Picklist = {
  id: string;
  season: string;
  eventCode: string;
  name: string;
  entries: PicklistEntry[];
};
