export type Alliance = "red" | "blue";
export type ArtifactColor = "green" | "purple";
export type Point = { x: number; y: number };
export type ZoneShape = { zoneType: string; coordinates: Point[]; index?: number | null };
export type Detection = {
  _id?: string;
  className: "artifact_green" | "artifact_purple" | "robot";
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
