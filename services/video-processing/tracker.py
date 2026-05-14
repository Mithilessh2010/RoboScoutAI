"""Lightweight IoU tracker for DECODE object detections."""
from typing import List, Dict, Any


def _iou(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
    inter = iw * ih
    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    denom = area_a + area_b - inter
    return inter / denom if denom else 0.0


class SimpleTracker:
    def __init__(self, iou_threshold: float = 0.3, max_age: int = 12):
        self.next_id = 1
        self.tracks: Dict[int, Dict[str, Any]] = {}
        self.iou_threshold = iou_threshold
        self.max_age = max_age

    def update(self, detections: List[Dict[str, Any]], frame_idx: int | None = None):
        out = []
        used_tracks = set()
        for det in detections:
            best_id = None
            best_iou = 0.0
            for track_id, track in self.tracks.items():
                if track_id in used_tracks or track.get("class_id") != det.get("class_id"):
                    continue
                score = _iou(track["bbox_xyxy"], det["bbox_xyxy"])
                if score > best_iou:
                    best_iou = score
                    best_id = track_id
            if best_id is None or best_iou < self.iou_threshold:
                best_id = self.next_id
                self.next_id += 1
            used_tracks.add(best_id)
            enriched = {**det, "track_id": best_id, "frame": frame_idx}
            self.tracks[best_id] = {**enriched, "age": 0}
            out.append(enriched)

        for track_id in list(self.tracks):
            if track_id not in used_tracks:
                self.tracks[track_id]["age"] = self.tracks[track_id].get("age", 0) + 1
                if self.tracks[track_id]["age"] > self.max_age:
                    del self.tracks[track_id]
        return out
