import type { ArtifactColor, Detection } from "./types";

export function artifactColorOf(detection: Detection): ArtifactColor | null {
  if (detection.className === "artifact_green") return "green";
  if (detection.className === "artifact_purple") return "purple";
  return null;
}
export function artifactDetections(detections: Detection[]) {
  return detections.filter((detection) => artifactColorOf(detection) !== null);
}
