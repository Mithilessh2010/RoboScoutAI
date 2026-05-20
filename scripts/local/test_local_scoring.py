#!/usr/bin/env python3
"""
Test script for the local autoscore pipeline.
This script:
1. Creates a test job
2. Inserts calibration zones
3. Runs prediction and scoring
4. Displays the scoring results
"""
import json
from datetime import datetime
from pathlib import Path
import sys
import subprocess
from bson import ObjectId
from pymongo import MongoClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from autoscore_algorithm import score_video


def main():
    # MongoDB setup
    mongo_uri = "mongodb://localhost:27017"
    db_name = "test"
    
    print("[TEST] Connecting to MongoDB...")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    
    # Create a test job
    job_id = ObjectId()
    now = datetime.utcnow()
    
    print(f"[TEST] Creating job {job_id}...")
    job_doc = {
        "_id": job_id,
        "status": "pending",
        "videoName": "TestVideo_BroBots",
        "createdAt": now,
        "updatedAt": now,
    }
    db.autoscorejobs.insert_one(job_doc)
    
    # Insert test calibration zones
    print("[TEST] Inserting test calibration zones...")
    zones = [
        {
            'jobId': job_id,
            'zoneType': 'basket_red',
            'alliance': 'red',
            'shapeType': 'rectangle',
            'coordinates': [
                {'x': 0.1, 'y': 0.1},
                {'x': 0.4, 'y': 0.4}
            ],
            'createdAt': now,
            'updatedAt': now,
        },
        {
            'jobId': job_id,
            'zoneType': 'basket_blue',
            'alliance': 'blue',
            'shapeType': 'rectangle',
            'coordinates': [
                {'x': 0.6, 'y': 0.6},
                {'x': 0.9, 'y': 0.9}
            ],
            'createdAt': now,
            'updatedAt': now,
        },
    ]
    db.autoscorecalibrationzones.insert_many(zones)
    print(f"[TEST] Inserted {len(zones)} zones")
    
    # Run prediction on BroBots.mp4
    video_path = Path('/Users/mithilesshb/Documents/GitHub/RoboScoutAI/decode-training/raw-videos/unsorted/BroBots.mp4')
    
    if not video_path.exists():
        print(f"[ERROR] Video not found: {video_path}")
        return
    
    root = Path('/Users/mithilesshb/Documents/GitHub/RoboScoutAI')
    predict_script = root / 'scripts' / 'decode' / 'predict_video_decode.py'
    model_path = root / 'services' / 'video-processing' / 'models' / 'decode' / 'best.pt'
    predictions_dir = root / 'decode-training' / 'predictions'
    predictions_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[TEST] Running prediction on {video_path.name}...")
    cmd = [
        sys.executable, str(predict_script), str(video_path),
        '--model', str(model_path),
        '--detector-mode', 'artifact',
        '--stride', '30',
        '--conf', '0.25',
        '--out', str(predictions_dir)
    ]
    
    result = subprocess.run(cmd, cwd=str(root), capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"[ERROR] Prediction failed: {result.stderr}")
        return
    
    # Read prediction results
    prediction_json = predictions_dir / f"{video_path.stem}.json"
    if not prediction_json.exists():
        print(f"[ERROR] Prediction output not found: {prediction_json}")
        return
    
    print(f"[TEST] Parsing prediction results from {prediction_json.name}...")
    prediction = json.loads(prediction_json.read_text())
    
    # Flatten detections into MongoDB format
    rows = []
    dw = float(prediction.get('width', 0) or 0)
    dh = float(prediction.get('height', 0) or 0)
    
    for frame in prediction.get('detections', []):
        ts = float(frame.get('timestamp', 0))
        fw = float(frame.get('width', dw) or dw)
        fh = float(frame.get('height', dh) or dh)
        phase = 'AUTO' if ts <= 30 else 'ENDGAME' if ts >= 150 else 'TELEOP'
        
        for d in frame.get('detections', []):
            x1, y1, x2, y2 = d.get('bbox_xyxy', [0, 0, 0, 0])
            cn = d.get('class_name')
            rows.append({
                'jobId': job_id,
                'frameNumber': int(frame.get('frame', 0)),
                'timestamp': ts,
                'phase': phase,
                'className': cn,
                'classId': int(d.get('class_id', 0)),
                'detectorType': d.get('detector_type', 'artifact'),
                'artifactColor': 'green' if cn == 'artifact_green' else 'purple' if cn == 'artifact_purple' else None,
                'confidence': float(d.get('confidence', 0.0)),
                'x': float(x1),
                'y': float(y1),
                'width': float(x2 - x1),
                'height': float(y2 - y1),
                'centerX': (float(x1 + x2) / 2 / fw) if fw else None,
                'centerY': (float(y1 + y2) / 2 / fh) if fh else None,
                'frameWidth': fw,
                'frameHeight': fh,
                'createdAt': now,
                'updatedAt': now,
            })
    
    # Insert detections
    print(f"[TEST] Inserting {len(rows)} detections...")
    db.autoscoredetections.delete_many({'jobId': job_id})
    if rows:
        db.autoscoredetections.insert_many(rows)
    
    # Run scoring algorithm
    print("[TEST] Running scoring algorithm...")
    all_detections = list(db.autoscoredetections.find({'jobId': job_id}))
    all_zones = list(db.autoscorecalibrationzones.find({'jobId': job_id}))
    
    scoring_result = score_video(str(job_id), all_detections, all_zones)
    
    red_score = scoring_result.get('red_score', 0)
    blue_score = scoring_result.get('blue_score', 0)
    events = scoring_result.get('events', [])
    
    print("\n" + "=" * 60)
    print("SCORING RESULTS")
    print("=" * 60)
    print(f"Red Team Score:  {red_score}")
    print(f"Blue Team Score: {blue_score}")
    print(f"Total Detections: {len(all_detections)}")
    print(f"Unique Balls Tracked: {scoring_result.get('unique_balls_tracked', 0)}")
    print(f"Balls Scored: {scoring_result.get('balls_scored', 0)}")
    print(f"Total Scoring Events: {len(events)}")
    print("\nScoring Events:")
    for i, event in enumerate(events, 1):
        print(f"  {i}. Frame {event['frame_number']} @ {event['timestamp']:.2f}s: "
              f"Ball {event['ball_id']} ({event['ball_color']}) → "
              f"{event['basket_type']} ({event['alliance']}) = {event['points']} point")
    print("=" * 60 + "\n")
    
    # Insert timeline events
    timeline_events = []
    for event in events:
        event_doc = {
            'jobId': job_id,
            'timestamp': event.get('timestamp'),
            'frameNumber': event.get('frame_number'),
            'ballId': event.get('ball_id'),
            'ballColor': event.get('ball_color'),
            'basketType': event.get('basket_type'),
            'alliance': event.get('alliance'),
            'eventType': event.get('event_type'),
            'points': event.get('points'),
            'description': event.get('description'),
            'createdAt': now,
        }
        timeline_events.append(event_doc)
    
    if timeline_events:
        db.autoscoretimelineevents.delete_many({'jobId': job_id})
        db.autoscoretimelineevents.insert_many(timeline_events)
        print(f"[TEST] Inserted {len(timeline_events)} timeline events")
    
    # Update summary
    db.autoscoresummaries.update_one({'jobId': job_id}, {
        '$set': {
            'jobId': job_id,
            'totalDetections': len(all_detections),
            'redScore': red_score,
            'blueScore': blue_score,
            'totalEvents': len(timeline_events),
            'updatedAt': now,
        },
        '$setOnInsert': {'createdAt': now}
    }, upsert=True)
    
    # Update job status
    db.autoscorejobs.update_one({'_id': job_id}, {
        '$set': {
            'status': 'scoring_complete',
            'redScore': red_score,
            'blueScore': blue_score,
            'totalEvents': len(timeline_events),
            'updatedAt': now,
            'progress': 100,
        }
    })
    
    print(f"[TEST] ✓ Local scoring pipeline completed successfully!")
    print(f"[TEST] Job ID: {job_id}")


if __name__ == '__main__':
    main()
