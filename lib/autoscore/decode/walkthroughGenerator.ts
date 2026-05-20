import type { AutoscoreTimelineEvent, DecodeScoringResult, RampCountState } from "./types";

function timestampLabel(timestamp: number) {
  const minutes = Math.floor(timestamp / 60);
  const seconds = timestamp - minutes * 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

function rampChangeForEvent(event: AutoscoreTimelineEvent, rampCounts: RampCountState[]) {
  if (!event.relatedRampChangeId) return null;
  return rampCounts.find((state) => state.relatedRampChangeId === event.relatedRampChangeId) ?? null;
}

export function generateWalkthrough(result: DecodeScoringResult) {
  const lines: string[] = [];
  lines.push("# DECODE Autoscore Walkthrough");
  lines.push("");
  for (const event of result.events) {
    const rampChange = rampChangeForEvent(event, result.rampCounts);
    const points = event.points > 0 ? `+${event.points}` : "0";
    lines.push(`## ${timestampLabel(event.timestamp)} - ${event.alliance ?? "Review"} ${event.eventType} ${points}`);
    lines.push(`Confidence: ${Math.round(event.confidence * 100)}%`);
    lines.push(event.reason);
    if (rampChange) {
      lines.push(`Ramp count: ${rampChange.previousStableCount} -> ${rampChange.stableCount} (${rampChange.alliance})`);
    }
    if (event.relatedTrackIds?.length) {
      lines.push(`Related track IDs: ${event.relatedTrackIds.join(", ")}`);
    }
    lines.push("");
  }
  if (result.warnings.length) {
    lines.push("## Review Warnings");
    for (const warning of result.warnings) lines.push(`- ${warning}`);
  }
  return lines.join("\n");
}
