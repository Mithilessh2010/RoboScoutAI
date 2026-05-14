"""Scoring-event scaffolding for DECODE autoscore.

FTC DECODE scoring rules and reliable zone-crossing logic should be filled in
after labeled object detection is working. This module intentionally returns
warnings instead of inventing scores from weak visual evidence.
"""
from typing import List, Dict, Any

from confidence import ConfidenceReport


def detect_events(tracks: List[Dict[str, Any]], field_calibration: Dict[str, Any] | None = None):
    report = ConfidenceReport(score=0.35)
    report.add_warning("scoring zones estimated", code="zones_estimated", penalty=0.1)
    if field_calibration and field_calibration.get("warnings"):
        for warning in field_calibration["warnings"]:
            report.add_warning(warning["message"], warning.get("level", "warning"), warning.get("code"), penalty=0.03)
    if not tracks:
        report.add_warning("object occlusion may affect score", code="no_tracks", penalty=0.15)
    return {
        "events": [],
        "timeline": [],
        **report.as_dict(),
        "notes": "Event rules are placeholders until a trained detector and DECODE scoring-zone validation are available.",
    }
