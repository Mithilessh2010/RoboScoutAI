#!/usr/bin/env python3
"""Benchmark the raw ball-ID tracker across local DECODE videos.

This intentionally avoids MongoDB. It uses only:
- the video file
- a fresh or existing prediction JSON
- auto-suggested editable basket zones from the structure model
- the local raw tracker scorer
"""
import argparse
import csv
import json
import subprocess
import sys
import time
from pathlib import Path

import cv2
from ultralytics import YOLO

from autoscore_algorithm import score_video


VIDEO_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.webm', '.MOV'}


def find_videos(video_dir: Path):
    return sorted(path for path in video_dir.iterdir() if path.suffix in VIDEO_EXTENSIONS)


def run_prediction(video_path: Path, prediction_dir: Path, conf: float):
    root = Path(__file__).resolve().parents[2]
    predict_script = root / 'scripts' / 'decode' / 'predict_video_decode.py'
    artifact_model = root / 'services' / 'video-processing' / 'models' / 'decode' / 'best.pt'
    prediction_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(predict_script),
        str(video_path),
        '--model',
        str(artifact_model),
        '--detector-mode',
        'artifact',
        '--stride',
        '1',
        '--conf',
        str(conf),
        '--out',
        str(prediction_dir),
    ]
    subprocess.run(cmd, cwd=str(root), check=True)


def is_dense_prediction(prediction_json: Path) -> bool:
    """Return true only for per-frame predictions.

    Sparse JSONs from old GUI/web tests are useful for quick previews, but they
    make this benchmark lie. The raw tracker needs frame markers for every
    processed frame so it can distinguish a made basket from a bounce-out.
    """
    try:
        data = json.loads(prediction_json.read_text())
    except Exception:
        return False
    return int(data.get('frame_stride') or 0) == 1


def find_existing_prediction(root: Path, prediction_dir: Path, video_path: Path):
    preferred = prediction_dir / f'{video_path.stem}.json'
    if preferred.exists() and is_dense_prediction(preferred):
        return preferred
    matches = sorted((root / 'decode-training' / 'predictions').glob(f'**/{video_path.stem}.json'))
    dense_matches = [match for match in matches if is_dense_prediction(match)]
    return dense_matches[0] if dense_matches else preferred


def suggest_basket_zones(video_path: Path, structure_model: YOLO, min_confidence: float):
    cap = cv2.VideoCapture(str(video_path))
    ok, frame = cap.read()
    cap.release()
    if not ok or frame is None:
        return []

    result = structure_model(frame, verbose=False)[0]
    candidates_by_class = {}
    for box in result.boxes:
        class_name = structure_model.names[int(box.cls[0])]
        confidence = float(box.conf[0])
        xyxy = list(map(float, box.xyxy[0]))
        candidates_by_class.setdefault(class_name, []).append((confidence, xyxy))

    frame_h, frame_w = frame.shape[:2]
    zones = []
    for class_name, candidates in sorted(candidates_by_class.items()):
        usable = [item for item in candidates if item[0] >= min_confidence]
        if not usable:
            continue
        best_confidence = max(confidence for confidence, _xyxy in usable)
        near_best = [
            item for item in usable
            if item[0] >= max(min_confidence, best_confidence * 0.92, best_confidence - 0.07)
        ]
        # Pick the tightest high-confidence basket crop. The structure model can
        # emit nested boxes; the largest one often includes ramp/background and
        # makes the tracker count near misses or the wrong side of the field.
        confidence, (x1, y1, x2, y2) = min(
            near_best,
            key=lambda item: ((item[1][2] - item[1][0]) * (item[1][3] - item[1][1]), -item[0]),
        )
        alliance = 'red' if class_name.endswith('_red') else 'blue'
        zones.append({
            'zoneType': f'basket_{alliance}',
            'alliance': alliance,
            'shapeType': 'rectangle',
            'coordinates': [
                {'x': x1 / frame_w, 'y': y1 / frame_h},
                {'x': x2 / frame_w, 'y': y2 / frame_h},
            ],
            'suggestedConfidence': confidence,
        })
    return zones


def flatten_prediction(prediction_json: Path):
    prediction = json.loads(prediction_json.read_text())
    rows = []
    for frame in prediction.get('detections', []):
        frame_number = int(frame.get('frame', 0))
        timestamp = float(frame.get('timestamp', 0.0))
        fw = float(frame.get('width') or prediction.get('width') or 0)
        fh = float(frame.get('height') or prediction.get('height') or 0)
        rows.append({
            'frameNumber': frame_number,
            'timestamp': timestamp,
            'className': '__frame_marker__',
            'confidence': 0.0,
            'centerX': None,
            'centerY': None,
            'frameWidth': fw,
            'frameHeight': fh,
        })
        for detection in frame.get('detections', []):
            x1, y1, x2, y2 = detection.get('bbox_xyxy', [0, 0, 0, 0])
            class_name = detection.get('class_name')
            rows.append({
                'frameNumber': frame_number,
                'timestamp': timestamp,
                'className': class_name,
                'classId': int(detection.get('class_id', 0)),
                'detectorType': detection.get('detector_type', 'artifact'),
                'artifactColor': 'green' if class_name == 'artifact_green' else 'purple' if class_name == 'artifact_purple' else None,
                'confidence': float(detection.get('confidence', 0.0)),
                'centerX': ((float(x1) + float(x2)) / 2 / fw) if fw else None,
                'centerY': ((float(y1) + float(y2)) / 2 / fh) if fh else None,
                'frameWidth': fw,
                'frameHeight': fh,
            })
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--video-dir', default='decode-training/raw-videos/unsorted')
    parser.add_argument('--prediction-dir', default='decode-training/predictions/raw-tracker-benchmark')
    parser.add_argument('--report', default='runs/raw_tracker_benchmark.csv')
    parser.add_argument('--conf', type=float, default=0.25)
    parser.add_argument('--structure-conf', type=float, default=0.50)
    parser.add_argument('--skip-existing', action='store_true')
    parser.add_argument('--limit', type=int, default=0)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    video_dir = (root / args.video_dir).resolve()
    prediction_dir = (root / args.prediction_dir).resolve()
    report_path = (root / args.report).resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)

    structure_model_path = root / 'services' / 'video-processing' / 'models' / 'decode' / 'scoring-structure-best.pt'
    structure_model = YOLO(str(structure_model_path))

    videos = find_videos(video_dir)
    if args.limit:
        videos = videos[:args.limit]

    rows = []
    for index, video_path in enumerate(videos, start=1):
        started = time.time()
        prediction_json = find_existing_prediction(root, prediction_dir, video_path)
        status = 'ok'
        error = ''
        try:
            if not prediction_json.exists() or not args.skip_existing:
                print(f'[{index}/{len(videos)}] Predicting {video_path.name}')
                run_prediction(video_path, prediction_dir, args.conf)
                prediction_json = prediction_dir / f'{video_path.stem}.json'
            else:
                print(f'[{index}/{len(videos)}] Reusing {prediction_json}')

            zones = suggest_basket_zones(video_path, structure_model, args.structure_conf)
            detections = flatten_prediction(prediction_json)
            result = score_video(video_path.stem, detections, zones, persistence_frames=2, confidence_threshold=args.conf, max_distance=0.15)
        except Exception as exc:
            status = 'failed'
            error = str(exc)
            zones = []
            detections = []
            result = {'red_score': 0, 'blue_score': 0, 'total_events': 0, 'unique_balls_tracked': 0}

        elapsed = time.time() - started
        rows.append({
            'video': video_path.name,
            'status': status,
            'red_score': result.get('red_score', 0),
            'blue_score': result.get('blue_score', 0),
            'total_events': result.get('total_events', 0),
            'unique_balls_tracked': result.get('unique_balls_tracked', 0),
            'detections_or_markers': len(detections),
            'zones': len(zones),
            'seconds': f'{elapsed:.2f}',
            'error': error,
        })
        print(rows[-1])

        with report_path.open('w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)

    print(f'Wrote {report_path}')


if __name__ == '__main__':
    main()
