import type { AutoscoreTimelineEvent } from "./types";

export function dedupeScoringEvents(events: AutoscoreTimelineEvent[]) {
  const deduped: AutoscoreTimelineEvent[] = [];
  let duplicateEventsRemoved = 0;

  for (const event of [...events].sort((a, b) => a.timestamp - b.timestamp || a.eventId.localeCompare(b.eventId))) {
    const duplicate = deduped.find((existing) => {
      if (existing.alliance !== event.alliance) return false;
      if (existing.eventType !== event.eventType) return false;
      if (Math.abs(existing.timestamp - event.timestamp) > 2) return false;
      const sharedTracks = new Set(existing.relatedTrackIds ?? []);
      const hasSharedTrack = (event.relatedTrackIds ?? []).some((trackId) => sharedTracks.has(trackId));
      const sameEventId = existing.eventId === event.eventId;
      const sameNonClassifiedRampChange =
        existing.eventType !== "classified" && existing.relatedRampChangeId != null && existing.relatedRampChangeId === event.relatedRampChangeId;
      return sameEventId || hasSharedTrack || sameNonClassifiedRampChange;
    });

    if (!duplicate) {
      deduped.push(event);
      continue;
    }

    duplicateEventsRemoved += 1;
    duplicate.confidence = Math.max(duplicate.confidence, event.confidence);
    duplicate.reason = `${duplicate.reason}; merged duplicate evidence: ${event.reason}`;
  }

  return { events: deduped, duplicateEventsRemoved };
}
