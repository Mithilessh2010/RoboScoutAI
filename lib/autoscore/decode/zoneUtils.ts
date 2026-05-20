import { bboxCenter, detectionInsideZone } from "./geometry";
import type { Alliance, Detection, FilteredDetection, ZoneShape, ZoneType } from "./types";

export { detectionInsideZone };

export function countDetectionsInZone(detections: Detection[], zone: ZoneShape) {
  return detections.filter((detection) => detectionInsideZone(detection, zone)).length;
}

export function allianceFromZone(zoneType: string): Alliance | null {
  if (zoneType.includes("red")) return "red";
  if (zoneType.includes("blue")) return "blue";
  return null;
}

export function zonesForDetection(detection: Detection, zones: ZoneShape[]) {
  return zones.filter((zone) => detectionInsideZone(detection, zone)).map((zone) => zone.zoneType);
}

export function artifactColorFromDetection(detection: Detection): "green" | "purple" | null {
  if (detection.artifactColor === "green" || detection.className.includes("green")) return "green";
  if (detection.artifactColor === "purple" || detection.className.includes("purple")) return "purple";
  return null;
}

export function filterArtifactDetections(
  detections: Detection[],
  zones: ZoneShape[],
  confidenceThresholds = { green: 0.25, purple: 0.3 },
): FilteredDetection[] {
  const fieldBoundary = zones.find((zone) => zone.zoneType === "field_boundary");
  return detections
    .map((detection) => {
      const artifactColor = artifactColorFromDetection(detection);
      if (!artifactColor) return null;
      if (detection.confidence < confidenceThresholds[artifactColor]) return null;
      const center = bboxCenter(detection);
      if (fieldBoundary && !detectionInsideZone({ ...detection, centerX: center.x, centerY: center.y }, fieldBoundary)) return null;
      return {
        ...detection,
        artifactColor,
        centerX: center.x,
        centerY: center.y,
        zones: zonesForDetection({ ...detection, centerX: center.x, centerY: center.y }, zones) as ZoneType[],
      };
    })
    .filter((detection): detection is FilteredDetection => Boolean(detection))
    .sort((a, b) => a.frameNumber - b.frameNumber || b.confidence - a.confidence);
}
