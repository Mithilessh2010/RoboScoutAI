import { bboxCenter, pointInsidePolygon } from "./geometry";
import type { Detection, ZoneShape } from "./types";

export function detectionInsideZone(detection: Detection, zone: ZoneShape) {
  return pointInsidePolygon(bboxCenter(detection), zone.coordinates);
}
export function countDetectionsInZone(detections: Detection[], zone: ZoneShape) {
  return detections.filter((detection) => detectionInsideZone(detection, zone)).length;
}
