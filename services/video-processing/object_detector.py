OBJECT_CLASSES_BY_SEASON = {
    "2025-2026": [
        "artifact",
        "goal",
        "ramp",
        "base",
        "robot",
        "field zone",
        "obstacle/game-specific object",
    ]
}


def detect_objects(frames: list[dict], season: str) -> list[dict]:
    """Placeholder for YOLO, Roboflow, or OpenCV object detection."""
    classes = OBJECT_CLASSES_BY_SEASON.get(season, ["robot", "field zone"])
    return [
        {
            "frame_id": frame["frame_id"],
            "timestamp": frame["timestamp"],
            "detections": [],
            "available_classes": classes,
            "confidence": 0.0,
        }
        for frame in frames
    ]
