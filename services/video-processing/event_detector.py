def detect_events(detections: list[dict], season: str) -> list[dict]:
    """Convert object detections into suggested FTC timeline events."""
    return [
        {
            "timestamp": item["timestamp"],
            "type": "no event detected",
            "season": season,
            "confidence": item.get("confidence", 0.0),
            "requires_human_review": True,
        }
        for item in detections
    ]
