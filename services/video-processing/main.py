from frame_extractor import extract_frames
from object_detector import detect_objects
from event_detector import detect_events
from scoring_logic import score_events


def analyze_video(video_path: str, season: str = "2025-2026") -> dict:
    frames = extract_frames(video_path)
    detections = detect_objects(frames, season)
    events = detect_events(detections, season)
    score = score_events(events, season)
    return {
        "season": season,
        "suggested_events": events,
        "score_estimate": score,
        "message": "Experimental scaffold only. Human review is required.",
    }


if __name__ == "__main__":
    print(analyze_video("sample.mp4"))
