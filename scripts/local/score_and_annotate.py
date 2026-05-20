#!/usr/bin/env python3
"""
Score a video and create an annotated output video showing:
1. Detected balls (green/purple boxes)
2. Basket zones (red/blue overlays)
3. Scoring events (text overlay when ball scores)
"""
import argparse
import json
import sys
from pathlib import Path
from collections import defaultdict
import numpy as np
from typing import Dict, List, Tuple

import cv2
from pymongo import MongoClient
from bson import ObjectId

sys.path.insert(0, str(Path(__file__).resolve().parent))
from autoscore_algorithm import score_video


def get_frame_center(det: Dict) -> Tuple[float, float]:
    """Extract normalized frame center from detection."""
    x = det.get('centerX', 0)
    y = det.get('centerY', 0)
    return (x, y)


def draw_zones_on_frame(frame, zones: List[Dict], frame_height: int, frame_width: int):
    """Draw calibration zones on the frame."""
    for zone in zones:
        zone_type = (zone.get('zoneType') or '').lower()
        alliance = (zone.get('alliance') or '').lower()
        
        # Pick color
        if 'red' in zone_type or alliance == 'red':
            color = (0, 0, 255)  # Red in BGR
            alpha = 0.15
        elif 'blue' in zone_type or alliance == 'blue':
            color = (255, 0, 0)  # Blue in BGR
            alpha = 0.15
        else:
            color = (0, 255, 0)  # Green for others
            alpha = 0.1
        
        # Draw zone polygon/rectangle
        coords = zone.get('coordinates', [])
        if coords and len(coords) >= 2:
            pts = []
            for c in coords:
                px = int(c.get('x', 0) * frame_width)
                py = int(c.get('y', 0) * frame_height)
                pts.append((px, py))
            if zone.get('shapeType') == 'rectangle' and len(pts) == 2:
                (x1, y1), (x2, y2) = pts
                pts = [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]
            pts_np = np.array(pts, dtype=np.int32)
            overlay = frame.copy()
            cv2.polylines(overlay, [pts_np], True, color, 3)
            cv2.fillPoly(overlay, [pts_np], color)
            frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
    
    return frame


def draw_detections_on_frame(frame, detections: List[Dict], frame_height: int, frame_width: int):
    """Draw detected balls on the frame."""
    for det in detections:
        x = det.get('centerX', 0) * frame_width
        y = det.get('centerY', 0) * frame_height
        confidence = det.get('confidence', 0)
        class_name = det.get('className', '').lower()
        
        # Color based on class
        if 'green' in class_name or 'artifact_green' in class_name:
            color = (0, 255, 0)  # Green
        elif 'purple' in class_name or 'artifact_purple' in class_name:
            color = (255, 0, 255)  # Purple
        else:
            color = (0, 255, 255)  # Yellow
        
        radius = 8
        cv2.circle(frame, (int(x), int(y)), radius, color, 2)
        cv2.putText(
            frame,
            f"{confidence:.2f}",
            (int(x) + radius + 5, int(y) - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            color,
            1,
        )
    
    return frame


def create_annotated_video(
    input_video_path: str,
    output_video_path: str,
    detections: List[Dict],
    zones: List[Dict],
    events: List[Dict],
):
    """Create annotated video with detections and scoring overlays."""
    # Group detections by frame
    frame_dets = defaultdict(list)
    for det in detections:
        frame_num = det.get('frameNumber', 0)
        frame_dets[frame_num].append(det)
    
    # Group events by frame for quick lookup
    frame_events = defaultdict(list)
    for event in events:
        frame_num = event.get('frame_number', 0)
        frame_events[frame_num].append(event)
    
    # Open input video
    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        print(f"ERROR: Could not open video: {input_video_path}")
        return
    
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"Input video: {frame_width}x{frame_height} @ {fps} FPS, {total_frames} frames")
    
    # Create output video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (frame_width, frame_height))
    
    frame_num = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Draw zones
        frame = draw_zones_on_frame(frame, zones, frame_height, frame_width)
        
        # Draw detections for this frame
        dets = frame_dets.get(frame_num, [])
        frame = draw_detections_on_frame(frame, dets, frame_height, frame_width)
        
        # Draw scoring events
        events_this_frame = frame_events.get(frame_num, [])
        if events_this_frame:
            y_offset = 30
            for event in events_this_frame:
                ball_id = event.get('ball_id', '?')
                alliance = event.get('alliance', '?').upper()
                basket_type = event.get('basket_type', '?')
                
                text = f"SCORE: Ball {ball_id} ({alliance}) into {basket_type}"
                color = (0, 0, 255) if alliance == 'RED' else (255, 0, 0)
                
                cv2.putText(
                    frame,
                    text,
                    (10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    color,
                    2,
                )
                y_offset += 30
        
        # Write frame
        out.write(frame)
        frame_num += 1
    
    cap.release()
    out.release()
    print(f"Annotated video saved to: {output_video_path}")


def create_highlight_clips(
    input_video_path: str,
    output_dir: str,
    detections: List[Dict],
    zones: List[Dict],
    events: List[Dict],
    before_seconds: float = 2.0,
    after_seconds: float = 2.0,
    merge_gap_seconds: float = 1.0,
):
    """Create short annotated clips around scoring events for visual review."""
    if not events:
        print("No scoring events; skipping highlight clips")
        return []

    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        print(f"ERROR: Could not open video for highlights: {input_video_path}")
        return []

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps else 0

    frame_dets = defaultdict(list)
    for det in detections:
        frame_dets[int(det.get('frameNumber', 0))].append(det)

    sorted_events = sorted(events, key=lambda event: float(event.get('timestamp', 0)))
    windows = []
    for event in sorted_events:
        timestamp = float(event.get('timestamp', 0))
        start = max(0.0, timestamp - before_seconds)
        end = min(duration, timestamp + after_seconds)
        if windows and start <= windows[-1]['end'] + merge_gap_seconds:
            windows[-1]['end'] = max(windows[-1]['end'], end)
            windows[-1]['events'].append(event)
        else:
            windows.append({'start': start, 'end': end, 'events': [event]})

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    clips = []
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')

    for index, window in enumerate(windows, start=1):
        start_frame = max(0, int(window['start'] * fps))
        end_frame = min(total_frames - 1, int(window['end'] * fps))
        clip_path = output_path / f"highlight_{index:03d}_{window['start']:.2f}s-{window['end']:.2f}s.mp4"
        writer = cv2.VideoWriter(str(clip_path), fourcc, fps, (frame_width, frame_height))
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        frame_number = start_frame
        while frame_number <= end_frame:
            ok, frame = cap.read()
            if not ok:
                break
            frame = draw_zones_on_frame(frame, zones, frame_height, frame_width)
            frame = draw_detections_on_frame(frame, frame_dets.get(frame_number, []), frame_height, frame_width)
            current_time = frame_number / fps
            nearby_events = [
                event for event in window['events']
                if abs(float(event.get('timestamp', 0)) - current_time) <= 0.35
            ]
            y_offset = 36
            for event in nearby_events:
                alliance = str(event.get('alliance', '?')).upper()
                basket_type = event.get('basket_type', '?')
                color = (0, 0, 255) if alliance == 'RED' else (255, 0, 0)
                text = f"SCORE {alliance}: {basket_type} @ {float(event.get('timestamp', 0)):.2f}s"
                cv2.putText(frame, text, (16, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                y_offset += 34
            cv2.putText(
                frame,
                f"t={current_time:.2f}s",
                (16, frame_height - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
            )
            writer.write(frame)
            frame_number += 1
        writer.release()
        clips.append({
            'path': str(clip_path),
            'start': window['start'],
            'end': window['end'],
            'eventCount': len(window['events']),
        })

    cap.release()
    manifest_path = output_path / 'highlights_manifest.json'
    manifest_path.write_text(json.dumps(clips, indent=2))
    print(f"Created {len(clips)} highlight clips in: {output_path}")
    print(f"Highlight manifest saved to: {manifest_path}")
    return clips


def main():
    parser = argparse.ArgumentParser(description="Score a video and create annotated output")
    parser.add_argument("--mongo", default="mongodb://localhost:27017", help="MongoDB URI")
    parser.add_argument("--db", default="test", help="Database name")
    parser.add_argument("--job", help="Job ID (if not provided, uses latest)")
    parser.add_argument("--video", help="Video file path (if not provided, infers from job)")
    parser.add_argument("--output", help="Output annotated video path")
    parser.add_argument("--highlights-dir", help="Directory for short annotated scoring clips")
    parser.add_argument("--highlight-before", type=float, default=2.0, help="Seconds before each score in highlight clips")
    parser.add_argument("--highlight-after", type=float, default=2.0, help="Seconds after each score in highlight clips")
    
    args = parser.parse_args()
    
    # Connect to MongoDB
    client = MongoClient(args.mongo)
    db = client[args.db]
    
    # Get job
    if args.job:
        job = db.autoscorejobs.find_one({'_id': ObjectId(args.job)})
    else:
        job = db.autoscorejobs.find_one(sort=[('createdAt', -1)])
    
    if not job:
        print("ERROR: No job found")
        return 1
    
    job_id = job['_id']
    print(f"Using job: {job_id}")
    
    # Get detections and zones
    detections = list(db.autoscoredetections.find({'jobId': job_id}))
    zones = list(db.autoscorecalibrationzones.find({'jobId': job_id}))
    
    print(f"Loaded {len(detections)} detections, {len(zones)} zones")
    
    # Run scoring
    result = score_video(str(job_id), detections, zones)
    events = result.get('events', [])
    
    print(f"Scoring complete: Red={result['red_score']} Blue={result['blue_score']} Events={len(events)}")
    
    # Print event summary
    print("\n=== SCORING EVENTS ===")
    for i, evt in enumerate(events[:20]):  # Show first 20
        print(f"{i+1}. Frame {evt.get('frame_number')} Ball {evt.get('ball_id')} ({evt.get('ball_color')}) -> "
              f"{evt.get('basket_type')} ({evt.get('alliance')})")
    if len(events) > 20:
        print(f"... and {len(events) - 20} more events")
    
    # Infer video path from job or use provided
    video_path = args.video or job.get('videoPath') or 'decode-training/raw-videos/unsorted/Screen Recording 2026-05-13 at 8.42.17 AM.mov'
    
    if not Path(video_path).exists():
        print(f"ERROR: Video not found: {video_path}")
        return 1
    
    # Output path
    output_path = args.output or f"runs/annotated_{str(job_id)}.mp4"
    
    # Create annotated video
    print(f"\nCreating annotated video...")
    create_annotated_video(video_path, output_path, detections, zones, events)
    if args.highlights_dir:
        print("\nCreating highlight clips...")
        create_highlight_clips(
            video_path,
            args.highlights_dir,
            detections,
            zones,
            events,
            before_seconds=args.highlight_before,
            after_seconds=args.highlight_after,
        )
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
