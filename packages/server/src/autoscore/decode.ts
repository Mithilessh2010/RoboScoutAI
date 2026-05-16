// @ts-nocheck
import {
  DECODE_SCORING,
  decodeMatchSeconds,
  decodePhaseAt,
  expectedMotifColor,
} from "./decode-config";
import { connectDB } from "../db/mongodb";
import { AutoscoreCalibrationZone } from "../db/schemas/AutoscoreCalibrationZone";
import { AutoscoreDetection } from "../db/schemas/AutoscoreDetection";
import { AutoscoreGateEvent } from "../db/schemas/AutoscoreGateEvent";
import { AutoscoreJob } from "../db/schemas/AutoscoreJob";
import { AutoscorePenalty } from "../db/schemas/AutoscorePenalty";
import { AutoscoreRampCountState } from "../db/schemas/AutoscoreRampCountState";
import { AutoscoreSummary } from "../db/schemas/AutoscoreSummary";
import { AutoscoreTimelineEvent } from "../db/schemas/AutoscoreTimelineEvent";
import { AutoscoreTrackedArtifact } from "../db/schemas/AutoscoreTrackedArtifact";

const REQUIRED_ZONE_TYPES = [
  "goal_red",
  "goal_blue",
  "classifier_red",
  "classifier_blue",
  "square_red",
  "square_blue",
  "ramp_red",
  "ramp_blue",
  "depot_red",
  "depot_blue",
  "base_red",
  "base_blue",
  "launch_line_red",
  "launch_line_blue",
  "gate_red",
  "gate_blue",
];

export async function runFullDecodeAutoscore(jobId: string) {
  await connectDB();
  let job = await AutoscoreJob.findById(jobId);
  if (!job) throw new Error("Autoscore job not found.");
  await job.updateOne({
    status: "scoring",
    phase: "decode_autoscore",
    errorMessage: null,
  });

  let detections = await AutoscoreDetection.find({ jobId }).sort({
    timestamp: 1,
    confidence: -1,
  });
  let zones = await AutoscoreCalibrationZone.find({ jobId }).lean();
  let penalties = await AutoscorePenalty.find({ jobId }).lean();
  let gateEvents = await AutoscoreGateEvent.find({ jobId })
    .sort({ timestamp: 1 })
    .lean();
  let warnings = requiredZoneWarnings(zones);

  await AutoscoreTimelineEvent.deleteMany({ jobId, manualOverride: false });
  await AutoscoreTrackedArtifact.deleteMany({ jobId });
  await AutoscoreRampCountState.deleteMany({ jobId });

  let frames = buildFrameSnapshots(detections, zones);
  let rampResult = buildRampCountEngine(job._id, frames, gateEvents);
  if (rampResult.states.length)
    await AutoscoreRampCountState.insertMany(rampResult.states);
  warnings.push(...rampResult.warnings);

  let events = [
    ...buildLeaveEvents(job, frames),
    ...rampResult.events,
    ...buildOverflowEvents(job._id, frames, rampResult.states),
    ...buildGateEvents(job._id, gateEvents, rampResult.states),
    ...buildPatternEvents(job, frames, zones),
    ...buildDepotEvents(job._id, frames),
    ...buildBaseEvents(job, frames),
    ...buildPenaltyEvents(penalties),
  ];
  if (events.length) await AutoscoreTimelineEvent.insertMany(events);
  let manualEvents = await AutoscoreTimelineEvent.find({
    jobId,
    manualOverride: true,
  }).lean();
  let summary = await calculateAndSaveSummary(
    jobId,
    [...events, ...manualEvents],
    detections,
    warnings
  );

  await AutoscoreJob.findByIdAndUpdate(jobId, {
    status: warnings.length ? "review_needed" : "complete",
    phase: "decode_autoscore",
  });
  return {
    eventsCreated: events.length,
    summary,
    rampStates: rampResult.states,
    warnings,
  };
}

export async function recalculateDecodeScore(jobId: string) {
  await connectDB();
  let detections = await AutoscoreDetection.find({ jobId }).lean();
  let zones = await AutoscoreCalibrationZone.find({ jobId }).lean();
  let events = await AutoscoreTimelineEvent.find({ jobId }).lean();
  return calculateAndSaveSummary(
    jobId,
    events,
    detections,
    requiredZoneWarnings(zones)
  );
}

function buildFrameSnapshots(detections, zones) {
  let byFrame = new Map();
  for (let detection of detections) {
    let center = normalizedCenter(detection);
    if (!center) continue;
    let key = `${detection.frameNumber}:${detection.timestamp}`;
    if (!byFrame.has(key)) {
      byFrame.set(key, {
        frameNumber: detection.frameNumber,
        timestamp: detection.timestamp,
        detections: [],
        zones: {},
      });
    }
    let frame = byFrame.get(key);
    let artifactColor =
      detection.className === "artifact_green"
        ? "green"
        : detection.className === "artifact_purple"
        ? "purple"
        : null;
    let enriched = { ...detection.toObject(), center, artifactColor };
    frame.detections.push(enriched);
    for (let zone of zones) {
      if (!pointInPolygon(center, zone.coordinates)) continue;
      frame.zones[zone.zoneType] ??= [];
      frame.zones[zone.zoneType].push(enriched);
    }
  }
  return [...byFrame.values()].sort((a, b) => a.timestamp - b.timestamp);
}

function buildRampCountEngine(jobId, frames, gateEvents) {
  let states = [];
  let events = [];
  let warnings = [];
  for (let alliance of ["red", "blue"]) {
    let previousStableCount = 0;
    let recentCounts = [];
    for (let index = 0; index < frames.length; index += 1) {
      let frame = frames[index];
      let rampDetections = artifactsInZone(frame, `ramp_${alliance}`);
      let rawCount = rampDetections.length;
      recentCounts.push(rawCount);
      recentCounts = recentCounts.slice(-3);
      let stableCount = median(recentCounts);
      let countDelta = stableCount - previousStableCount;
      let state = {
        jobId,
        alliance,
        timestamp: frame.timestamp,
        frameNumber: frame.frameNumber,
        rawCount,
        stableCount,
        previousStableCount,
        countDelta,
        confidence: average(rampDetections.map((d) => d.confidence)),
        relatedDetectionIds: rampDetections.map((d) => d._id),
        manualOverride: false,
        warning: null,
      };
      if (countDelta > 0) {
        let pathEvidence = recentPathEvidence(frames, index, alliance);
        for (let n = 0; n < countDelta; n += 1) {
          events.push(
            event(
              jobId,
              frame.timestamp,
              decodePhaseAt(frame.timestamp),
              "classified",
              alliance,
              classifiedPoints(frame.timestamp),
              pathEvidence
                ? Math.max(0.7, state.confidence)
                : Math.max(0.45, state.confidence - 0.15),
              pathEvidence
                ? `${alliance} ramp stable count increased ${previousStableCount} -> ${stableCount} after goal/square activity.`
                : `${alliance} ramp stable count increased ${previousStableCount} -> ${stableCount}; scoring path evidence was weak.`,
              {
                artifactColor: rampDetections[n]?.artifactColor ?? null,
                frameNumber: frame.frameNumber,
                relatedDetectionIds: state.relatedDetectionIds,
              }
            )
          );
        }
      }
      if (countDelta < 0) {
        let gate = nearbyGate(gateEvents, alliance, frame.timestamp);
        let robotGate = recentRobotInZone(frames, index, `gate_${alliance}`);
        if (!gate && robotGate) {
          events.push(
            event(
              jobId,
              frame.timestamp,
              decodePhaseAt(frame.timestamp),
              "gate_opened",
              alliance,
              0,
              robotGate.confidence,
              `Robot detected near ${alliance} gate as ramp count decreased ${previousStableCount} -> ${stableCount}.`,
              { relatedDetectionIds: [robotGate._id] }
            )
          );
          events.push(
            event(
              jobId,
              frame.timestamp,
              decodePhaseAt(frame.timestamp),
              "ramp_artifacts_released",
              alliance,
              0,
              Math.min(
                robotGate.confidence,
                state.confidence || robotGate.confidence
              ),
              `${alliance} ramp count decreased ${previousStableCount} -> ${stableCount} while robot was near gate.`,
              {
                relatedDetectionIds: [
                  robotGate._id,
                  ...state.relatedDetectionIds,
                ],
              }
            )
          );
        } else if (!gate) {
          state.warning = `${alliance} ramp count decreased ${previousStableCount} -> ${stableCount} without manual gate event.`;
          warnings.push(state.warning);
          events.push(
            event(
              jobId,
              frame.timestamp,
              decodePhaseAt(frame.timestamp),
              "ramp_count_drop_unexplained",
              alliance,
              0,
              Math.max(0.25, state.confidence),
              state.warning,
              {
                frameNumber: frame.frameNumber,
                relatedDetectionIds: state.relatedDetectionIds,
              }
            )
          );
        } else {
          state.explainedByGateEventId = gate._id;
        }
      }
      states.push(state);
      previousStableCount = stableCount;
    }
  }
  return { states, events, warnings };
}

function buildOverflowEvents(jobId, frames, states) {
  let rows = [];
  for (let alliance of ["red", "blue"]) {
    let lastOverflowAt = -Infinity;
    for (let index = 0; index < frames.length; index += 1) {
      let frame = frames[index];
      let square = artifactsInZone(frame, `square_${alliance}`);
      if (!square.length || frame.timestamp - lastOverflowAt < 2) continue;
      let matchingState = states.find(
        (state) =>
          state.alliance === alliance && state.frameNumber === frame.frameNumber
      );
      let upcomingIncrease = states.some(
        (state) =>
          state.alliance === alliance &&
          state.timestamp >= frame.timestamp &&
          state.timestamp <= frame.timestamp + 4 &&
          state.countDelta > 0
      );
      if (upcomingIncrease) continue;
      let likelyOverflow =
        (matchingState?.stableCount ?? 0) >= DECODE_SCORING.rampSlots ||
        recentPathEvidence(frames, index, alliance);
      if (!likelyOverflow) continue;
      let detection = square[0];
      rows.push(
        event(
          jobId,
          frame.timestamp,
          decodePhaseAt(frame.timestamp),
          "overflow",
          alliance,
          overflowPoints(frame.timestamp),
          Math.max(0.45, detection.confidence - 0.12),
          `${alliance} square activity occurred but ramp stable count did not increase.`,
          {
            artifactColor: detection.artifactColor,
            frameNumber: frame.frameNumber,
            relatedDetectionIds: [detection._id],
          }
        )
      );
      lastOverflowAt = frame.timestamp;
    }
  }
  return rows;
}

function buildGateEvents(jobId, gateEvents, states) {
  let rows = [];
  for (let gate of gateEvents) {
    rows.push(
      event(
        jobId,
        gate.timestamp,
        decodePhaseAt(gate.timestamp),
        "gate_opened",
        gate.alliance,
        0,
        1,
        gate.note || "Manual gate opened event.",
        { manualOverride: true }
      )
    );
    let before = [...states]
      .reverse()
      .find(
        (state) =>
          state.alliance === gate.alliance && state.timestamp <= gate.timestamp
      );
    let after = states.find(
      (state) =>
        state.alliance === gate.alliance &&
        state.timestamp >= gate.timestamp &&
        state.timestamp <= gate.timestamp + 5 &&
        state.countDelta < 0
    );
    if (before && after) {
      rows.push(
        event(
          jobId,
          after.timestamp,
          decodePhaseAt(after.timestamp),
          "ramp_artifacts_released",
          gate.alliance,
          0,
          0.9,
          `${gate.alliance} ramp count decreased ${before.stableCount} -> ${after.stableCount} after manual gate event.`,
          { manualOverride: true }
        )
      );
    }
  }
  return rows;
}

function buildLeaveEvents(job, frames) {
  let rows = [];
  for (let key of ["redTeam1", "redTeam2", "blueTeam1", "blueTeam2"]) {
    if (job.manualLeave?.[key] !== "yes") continue;
    let alliance = key.startsWith("red") ? "red" : "blue";
    rows.push(
      event(
        job._id,
        30,
        "AUTO",
        "leave",
        alliance,
        DECODE_SCORING.auto.leavePoints,
        1,
        "Manual LEAVE marked at end of AUTO.",
        { teamNumber: job[key] || null, manualOverride: true }
      )
    );
  }
  for (let alliance of ["red", "blue"]) {
    if (
      [`${alliance}Team1`, `${alliance}Team2`].some(
        (key) => job.manualLeave?.[key] === "yes"
      )
    )
      continue;
    let start = nearestFrame(
      frames.filter((frame) => frame.timestamp <= 5),
      0
    );
    let end = nearestFrame(frames, 30);
    if (!start || !end) continue;
    let startCount = robotsInZone(start, `launch_line_${alliance}`).length;
    let endCount = robotsInZone(end, `launch_line_${alliance}`).length;
    let inferredLeaves = Math.max(0, Math.min(2, startCount - endCount));
    for (let n = 0; n < inferredLeaves; n += 1) {
      rows.push(
        event(
          job._id,
          30,
          "AUTO",
          "leave",
          alliance,
          DECODE_SCORING.auto.leavePoints,
          0.55,
          `Estimated LEAVE: robot count over ${alliance} launch line decreased ${startCount} -> ${endCount} by end of AUTO.`,
          { manualOverride: false }
        )
      );
    }
  }
  return rows;
}

function buildPatternEvents(job, frames, zones) {
  let rows = [];
  for (let alliance of ["red", "blue"]) {
    let slots = zones.filter(
      (zone) => zone.zoneType === `ramp_index_${alliance}` && zone.index
    );
    for (let timestamp of [30, decodeMatchSeconds()]) {
      let frame = nearestFrame(frames, timestamp);
      if (!frame) continue;
      for (let slot of slots) {
        let expected = expectedMotifColor(job.motif, slot.index);
        let detected = artifactDetections(frame).find((d) =>
          pointInPolygon(d.center, slot.coordinates)
        );
        if (!expected || !detected || detected.artifactColor !== expected)
          continue;
        rows.push(
          event(
            job._id,
            timestamp,
            timestamp <= 30 ? "AUTO" : "ENDGAME",
            "pattern",
            alliance,
            timestamp <= 30
              ? DECODE_SCORING.auto.patternMatchPoints
              : DECODE_SCORING.teleop.patternMatchPoints,
            detected.confidence,
            `Ramp slot ${slot.index} matched motif color ${expected}.`,
            {
              artifactColor: detected.artifactColor,
              zoneType: slot.zoneType,
              relatedDetectionIds: [detected._id],
            }
          )
        );
      }
    }
  }
  return rows;
}

function buildDepotEvents(jobId, frames) {
  let frame = nearestFrame(frames, decodeMatchSeconds());
  if (!frame) return [];
  return ["red", "blue"].flatMap((alliance) =>
    artifactsInZone(frame, `depot_${alliance}`).map((det) =>
      event(
        jobId,
        decodeMatchSeconds(),
        "ENDGAME",
        "depot",
        alliance,
        DECODE_SCORING.teleop.depotArtifactPoints,
        det.confidence,
        "Artifact over depot in final stable window.",
        {
          artifactColor: det.artifactColor,
          relatedDetectionIds: [det._id],
        }
      )
    )
  );
}

function buildBaseEvents(job, frames) {
  let rows = [];
  for (let alliance of ["red", "blue"]) {
    let fullCount = 0;
    for (let slot of [`${alliance}Team1`, `${alliance}Team2`]) {
      let value = job.manualBase?.[slot];
      if (value === "partial")
        rows.push(
          event(
            job._id,
            decodeMatchSeconds(),
            "ENDGAME",
            "base_partial",
            alliance,
            DECODE_SCORING.teleop.basePartialPoints,
            1,
            "Manual partial BASE return.",
            { teamNumber: job[slot] || null, manualOverride: true }
          )
        );
      if (value === "full") {
        fullCount += 1;
        rows.push(
          event(
            job._id,
            decodeMatchSeconds(),
            "ENDGAME",
            "base_full",
            alliance,
            DECODE_SCORING.teleop.baseFullPoints,
            1,
            "Manual full BASE return.",
            { teamNumber: job[slot] || null, manualOverride: true }
          )
        );
      }
    }
    if (fullCount === 2)
      rows.push(
        event(
          job._id,
          decodeMatchSeconds(),
          "ENDGAME",
          "base_bonus",
          alliance,
          DECODE_SCORING.teleop.bothRobotsFullBaseBonus,
          1,
          "Both robots fully returned to BASE.",
          { manualOverride: true }
        )
      );
    if (
      fullCount === 0 &&
      ![`${alliance}Team1`, `${alliance}Team2`].some(
        (slot) => job.manualBase?.[slot] && job.manualBase?.[slot] !== "unknown"
      )
    ) {
      let frame = nearestFrame(frames, decodeMatchSeconds());
      let robots = frame ? robotsInZone(frame, `base_${alliance}`) : [];
      for (let robot of robots.slice(0, 2)) {
        rows.push(
          event(
            job._id,
            decodeMatchSeconds(),
            "ENDGAME",
            "base_partial",
            alliance,
            DECODE_SCORING.teleop.basePartialPoints,
            Math.min(0.7, robot.confidence),
            `Estimated BASE return: robot center detected inside ${alliance} base zone at end of match. Review for partial/full status.`,
            { relatedDetectionIds: [robot._id] }
          )
        );
      }
    }
  }
  return rows;
}

function buildPenaltyEvents(penalties) {
  return penalties.map((penalty) =>
    event(
      penalty.jobId,
      penalty.timestamp ?? decodeMatchSeconds(),
      penalty.timestamp && penalty.timestamp <= 30 ? "AUTO" : "ENDGAME",
      "penalty",
      penalty.creditedAlliance,
      penalty.points,
      1,
      penalty.note || `${penalty.foulType} foul credited to opponent.`,
      { manualOverride: true }
    )
  );
}

async function calculateAndSaveSummary(jobId, events, detections, warnings) {
  let buckets = { red: scoreBucket(), blue: scoreBucket() };
  for (let row of events) {
    let bucket = buckets[row.alliance];
    if (!bucket) continue;
    if (row.phase === "AUTO") bucket.auto += row.points;
    else bucket.teleop += row.points;
    if (row.eventType === "classified") {
      bucket.artifact += row.points;
      bucket.classified += 1;
    }
    if (row.eventType === "overflow") {
      bucket.artifact += row.points;
      bucket.overflow += 1;
    }
    if (row.eventType === "pattern") bucket.pattern += row.points;
    if (row.eventType === "depot") bucket.depot += row.points;
    if (row.eventType.startsWith("base_")) bucket.base += row.points;
    if (row.eventType === "penalty") bucket.penalties += row.points;
  }
  let redTotal = buckets.red.auto + buckets.red.teleop;
  let blueTotal = buckets.blue.auto + buckets.blue.teleop;
  let confidences = detections.map((det) => det.confidence);
  return AutoscoreSummary.findOneAndUpdate(
    { jobId },
    {
      jobId,
      redAutoScore: buckets.red.auto,
      blueAutoScore: buckets.blue.auto,
      redTeleopScore: buckets.red.teleop,
      blueTeleopScore: buckets.blue.teleop,
      redArtifactScore: buckets.red.artifact,
      blueArtifactScore: buckets.blue.artifact,
      redClassifiedCount: buckets.red.classified,
      blueClassifiedCount: buckets.blue.classified,
      redOverflowCount: buckets.red.overflow,
      blueOverflowCount: buckets.blue.overflow,
      redPatternScore: buckets.red.pattern,
      bluePatternScore: buckets.blue.pattern,
      redDepotScore: buckets.red.depot,
      blueDepotScore: buckets.blue.depot,
      redBaseScore: buckets.red.base,
      blueBaseScore: buckets.blue.base,
      redPenaltyCredits: buckets.red.penalties,
      bluePenaltyCredits: buckets.blue.penalties,
      estimatedRedScore: redTotal,
      estimatedBlueScore: blueTotal,
      redRP: rankingPoints(buckets.red, redTotal, blueTotal),
      blueRP: rankingPoints(buckets.blue, blueTotal, redTotal),
      winner:
        redTotal === blueTotal ? "tie" : redTotal > blueTotal ? "red" : "blue",
      totalDetections: detections.length,
      artifactGreenCount: detections.filter(
        (det) => det.className === "artifact_green"
      ).length,
      artifactPurpleCount: detections.filter(
        (det) => det.className === "artifact_purple"
      ).length,
      robotDetectionCount: detections.filter((det) => det.className === "robot")
        .length,
      averageConfidence: average(confidences),
      maxConfidence: confidences.length ? Math.max(...confidences) : 0,
      warnings: [...new Set(warnings)],
    },
    { upsert: true, new: true }
  );
}

function rankingPoints(bucket, ownTotal, otherTotal) {
  let rp =
    ownTotal > otherTotal
      ? DECODE_SCORING.rankingPoints.winRP
      : ownTotal === otherTotal
      ? DECODE_SCORING.rankingPoints.tieRP
      : 0;
  if (
    bucket.auto + bucket.base >=
    DECODE_SCORING.rankingPoints.movementRPThreshold
  )
    rp += DECODE_SCORING.rankingPoints.movementRP;
  if (
    bucket.classified + bucket.overflow >=
    DECODE_SCORING.rankingPoints.goalRPThreshold
  )
    rp += DECODE_SCORING.rankingPoints.goalRP;
  if (bucket.pattern >= DECODE_SCORING.rankingPoints.patternRPThreshold)
    rp += DECODE_SCORING.rankingPoints.patternRP;
  return rp;
}

function classifiedPoints(timestamp) {
  return timestamp <= 30
    ? DECODE_SCORING.auto.classifiedArtifactPoints
    : DECODE_SCORING.teleop.classifiedArtifactPoints;
}
function overflowPoints(timestamp) {
  return timestamp <= 30
    ? DECODE_SCORING.auto.overflowArtifactPoints
    : DECODE_SCORING.teleop.overflowArtifactPoints;
}
function scoreBucket() {
  return {
    auto: 0,
    teleop: 0,
    artifact: 0,
    classified: 0,
    overflow: 0,
    pattern: 0,
    depot: 0,
    base: 0,
    penalties: 0,
  };
}
function requiredZoneWarnings(zones) {
  let present = new Set(zones.map((zone) => zone.zoneType));
  return REQUIRED_ZONE_TYPES.filter((zone) => !present.has(zone)).map(
    (zone) => `${zone} is not calibrated.`
  );
}
function recentPathEvidence(frames, index, alliance) {
  let recent = frames.slice(Math.max(0, index - 6), index + 1);
  let goalAt = recent.findLastIndex(
    (frame) => artifactsInZone(frame, `goal_${alliance}`).length > 0
  );
  let squareAt = recent.findLastIndex(
    (frame) =>
      artifactsInZone(frame, `square_${alliance}`).length > 0 ||
      artifactsInZone(frame, `classifier_${alliance}`).length > 0
  );
  return goalAt >= 0 && squareAt >= 0 && squareAt >= goalAt;
}
function nearbyGate(gates, alliance, timestamp) {
  return gates.find(
    (gate) =>
      gate.alliance === alliance && Math.abs(gate.timestamp - timestamp) <= 5
  );
}

function artifactDetections(frame) {
  return frame.detections.filter(
    (d) => d.className === "artifact_green" || d.className === "artifact_purple"
  );
}

function artifactInZone(detection) {
  return (
    detection.className === "artifact_green" ||
    detection.className === "artifact_purple"
  );
}

function artifactsInZone(frame, zoneType) {
  return (frame.zones[zoneType] ?? []).filter(artifactInZone);
}

function robotsInZone(frame, zoneType) {
  return (frame.zones[zoneType] ?? []).filter((d) => d.className === "robot");
}

function recentRobotInZone(frames, index, zoneType) {
  for (let cursor = index; cursor >= 0 && cursor >= index - 2; cursor -= 1) {
    let robot = robotsInZone(frames[cursor], zoneType)[0];
    if (robot) return robot;
  }
  return null;
}
function nearestFrame(frames, timestamp) {
  return [...frames].sort(
    (a, b) =>
      Math.abs(a.timestamp - timestamp) - Math.abs(b.timestamp - timestamp)
  )[0];
}
function normalizedCenter(det) {
  if (!det.frameWidth || !det.frameHeight) return null;
  return {
    x: ((det.x ?? 0) + (det.width ?? 0) / 2) / det.frameWidth,
    y: ((det.y ?? 0) + (det.height ?? 0) / 2) / det.frameHeight,
  };
}
function pointInPolygon(point, polygon = []) {
  if (!point || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].x,
      yi = polygon[i].y,
      xj = polygon[j].x,
      yj = polygon[j].y;
    let intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 0.000001) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}
function event(
  jobId,
  timestamp,
  phase,
  eventType,
  alliance,
  points,
  confidence,
  reason,
  extras = {}
) {
  return {
    jobId,
    timestamp,
    phase,
    eventType,
    alliance,
    points,
    confidence,
    reason,
    relatedDetectionIds: [],
    manualOverride: false,
    reviewed: false,
    ...extras,
  };
}
function average(values = []) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}
function median(values) {
  let sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}
