import type { Alliance, AutoscoreTimelineEvent, ScoreBreakdown, ScoreBreakdownAlliance } from "./types";

export function scoreTotal(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

function emptyAllianceBreakdown(): ScoreBreakdownAlliance {
  return {
    auto: 0,
    teleop: 0,
    endgame: 0,
    classified: 0,
    overflow: 0,
    depot: 0,
    pattern: 0,
    base: 0,
    penalties: 0,
    total: 0,
  };
}

export function buildScoreBreakdown(events: AutoscoreTimelineEvent[]): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    red: emptyAllianceBreakdown(),
    blue: emptyAllianceBreakdown(),
  };

  for (const event of events) {
    if (!event.alliance || event.points === 0) continue;
    const alliance = event.alliance as Alliance;
    const target = breakdown[alliance];
    if (event.phase === "AUTO") target.auto += event.points;
    else if (event.phase === "TELEOP") target.teleop += event.points;
    else target.endgame += event.points;

    if (event.eventType === "classified") target.classified += event.points;
    else if (event.eventType === "overflow") target.overflow += event.points;
    else if (event.eventType === "depot") target.depot += event.points;
    else if (event.eventType === "pattern") target.pattern += event.points;
    else if (event.eventType === "base") target.base += event.points;
    else if (event.eventType === "penalty") target.penalties += event.points;
    target.total += event.points;
  }

  return breakdown;
}
