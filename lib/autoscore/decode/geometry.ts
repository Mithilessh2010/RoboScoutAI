import type { Detection, Point } from "./types";

export function bboxCenter(detection: Detection): Point {
  if (detection.centerX != null && detection.centerY != null) {
    return { x: detection.centerX, y: detection.centerY };
  }
  return {
    x: ((detection.x ?? 0) + (detection.width ?? 0) / 2) / (detection.frameWidth || 1),
    y: ((detection.y ?? 0) + (detection.height ?? 0) / 2) / (detection.frameHeight || 1),
  };
}
export function pointInsideRect(point: Point, rect: Point[]) {
  let xs = rect.map((p) => p.x), ys = rect.map((p) => p.y);
  return point.x >= Math.min(...xs) && point.x <= Math.max(...xs) && point.y >= Math.min(...ys) && point.y <= Math.max(...ys);
}
export function pointInsidePolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y + 0.000001) + a.x) inside = !inside;
  }
  return inside;
}
export function bboxOverlap(a: Point[], b: Point[]) {
  let ax = a.map((p) => p.x), ay = a.map((p) => p.y), bx = b.map((p) => p.x), by = b.map((p) => p.y);
  return Math.min(...ax) <= Math.max(...bx) && Math.max(...ax) >= Math.min(...bx) && Math.min(...ay) <= Math.max(...by) && Math.max(...ay) >= Math.min(...by);
}
export function normalizeCoordinates(points: Point[], width: number, height: number) {
  return points.map((point) => ({ x: point.x / width, y: point.y / height }));
}
export function denormalizeCoordinates(points: Point[], width: number, height: number) {
  return points.map((point) => ({ x: point.x * width, y: point.y * height }));
}
