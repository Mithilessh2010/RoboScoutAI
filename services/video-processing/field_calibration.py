"""Automatic field-zone estimation for DECODE videos.

This first pass uses YOLO detections of field objects to estimate zones. It does
not hardcode fixed pixel scoring regions, and it reports warnings when the view
is too occluded or uncertain for reliable scoring.
"""
from typing import Dict, Any

from confidence import ConfidenceReport


ZONE_CLASS_MAP = {
    "field_boundary": "field_boundary",
    "goal_red": "red_goal_zone",
    "goal_blue": "blue_goal_zone",
    "ramp_red": "red_ramp_zone",
    "ramp_blue": "blue_ramp_zone",
    "base_red": "red_base_zone",
    "base_blue": "blue_base_zone",
    "obelisk": "obelisk",
}


def _bbox_to_polygon(bbox):
    x1, y1, x2, y2 = bbox
    return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]


def estimate_field_zones(detections) -> Dict[str, Any]:
    report = ConfidenceReport(score=0.8)
    zones: Dict[str, Dict[str, Any]] = {}
    for det in detections:
        zone_name = ZONE_CLASS_MAP.get(det.get("class_name"))
        if not zone_name:
            continue
        current = zones.get(zone_name)
        if current is None or det.get("confidence", 0.0) > current.get("confidence", 0.0):
            zones[zone_name] = {
                "polygon": _bbox_to_polygon(det["bbox_xyxy"]),
                "source_class": det["class_name"],
                "confidence": det.get("confidence", 0.0),
                "estimated": det["class_name"] != "field_boundary",
            }

    if "field_boundary" not in zones:
        report.add_warning("field boundary not detected clearly", code="field_boundary_missing", penalty=0.2)
    for zone in ["red_goal_zone", "blue_goal_zone", "red_ramp_zone", "blue_ramp_zone", "red_base_zone", "blue_base_zone"]:
        if zone not in zones:
            report.add_warning(f"{zone.replace('_', ' ')} estimated or not visible", code=f"{zone}_missing", penalty=0.05)
    if len(zones) < 4:
        report.add_warning("camera angle reduces confidence", code="limited_zone_visibility", penalty=0.1)

    return {
        "zones": zones,
        **report.as_dict(),
    }
