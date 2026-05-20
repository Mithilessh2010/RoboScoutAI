export type Alliance = "red" | "blue";
export type ArtifactColor = "green" | "purple" | "unknown";
export type DecodePhase = "AUTO" | "TELEOP" | "ENDGAME";
export type ZoneType =
  | "field_boundary"
  | "basket_red"
  | "basket_blue"
  | "tunnel_red"
  | "tunnel_blue"
  | "secret_tunnel_red"
  | "secret_tunnel_blue"
  | "ramp_red"
  | "ramp_blue"
  | "base_red"
  | "base_blue"
  | "depot_red"
  | "depot_blue"
  | string;

export type Point = { x: number; y: number };

export type ZoneShape = {
  _id?: string;
  zoneType: ZoneType;
  alliance?: Alliance | null;
  shapeType?: "rectangle" | "polygon";
  coordinates: Point[];
  index?: number | null;
};

export type Detection = {
  _id?: string;
  frameNumber: number;
  timestamp: number;
  phase?: DecodePhase | string;
  className: "artifact_green" | "artifact_purple" | "robot" | string;
  classId?: number;
  artifactColor?: ArtifactColor | null;
  confidence: number;
  centerX?: number | null;
  centerY?: number | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  frameWidth?: number;
  frameHeight?: number;
};

export type FilteredDetection = Detection & {
  artifactColor: Exclude<ArtifactColor, "unknown">;
  centerX: number;
  centerY: number;
  zones: ZoneType[];
};

export type ArtifactTrackPoint = {
  frameNumber: number;
  timestamp: number;
  x: number;
  y: number;
  zones: ZoneType[];
  detectionId?: string;
};

export type ArtifactTrack = {
  trackId: number;
  artifactColor: ArtifactColor;
  firstSeenTimestamp: number;
  lastSeenTimestamp: number;
  firstFrame: number;
  lastFrame: number;
  lastCenter: Point;
  velocity: Point;
  path: ArtifactTrackPoint[];
  zonesVisited: ZoneType[];
  zonesVisitedInOrder: Array<{ zoneType: ZoneType; timestamp: number; frameNumber: number }>;
  currentZone?: ZoneType | null;
  confidenceAverage: number;
  missedFrameCount: number;
  likelyScored: boolean;
  scoreEventId?: string;
  enteredBasketRedAt?: number;
  enteredBasketBlueAt?: number;
  enteredTunnelRedAt?: number;
  enteredTunnelBlueAt?: number;
  enteredRampRedAt?: number;
  enteredRampBlueAt?: number;
};

export type RampCountState = {
  alliance: Alliance;
  timestamp: number;
  frameNumber: number;
  rawCount: number;
  stableCount: number;
  previousStableCount: number;
  countDelta: number;
  confidence: number;
  relatedTrackIds: number[];
  relatedDetectionIds?: string[];
  relatedRampChangeId?: string;
  processed?: boolean;
  warning?: string;
};

export type AutoscoreTimelineEvent = {
  eventId: string;
  timestamp: number;
  frameNumber: number;
  frame_number?: number;
  phase: DecodePhase;
  eventType:
    | "classified"
    | "overflow"
    | "depot"
    | "leave"
    | "base"
    | "penalty"
    | "manual_gate_opened"
    | "ramp_artifacts_released"
    | "ramp_count_drop_unexplained"
    | string;
  alliance?: Alliance;
  teamNumber?: string;
  artifactColor?: ArtifactColor;
  points: number;
  confidence: number;
  reason: string;
  relatedDetectionIds?: string[];
  relatedTrackIds?: number[];
  relatedRampChangeId?: string;
  manualOverride?: boolean;
  reviewed?: boolean;
};

export type ManualGateEvent = {
  alliance: Alliance;
  timestamp: number;
  releasedCount?: number;
  note?: string;
};

export type ScoreBreakdownAlliance = {
  auto: number;
  teleop: number;
  endgame: number;
  classified: number;
  overflow: number;
  depot: number;
  pattern: number;
  base: number;
  penalties: number;
  total: number;
};

export type ScoreBreakdown = {
  red: ScoreBreakdownAlliance;
  blue: ScoreBreakdownAlliance;
};

export type DecodeScoringDebug = {
  processedFrames: number;
  rawDetectionCount: number;
  filteredDetectionCount: number;
  trackCount: number;
  rampCountChanges: number;
  duplicateEventsRemoved: number;
  undercountCorrections: number;
  overflowCandidates: number;
};

export type DecodeScoringResult = {
  tracks: ArtifactTrack[];
  rampCounts: RampCountState[];
  events: AutoscoreTimelineEvent[];
  scoreBreakdown: ScoreBreakdown;
  warnings: string[];
  debug: DecodeScoringDebug;
};

export type DecodeScoringConfig = {
  maxTrackDistanceNormalized: number;
  maxMissingFrames: number;
  minTrackFramesForScore: number;
  rampCountWindowFrames: number;
  minStableFrames: number;
  countChangeCooldownSeconds: number;
  lookBackSecondsForPathEvidence: number;
  lookForwardSecondsAfterTunnel: number;
  gateReleaseWindowSeconds: number;
  confidenceThresholds: {
    green: number;
    purple: number;
  };
};

export const DEFAULT_DECODE_SCORING_CONFIG: DecodeScoringConfig = {
  maxTrackDistanceNormalized: 0.06,
  maxMissingFrames: 5,
  minTrackFramesForScore: 2,
  rampCountWindowFrames: 5,
  minStableFrames: 3,
  countChangeCooldownSeconds: 2,
  lookBackSecondsForPathEvidence: 4,
  lookForwardSecondsAfterTunnel: 4,
  gateReleaseWindowSeconds: 5,
  confidenceThresholds: {
    green: 0.25,
    purple: 0.3,
  },
};
