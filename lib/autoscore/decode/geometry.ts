import type { Detection, Point, ZoneShape } from "./types";

export function bboxCenter(detection: Detection): Point {
  if (detection.centerX != null && detection.centerY != null) {
    return { x: Number(detection.centerX), y: Number(detection.centerY) };
  }
  return {
    x: ((detection.x ?? 0) + (detection.width ?? 0) / 2) / (detection.frameWidth || 1),
    y: ((detection.y ?? 0) + (detection.height ?? 0) / 2) / (detection.frameHeight || 1),
  };
}

export function pointInsideRect(point: Point, rect: Point[]) {
  if (rect.length < 2) return false;
  const xs = rect.map((p) => p.x);
  const ys = rect.map((p) => p.y);
  return point.x >= Math.min(...xs) && point.x <= Math.max(...xs) && point.y >= Math.min(...ys) && point.y <= Math.max(...ys);
}

export function pointInsidePolygon(point: Point, polygon: Point[]) {
  if (polygon.length < 3) return pointInsideRect(point, polygon);
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = (a.y > point.y) !== (b.y > point.y);
    if (crosses && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y + Number.EPSILON) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function bboxOverlap(a: Point[], b: Point[]) {
  if (a.length < 2 || b.length < 2) return false;
  const ax = a.map((p) => p.x);
  const ay = a.map((p) => p.y);
  const bx = b.map((p) => p.x);
  const by = b.map((p) => p.y);
  return Math.min(...ax) <= Math.max(...bx) && Math.max(...ax) >= Math.min(...bx) && Math.min(...ay) <= Math.max(...by) && Math.max(...ay) >= Math.min(...by);
}

export function normalizeCoordinates(points: Point[], width: number, height: number) {
  return points.map((point) => ({ x: point.x / width, y: point.y / height }));
}

export function denormalizeCoordinates(points: Point[], width: number, height: number) {
  return points.map((point) => ({ x: point.x * width, y: point.y * height }));
}

export function detectionInsideZone(detection: Detection, zone: ZoneShape) {
  const center = bboxCenter(detection);
  return zone.shapeType === "rectangle" ? pointInsideRect(center, zone.coordinates) : pointInsidePolygon(center, zone.coordinates);
}

export function countDetectionsInZone(detections: Detection[], zone: ZoneShape) {
  return detections.filter((detection) => detectionInsideZone(detection, zone)).length;
}
