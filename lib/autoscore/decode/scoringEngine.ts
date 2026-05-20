import { DECODE_SCORING, decodePhaseAt } from "../../game-config/decode";
import { buildArtifactTracks, trackHasPathEvidence } from "./artifactTracking";
import { dedupeScoringEvents } from "./eventDedupe";
import { buildRampCounts, smoothRampCounts } from "./rampCountEngine";
import { buildScoreBreakdown } from "./scoreBreakdown";
import { filterArtifactDetections } from "./zoneUtils";
import type {
  Alliance,
  ArtifactTrack,
  AutoscoreTimelineEvent,
  DecodeScoringConfig,
  DecodeScoringResult,
  Detection,
  ManualGateEvent,
  RampCountState,
  ZoneShape,
} from "./types";
import { DEFAULT_DECODE_SCORING_CONFIG } from "./types";

export { DECODE_SCORING, smoothRampCounts };

function classifiedPoints(timestamp: number) {
  return decodePhaseAt(timestamp) === "AUTO" ? DECODE_SCORING.auto.classifiedArtifactPoints : DECODE_SCORING.teleop.classifiedArtifactPoints;
}

function overflowPoints(timestamp: number) {
  return decodePhaseAt(timestamp) === "AUTO" ? DECODE_SCORING.auto.overflowArtifactPoints : DECODE_SCORING.teleop.overflowArtifactPoints;
}

function rampEntryTime(track: ArtifactTrack, alliance: Alliance) {
  return alliance === "red" ? track.enteredRampRedAt : track.enteredRampBlueAt;
}

function pathTime(track: ArtifactTrack, alliance: Alliance) {
  const basket = alliance === "red" ? track.enteredBasketRedAt : track.enteredBasketBlueAt;
  const tunnel = alliance === "red" ? track.enteredTunnelRedAt : track.enteredTunnelBlueAt;
  return tunnel ?? basket;
}

function recentPathTracks(tracks: ArtifactTrack[], alliance: Alliance, timestamp: number, lookbackSeconds: number) {
  return tracks.filter((track) => !track.likelyScored && trackHasPathEvidence(track, alliance, timestamp, lookbackSeconds));
}

function gateEventNearDrop(gateEvents: ManualGateEvent[], state: RampCountState, config: DecodeScoringConfig) {
  return gateEvents.find(
    (gateEvent) =>
      gateEvent.alliance === state.alliance &&
      Math.abs(gateEvent.timestamp - state.timestamp) <= config.gateReleaseWindowSeconds,
  );
}

export function runDecodeScoringEngine(input: {
  detections: Detection[];
  zones: ZoneShape[];
  manualGateEvents?: ManualGateEvent[];
  config?: Partial<DecodeScoringConfig>;
}): DecodeScoringResult {
  const config = { ...DEFAULT_DECODE_SCORING_CONFIG, ...(input.config ?? {}) };
  const filteredDetections = filterArtifactDetections(input.detections, input.zones, config.confidenceThresholds);
  const tracks = buildArtifactTracks(filteredDetections, config);
  const frameNumbers = [...new Set(filteredDetections.map((detection) => detection.frameNumber))].sort((a, b) => a - b);
  const rampCounts = buildRampCounts(tracks, frameNumbers, config);
  const warnings: string[] = [];
  const rawEvents: AutoscoreTimelineEvent[] = [];
  const lastClassifiedAt: Record<Alliance, number> = { red: -999, blue: -999 };
  const lastOverflowAt: Record<Alliance, number> = { red: -999, blue: -999 };
  let rampCountChanges = 0;
  let undercountCorrections = 0;
  let overflowCandidates = 0;

  for (const state of rampCounts) {
    if (state.warning) warnings.push(`${state.alliance} ramp count exceeded 9 near ${state.timestamp.toFixed(2)}s`);
    if (state.countDelta < 0) {
      const gateEvent = gateEventNearDrop(input.manualGateEvents ?? [], state, config);
      const eventType = gateEvent ? "ramp_artifacts_released" : "ramp_count_drop_unexplained";
      if (!gateEvent) {
        warnings.push(
          `${state.alliance} ramp count dropped from ${state.previousStableCount} to ${state.stableCount} near ${state.timestamp.toFixed(2)}s; review gate/release.`,
        );
      }
      rawEvents.push({
        eventId: `${state.alliance}-${eventType}-${state.frameNumber}`,
        timestamp: state.timestamp,
        frameNumber: state.frameNumber,
        frame_number: state.frameNumber,
        phase: decodePhaseAt(state.timestamp),
        eventType,
        alliance: state.alliance,
        points: 0,
        confidence: gateEvent ? 0.82 : 0.6,
        reason: gateEvent
          ? `${state.alliance} ramp count dropped ${state.previousStableCount} -> ${state.stableCount} after a manual gate event; no points were removed.`
          : `${state.alliance} ramp count dropped ${state.previousStableCount} -> ${state.stableCount}; no points were removed.`,
        relatedTrackIds: state.relatedTrackIds,
        relatedRampChangeId: state.relatedRampChangeId,
      });
      continue;
    }
    if (state.countDelta <= 0) continue;
    if (state.timestamp - lastClassifiedAt[state.alliance] < config.countChangeCooldownSeconds && state.countDelta === 0) continue;

    const evidenceTracks = recentPathTracks(tracks, state.alliance, state.timestamp, config.lookBackSecondsForPathEvidence);
    const confidence = evidenceTracks.length ? 0.88 : 0.55;
    if (!evidenceTracks.length) {
      warnings.push(
        `${state.alliance} ramp increased ${state.previousStableCount} -> ${state.stableCount} near ${state.timestamp.toFixed(2)}s without basket/tunnel evidence.`,
      );
    }
    rampCountChanges += 1;
    if (state.countDelta > 1) undercountCorrections += state.countDelta - 1;

    const candidateTracks = tracks
      .filter((track) => !track.likelyScored && track.zonesVisited.includes(`ramp_${state.alliance}`))
      .sort((a, b) => {
        const aEvidence = evidenceTracks.includes(a) ? 0 : 1;
        const bEvidence = evidenceTracks.includes(b) ? 0 : 1;
        const aRampTime = rampEntryTime(a, state.alliance) ?? state.timestamp;
        const bRampTime = rampEntryTime(b, state.alliance) ?? state.timestamp;
        return aEvidence - bEvidence || Math.abs(aRampTime - state.timestamp) - Math.abs(bRampTime - state.timestamp) || b.confidenceAverage - a.confidenceAverage;
      });

    for (let offset = 0; offset < state.countDelta; offset += 1) {
      const track = candidateTracks[offset];
      if (track) track.likelyScored = true;
      rawEvents.push({
        eventId: `${state.alliance}-classified-${state.frameNumber}-${offset}`,
        timestamp: state.timestamp,
        frameNumber: state.frameNumber,
        frame_number: state.frameNumber,
        phase: decodePhaseAt(state.timestamp),
        eventType: "classified",
        alliance: state.alliance,
        artifactColor: track?.artifactColor ?? "unknown",
        points: classifiedPoints(state.timestamp),
        confidence,
        reason: `${state.alliance} ramp count increased from ${state.previousStableCount} to ${state.stableCount} after scoring-path activity.`,
        relatedTrackIds: track ? [track.trackId] : [],
        relatedRampChangeId: state.relatedRampChangeId,
      });
    }
    state.processed = true;
    lastClassifiedAt[state.alliance] = state.timestamp;
  }

  const classifiedTrackIds = new Set(rawEvents.flatMap((event) => (event.eventType === "classified" ? event.relatedTrackIds ?? [] : [])));
  for (const track of tracks) {
    if (classifiedTrackIds.has(track.trackId) || track.likelyScored) continue;
    for (const alliance of ["red", "blue"] as Alliance[]) {
      const scorePathTime = pathTime(track, alliance);
      if (scorePathTime == null) continue;
      const nearbyClassified = rawEvents.some(
        (event) =>
          event.alliance === alliance &&
          event.eventType === "classified" &&
          event.timestamp >= scorePathTime &&
          event.timestamp <= scorePathTime + config.lookForwardSecondsAfterTunnel,
      );
      if (nearbyClassified) continue;
      const enteredRampAt = rampEntryTime(track, alliance);
      if (enteredRampAt != null && enteredRampAt <= scorePathTime + config.lookForwardSecondsAfterTunnel) continue;
      if (scorePathTime - lastOverflowAt[alliance] < 0.5) continue;

      const rampNearFull = rampCounts.some(
        (state) =>
          state.alliance === alliance &&
          Math.abs(state.timestamp - scorePathTime) <= config.lookForwardSecondsAfterTunnel &&
          state.stableCount >= 9,
      );
      overflowCandidates += 1;
      track.likelyScored = true;
      rawEvents.push({
        eventId: `${alliance}-overflow-${track.trackId}`,
        timestamp: scorePathTime + config.lookForwardSecondsAfterTunnel,
        frameNumber: track.lastFrame,
        frame_number: track.lastFrame,
        phase: decodePhaseAt(scorePathTime + config.lookForwardSecondsAfterTunnel),
        eventType: "overflow",
        alliance,
        artifactColor: track.artifactColor,
        points: overflowPoints(scorePathTime),
        confidence: rampNearFull || track.enteredTunnelRedAt != null || track.enteredTunnelBlueAt != null ? 0.75 : 0.55,
        reason: `${alliance} artifact traveled through scoring path but ramp count did not increase within ${config.lookForwardSecondsAfterTunnel}s.`,
        relatedTrackIds: [track.trackId],
      });
      lastOverflowAt[alliance] = scorePathTime;
      break;
    }
  }

  const { events, duplicateEventsRemoved } = dedupeScoringEvents(rawEvents);
  const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp || a.eventId.localeCompare(b.eventId));
  return {
    tracks,
    rampCounts,
    events: sortedEvents,
    scoreBreakdown: buildScoreBreakdown(sortedEvents),
    warnings: [...new Set(warnings)],
    debug: {
      processedFrames: frameNumbers.length,
      rawDetectionCount: input.detections.length,
      filteredDetectionCount: filteredDetections.length,
      trackCount: tracks.length,
      rampCountChanges,
      duplicateEventsRemoved,
      undercountCorrections,
      overflowCandidates,
    },
  };
}
