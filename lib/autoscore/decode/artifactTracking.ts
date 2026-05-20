import type { ArtifactTrack, DecodeScoringConfig, FilteredDetection, ZoneType } from "./types";
import type { Detection } from "./types";

export function artifactColorOf(detection: Detection) {
  if (detection.artifactColor === "green" || detection.className.includes("green")) return "green";
  if (detection.artifactColor === "purple" || detection.className.includes("purple")) return "purple";
  return null;
}

export function artifactDetections(detections: Detection[]) {
  return detections.filter((detection) => artifactColorOf(detection) !== null);
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function setEnteredTime(track: ArtifactTrack, zoneType: ZoneType, timestamp: number) {
  if (zoneType === "basket_red" && track.enteredBasketRedAt == null) track.enteredBasketRedAt = timestamp;
  if (zoneType === "basket_blue" && track.enteredBasketBlueAt == null) track.enteredBasketBlueAt = timestamp;
  if ((zoneType === "tunnel_red" || zoneType === "secret_tunnel_red") && track.enteredTunnelRedAt == null) track.enteredTunnelRedAt = timestamp;
  if ((zoneType === "tunnel_blue" || zoneType === "secret_tunnel_blue") && track.enteredTunnelBlueAt == null) track.enteredTunnelBlueAt = timestamp;
  if (zoneType === "ramp_red" && track.enteredRampRedAt == null) track.enteredRampRedAt = timestamp;
  if (zoneType === "ramp_blue" && track.enteredRampBlueAt == null) track.enteredRampBlueAt = timestamp;
}

export function buildArtifactTracks(detections: FilteredDetection[], config: DecodeScoringConfig): ArtifactTrack[] {
  const tracks: ArtifactTrack[] = [];
  let nextTrackId = 1;
  const frames = [...new Set(detections.map((detection) => detection.frameNumber))].sort((a, b) => a - b);

  for (const frameNumber of frames) {
    const frameDetections = detections.filter((detection) => detection.frameNumber === frameNumber);
    const assignedTrackIds = new Set<number>();

    for (const detection of frameDetections) {
      let bestTrack: ArtifactTrack | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const track of tracks) {
        if (assignedTrackIds.has(track.trackId)) continue;
        if (track.artifactColor !== detection.artifactColor) continue;
        const missingFrames = frameNumber - track.lastFrame;
        if (missingFrames <= 0 || missingFrames > config.maxMissingFrames) continue;
        const predicted = {
          x: track.lastCenter.x + track.velocity.x * Math.max(1, missingFrames),
          y: track.lastCenter.y + track.velocity.y * Math.max(1, missingFrames),
        };
        const candidateDistance = distance(predicted, { x: detection.centerX, y: detection.centerY });
        const dynamicLimit = config.maxTrackDistanceNormalized * (1 + Math.min(missingFrames, config.maxMissingFrames) * 0.2);
        if (candidateDistance <= dynamicLimit && candidateDistance < bestDistance) {
          bestTrack = track;
          bestDistance = candidateDistance;
        }
      }

      if (!bestTrack) {
        bestTrack = {
          trackId: nextTrackId++,
          artifactColor: detection.artifactColor,
          firstSeenTimestamp: detection.timestamp,
          lastSeenTimestamp: detection.timestamp,
          firstFrame: frameNumber,
          lastFrame: frameNumber,
          lastCenter: { x: detection.centerX, y: detection.centerY },
          velocity: { x: 0, y: 0 },
          path: [],
          zonesVisited: [],
          zonesVisitedInOrder: [],
          currentZone: null,
          confidenceAverage: 0,
          missedFrameCount: 0,
          likelyScored: false,
        };
        tracks.push(bestTrack);
      }

      const missingFrames = Math.max(1, frameNumber - bestTrack.lastFrame);
      const observedVelocity = {
        x: (detection.centerX - bestTrack.lastCenter.x) / missingFrames,
        y: (detection.centerY - bestTrack.lastCenter.y) / missingFrames,
      };
      bestTrack.velocity = {
        x: bestTrack.velocity.x * 0.55 + observedVelocity.x * 0.45,
        y: bestTrack.velocity.y * 0.55 + observedVelocity.y * 0.45,
      };
      bestTrack.lastFrame = frameNumber;
      bestTrack.lastSeenTimestamp = detection.timestamp;
      bestTrack.lastCenter = { x: detection.centerX, y: detection.centerY };
      bestTrack.path.push({
        frameNumber,
        timestamp: detection.timestamp,
        x: detection.centerX,
        y: detection.centerY,
        zones: detection.zones,
        detectionId: detection._id,
      });
      bestTrack.currentZone = detection.zones[0] ?? null;
      bestTrack.confidenceAverage =
        (bestTrack.confidenceAverage * Math.max(0, bestTrack.path.length - 1) + detection.confidence) / bestTrack.path.length;

      for (const zoneType of detection.zones) {
        if (!bestTrack.zonesVisited.includes(zoneType)) {
          bestTrack.zonesVisited.push(zoneType);
          bestTrack.zonesVisitedInOrder.push({ zoneType, timestamp: detection.timestamp, frameNumber });
        }
        setEnteredTime(bestTrack, zoneType, detection.timestamp);
      }
      assignedTrackIds.add(bestTrack.trackId);
    }
  }

  const lastFrame = frames.at(-1) ?? 0;
  for (const track of tracks) {
    track.missedFrameCount = Math.max(0, lastFrame - track.lastFrame);
  }
  return tracks;
}

export function trackHasPathEvidence(track: ArtifactTrack, alliance: "red" | "blue", beforeTimestamp: number, lookbackSeconds: number) {
  const basketZone = `basket_${alliance}`;
  const tunnelZones = new Set([`tunnel_${alliance}`, `secret_tunnel_${alliance}`]);
  let hasBasket = false;
  let hasTunnel = false;
  for (const visit of track.zonesVisitedInOrder) {
    if (visit.timestamp > beforeTimestamp || visit.timestamp < beforeTimestamp - lookbackSeconds) continue;
    if (visit.zoneType === basketZone) hasBasket = true;
    if (tunnelZones.has(visit.zoneType)) hasTunnel = true;
  }
  return hasBasket || hasTunnel;
}
