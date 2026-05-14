"""Compute DECODE red/blue scores from detected scoring events."""
from typing import Dict, Any


def compute_score(events) -> Dict[str, Any]:
    red = 0
    blue = 0
    timeline = []
    for event in events or []:
        alliance = event.get("alliance")
        points = int(event.get("points", 0))
        if alliance == "red":
            red += points
        elif alliance == "blue":
            blue += points
        timeline.append({
            "timestamp": event.get("timestamp"),
            "alliance": alliance,
            "points": points,
            "type": event.get("type"),
            "confidence": event.get("confidence", 0.0),
        })
    confidence = min([item["confidence"] for item in timeline], default=0.0)
    return {
        "red": red,
        "blue": blue,
        "timeline": timeline,
        "confidence": confidence,
        "notes": "Score remains zero until decode_event_detector emits verified scoring events.",
    }
