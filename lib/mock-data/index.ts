import type {
  AutoscoreJob,
  AutoscoreSuggestion,
  Award,
  Event,
  Match,
  Picklist,
  Ranking,
  ScoutingReport,
  Season,
  StreamLink,
  Team,
  TeamSeason,
  TimelineEvent,
  VideoUpload,
} from "@/lib/types";

export const seasons: Season[] = [
  { id: "2025-2026", year: 2025, name: "2025-2026", gameName: "DECODE", current: true, kickoff: "2025-09-06" },
  { id: "2024-2025", year: 2024, name: "2024-2025", gameName: "INTO THE DEEP", kickoff: "2024-09-07" },
  { id: "2023-2024", year: 2023, name: "2023-2024", gameName: "CENTERSTAGE", kickoff: "2023-09-09" },
];

export const teams: Team[] = [
  { number: 724, name: "RedNek Robotics Wun", city: "Sun River", state: "MT", country: "USA", rookieYear: 2010 },
  { number: 8375, name: "Vulcan Robotics", city: "Austin", state: "TX", country: "USA", rookieYear: 2015 },
  { number: 8644, name: "Brainstormers", city: "San Jose", state: "CA", country: "USA", rookieYear: 2015 },
  { number: 9889, name: "Cruise Control", city: "Irvine", state: "CA", country: "USA", rookieYear: 2016 },
  { number: 10015, name: "RoboDragons", city: "Seattle", state: "WA", country: "USA", rookieYear: 2016 },
  { number: 11047, name: "Circuit Breakers", city: "Plano", state: "TX", country: "USA", rookieYear: 2017 },
  { number: 11212, name: "Lightning Robotics", city: "Portland", state: "OR", country: "USA", rookieYear: 2017 },
  { number: 12518, name: "Aluminum Falcons", city: "Denver", state: "CO", country: "USA", rookieYear: 2018 },
  { number: 13406, name: "TeraBridges", city: "Fremont", state: "CA", country: "USA", rookieYear: 2018 },
  { number: 14259, name: "Quantum Quokkas", city: "Boston", state: "MA", country: "USA", rookieYear: 2019 },
  { number: 14725, name: "Cyber Knights", city: "Atlanta", state: "GA", country: "USA", rookieYear: 2019 },
  { number: 15167, name: "Pixel Pirates", city: "San Diego", state: "CA", country: "USA", rookieYear: 2020 },
  { number: 16072, name: "Neon Narwhals", city: "Las Vegas", state: "NV", country: "USA", rookieYear: 2021 },
  { number: 17189, name: "Code Red", city: "Chicago", state: "IL", country: "USA", rookieYear: 2021 },
  { number: 18325, name: "Gearshift", city: "Phoenix", state: "AZ", country: "USA", rookieYear: 2022 },
  { number: 19087, name: "Midnight Mechanics", city: "Reno", state: "NV", country: "USA", rookieYear: 2023 },
  { number: 20112, name: "Signal Boost", city: "Boise", state: "ID", country: "USA", rookieYear: 2024 },
  { number: 21345, name: "Circuit Bloom", city: "Oakland", state: "CA", country: "USA", rookieYear: 2025 },
];

const currentTeams = teams.map((team) => team.number);
const pastTeams = teams.slice(0, 14).map((team) => team.number);

export const teamSeasons: TeamSeason[] = seasons.flatMap((season) =>
  (season.current ? currentTeams : pastTeams).map((teamNumber, index) => ({
    season: season.id,
    teamNumber,
    events: index % 3 === 0 ? [`${season.year}ca-sj`, `${season.year}tx-aus`] : [`${season.year}ca-sj`],
    notes: index % 4 === 0 ? "Reliable drivetrain and consistent endgame attempts." : undefined,
  })),
);

export const events: Event[] = [
  { code: "2025ca-sj", season: "2025-2026", name: "Bay Area DECODE Qualifier", city: "San Jose", state: "CA", venue: "Civic Robotics Center", startDate: "2025-11-15", endDate: "2025-11-16", teamNumbers: currentTeams.slice(0, 12) },
  { code: "2025tx-aus", season: "2025-2026", name: "Lone Star DECODE League Meet", city: "Austin", state: "TX", venue: "Hill Country Fieldhouse", startDate: "2025-12-06", endDate: "2025-12-06", teamNumbers: currentTeams.slice(3, 18) },
  { code: "2025nv-lv", season: "2025-2026", name: "Desert Robotics Invitational", city: "Las Vegas", state: "NV", venue: "Silver Dome", startDate: "2026-01-10", endDate: "2026-01-11", teamNumbers: currentTeams.slice(6, 18) },
  { code: "2024ca-sj", season: "2024-2025", name: "Bay Area INTO THE DEEP Qualifier", city: "San Jose", state: "CA", venue: "Civic Robotics Center", startDate: "2024-11-16", endDate: "2024-11-17", teamNumbers: pastTeams },
  { code: "2023ca-sj", season: "2023-2024", name: "Bay Area CENTERSTAGE Qualifier", city: "San Jose", state: "CA", venue: "Civic Robotics Center", startDate: "2023-11-18", endDate: "2023-11-19", teamNumbers: pastTeams.slice(0, 12) },
];

function makeMatches(season: string, eventCode: string, eventTeams: number[]): Match[] {
  return Array.from({ length: 14 }, (_, i) => {
    const t = (offset: number) => eventTeams[(i * 3 + offset) % eventTeams.length];
    const redAuto = 10 + ((i * 7) % 20);
    const blueAuto = 8 + ((i * 5) % 20);
    const redTeleop = 42 + ((i * 13) % 45);
    const blueTeleop = 38 + ((i * 11) % 45);
    const redEnd = 10 + ((i * 3) % 20);
    const blueEnd = 8 + ((i * 4) % 20);
    return {
      id: `${eventCode}-qm${i + 1}`,
      season,
      eventCode,
      level: "Qualification",
      matchNumber: i + 1,
      scheduledTime: new Date(
        `${season.slice(0, 4)}-11-${String(15 + Math.floor(i / 8)).padStart(2, "0")}T${String(9 + (i % 8)).padStart(2, "0")}:00:00`,
      ).toISOString(),
      status: i < 11 ? "complete" : "scheduled",
      red: { teams: [t(0), t(1)], auto: redAuto, teleop: redTeleop, endgame: redEnd, score: redAuto + redTeleop + redEnd, rp: i % 3 },
      blue: { teams: [t(2), t(3)], auto: blueAuto, teleop: blueTeleop, endgame: blueEnd, score: blueAuto + blueTeleop + blueEnd, rp: (i + 1) % 3 },
    };
  });
}

export const matches: Match[] = events.flatMap((event) => makeMatches(event.season, event.code, event.teamNumbers));

export const rankings: Ranking[] = events.flatMap((event) =>
  event.teamNumbers.map((teamNumber, index) => ({
    season: event.season,
    eventCode: event.code,
    teamNumber,
    rank: index + 1,
    wins: Math.max(0, 8 - (index % 6)),
    losses: index % 5,
    ties: index % 3 === 0 ? 1 : 0,
    rp: 18 - index,
    tbp: 112 - index * 3,
  })),
);

export const awards: Award[] = [
  { season: "2025-2026", eventCode: "2025ca-sj", teamNumber: 8644, name: "Inspire Award", recipient: "8644 Brainstormers" },
  { season: "2025-2026", eventCode: "2025ca-sj", teamNumber: 9889, name: "Winning Alliance Captain", recipient: "9889 Cruise Control" },
  { season: "2024-2025", eventCode: "2024ca-sj", teamNumber: 724, name: "Think Award", recipient: "724 RedNek Robotics Wun" },
];

export const streamLinks: StreamLink[] = [
  { id: "stream-1", season: "2025-2026", eventCode: "2025ca-sj", field: "Field 1", label: "Bay Area Field 1", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { id: "stream-2", season: "2025-2026", eventCode: "2025ca-sj", field: "Field 2", label: "Bay Area Field 2", url: "https://www.youtube.com/watch?v=21X5lGlDOfg" },
  { id: "stream-3", season: "2025-2026", eventCode: "2025tx-aus", field: "Main Field", label: "Austin Main Field", url: "https://youtu.be/jfKfPfyJRdk" },
];

export const scoutingReports: ScoutingReport[] = [
  { id: "sr-1", season: "2025-2026", eventCode: "2025ca-sj", matchNumber: 4, teamNumber: 8644, alliance: "red", auto: 18, teleop: 48, endgame: 15, penalties: 0, disabled: false, driverSkill: 4, reliability: 5, defense: 2, overall: 5, notes: "Fast cycles, clean intake path, rarely jammed." },
  { id: "sr-2", season: "2025-2026", eventCode: "2025ca-sj", matchNumber: 7, teamNumber: 9889, alliance: "blue", auto: 24, teleop: 42, endgame: 20, penalties: 5, disabled: false, driverSkill: 5, reliability: 4, defense: 3, overall: 4, notes: "Strong auto, sometimes overextends while defending." },
  { id: "sr-3", season: "2025-2026", eventCode: "2025tx-aus", matchNumber: 3, teamNumber: 11047, alliance: "red", auto: 12, teleop: 51, endgame: 10, penalties: 0, disabled: false, driverSkill: 4, reliability: 4, defense: 4, overall: 4, notes: "Useful partner for protected scoring lane control." },
];

export const videoUploads: VideoUpload[] = [
  { id: "video-1", title: "QM4 8644 Focus Cam", season: "2025-2026", eventCode: "2025ca-sj", matchNumber: 4, teamNumber: 8644, url: "https://www.youtube.com/embed/jfKfPfyJRdk" },
  { id: "video-2", title: "QM7 Full Field Review", season: "2025-2026", eventCode: "2025ca-sj", matchNumber: 7, url: "https://www.youtube.com/embed/21X5lGlDOfg" },
];

export const timelineEvents: TimelineEvent[] = [
  { id: "tl-1", videoId: "video-1", timestamp: 18, type: "robot returned to base", teamNumber: 8644, alliance: "red", notes: "Auto base return completed." },
  { id: "tl-2", videoId: "video-1", timestamp: 61, type: "scored artifact", teamNumber: 8644, alliance: "red", notes: "Clean cycle from near side." },
  { id: "tl-3", videoId: "video-1", timestamp: 94, type: "intake fail", teamNumber: 8644, alliance: "red", notes: "Lost 5-6 seconds recovering." },
  { id: "tl-4", videoId: "video-2", timestamp: 132, type: "defense action", teamNumber: 9889, alliance: "blue", notes: "Pinned lane but avoided penalty." },
];

export const autoscoreJobs: AutoscoreJob[] = [
  { id: "auto-1", title: "QM4 experimental review", season: "2025-2026", eventCode: "2025ca-sj", status: "review", confidence: 0.68 },
];

export const autoscoreSuggestions: AutoscoreSuggestion[] = [
  { id: "as-1", jobId: "auto-1", timestamp: 21, type: "artifact detected near goal", confidence: 0.72, status: "pending" },
  { id: "as-2", jobId: "auto-1", timestamp: 74, type: "robot entered base zone", confidence: 0.61, status: "confirmed" },
  { id: "as-3", jobId: "auto-1", timestamp: 118, type: "possible penalty interaction", confidence: 0.44, status: "pending" },
];

export const picklists: Picklist[] = [
  {
    id: "pick-1",
    season: "2025-2026",
    eventCode: "2025ca-sj",
    name: "Bay Area eliminations",
    entries: [
      { rank: 1, teamNumber: 8644, notes: "Highest floor, strong auto." },
      { rank: 2, teamNumber: 9889, notes: "Ceiling pick, verify penalty risk." },
      { rank: 3, teamNumber: 11047, notes: "Defense plus stable teleop." },
    ],
  },
];

export const currentSeason = seasons.find((season) => season.current) ?? seasons[0];

export function getSeason(season = currentSeason.id) {
  return seasons.find((item) => item.id === season) ?? currentSeason;
}

export function getSeasonEvents(season = currentSeason.id) {
  return events.filter((event) => event.season === season);
}

export function getEvent(eventCode: string, season?: string) {
  return events.find((event) => event.code === eventCode && (!season || event.season === season));
}

export function getTeam(teamNumber: number) {
  return teams.find((team) => team.number === teamNumber);
}

export function getSeasonTeams(season = currentSeason.id) {
  const active = new Set(teamSeasons.filter((item) => item.season === season).map((item) => item.teamNumber));
  return teams.filter((team) => active.has(team.number));
}

export function getEventMatches(eventCode: string) {
  return matches.filter((match) => match.eventCode === eventCode).sort((a, b) => a.matchNumber - b.matchNumber);
}

export function getTeamMatches(teamNumber: number, season?: string) {
  return matches.filter((match) => (!season || match.season === season) && [...match.red.teams, ...match.blue.teams].includes(teamNumber));
}
