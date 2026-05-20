import type { Alliance, ArtifactTrack, DecodeScoringConfig, RampCountState } from "./types";

export function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function smoothRampCounts(counts: number[], windowSize = 5) {
  const half = Math.max(1, Math.floor(windowSize / 2));
  return counts.map((_, index) => median(counts.slice(Math.max(0, index - half), Math.min(counts.length, index + half + 1))));
}

export function buildRampCounts(tracks: ArtifactTrack[], frameNumbers: number[], config: DecodeScoringConfig): RampCountState[] {
  const states: RampCountState[] = [];

  for (const alliance of ["red", "blue"] as Alliance[]) {
    const rampZone = `ramp_${alliance}`;
    const rawCounts: number[] = [];
    const timestamps: number[] = [];
    const relatedTracksByFrame: number[][] = [];

    for (const frameNumber of frameNumbers) {
      const relatedTrackIds = new Set<number>();
      let timestamp = 0;
      for (const track of tracks) {
        const point = track.path.find((pathPoint) => pathPoint.frameNumber === frameNumber);
        if (!point) continue;
        timestamp = Math.max(timestamp, point.timestamp);
        if (point.zones.includes(rampZone)) relatedTrackIds.add(track.trackId);
      }
      rawCounts.push(relatedTrackIds.size);
      relatedTracksByFrame.push([...relatedTrackIds].sort((a, b) => a - b));
      timestamps.push(timestamp);
    }

    const stableCounts = smoothRampCounts(rawCounts, config.rampCountWindowFrames);
    let previousStableCount = stableCounts[0] ?? 0;
    for (let index = 0; index < frameNumbers.length; index += 1) {
      const stableCount = stableCounts[index] ?? 0;
      states.push({
        alliance,
        timestamp: timestamps[index] ?? 0,
        frameNumber: frameNumbers[index],
        rawCount: rawCounts[index] ?? 0,
        stableCount,
        previousStableCount,
        countDelta: index === 0 ? 0 : stableCount - previousStableCount,
        confidence: stableCount === rawCounts[index] ? 0.85 : 0.65,
        relatedTrackIds: relatedTracksByFrame[index] ?? [],
        relatedRampChangeId: `${alliance}:${frameNumbers[index]}:${previousStableCount}->${stableCount}`,
        processed: false,
        warning: stableCount > 9 ? "ramp_count_exceeded_9" : undefined,
      });
      previousStableCount = stableCount;
    }
  }

  return states.sort((a, b) => a.frameNumber - b.frameNumber || a.alliance.localeCompare(b.alliance));
}
