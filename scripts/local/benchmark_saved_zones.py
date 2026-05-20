#!/usr/bin/env python3
"""Benchmark local scoring against saved zone-cache calibrations.

This does not touch MongoDB. It reads:
- videos from decode-training/test
- saved zones from runs/local_zone_cache
- fresh/dense artifact predictions from decode-training/predictions/test-benchmark

It writes only benchmark reports under runs/.
"""
import argparse
import csv
import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from autoscore_algorithm import score_video


VIDEO_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.webm', '.MOV'}


def safe_stem(path: Path) -> str:
    return re.sub(r'[^A-Za-z0-9._-]+', '_', path.stem).strip('_') or 'untitled_video'


def expected_counts(video_name: str):
    lower = video_name.lower()
    red = None
    blue = None
    red_match = re.search(r'red\s+(\d+)\s+balls?', lower)
    blue_match = re.search(r'blue\s+(\d+)\s+balls?', lower)
    if red_match:
        red = int(red_match.group(1))
    if blue_match:
        blue = int(blue_match.group(1))
    return red, blue


def load_saved_zones(root: Path, video_path: Path):
    zone_path = root / 'runs' / 'local_zone_cache' / f'{safe_stem(video_path)}.zones.json'
    if not zone_path.exists():
        return zone_path, []
    payload = json.loads(zone_path.read_text())
    return zone_path, payload.get('zones', [])


def run_prediction(root: Path, video_path: Path, prediction_dir: Path, conf: float, force: bool):
    prediction_json = prediction_dir / f'{video_path.stem}.json'
    if prediction_json.exists() and not force:
        try:
            payload = json.loads(prediction_json.read_text())
            if int(payload.get('frame_stride') or 0) == 1:
                return prediction_json, False
        except Exception:
            pass

    prediction_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(root / 'scripts' / 'decode' / 'predict_video_decode.py'),
        str(video_path),
        '--model',
        str(root / 'services' / 'video-processing' / 'models' / 'decode' / 'best.pt'),
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
    return prediction_json, True


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
    parser.add_argument('--video-dir', default='decode-training/test')
    parser.add_argument('--prediction-dir', default='decode-training/predictions/test-benchmark')
    parser.add_argument('--report', default='runs/saved_zone_benchmark.csv')
    parser.add_argument('--json-report', default='runs/saved_zone_benchmark.json')
    parser.add_argument('--conf', type=float, default=0.25)
    parser.add_argument('--force-predict', action='store_true')
    parser.add_argument('--no-save', action='store_true', help='Use temporary predictions and do not write benchmark reports.')
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--only', action='append', default=[], help='Substring filter for video names; may be repeated.')
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    video_dir = (root / args.video_dir).resolve()
    temp_prediction_dir = None
    if args.no_save:
        temp_prediction_dir = tempfile.TemporaryDirectory(prefix='roboscoutai-benchmark-')
        prediction_dir = Path(temp_prediction_dir.name)
    else:
        prediction_dir = (root / args.prediction_dir).resolve()
    report_path = (root / args.report).resolve()
    json_report_path = (root / args.json_report).resolve()
    if not args.no_save:
        report_path.parent.mkdir(parents=True, exist_ok=True)
    videos = sorted(path for path in video_dir.iterdir() if path.suffix in VIDEO_EXTENSIONS)
    if args.only:
        filters = [item.lower() for item in args.only]
        videos = [path for path in videos if any(item in path.name.lower() for item in filters)]
    if args.limit:
        videos = videos[:args.limit]

    rows = []
    for index, video_path in enumerate(videos, start=1):
        started = time.time()
        expected_red, expected_blue = expected_counts(video_path.name)
        zone_path, zones = load_saved_zones(root, video_path)
        status = 'ok'
        error = ''
        prediction_json = None
        try:
            if not zones:
                raise RuntimeError(f'Missing saved zones: {zone_path}')
            print(f'[{index}/{len(videos)}] {video_path.name}')
            prediction_json, predicted_fresh = run_prediction(root, video_path, prediction_dir, args.conf, args.force_predict)
            detections = flatten_prediction(prediction_json)
            result = score_video(
                video_path.stem,
                detections,
                zones,
                persistence_frames=2,
                confidence_threshold=args.conf,
                max_distance=0.15,
            )
        except Exception as exc:
            status = 'failed'
            error = str(exc)
            predicted_fresh = False
            detections = []
            result = {'red_score': 0, 'blue_score': 0, 'total_events': 0, 'unique_balls_tracked': 0}

        red_score = int(result.get('red_score', 0))
        blue_score = int(result.get('blue_score', 0))
        red_error = '' if expected_red is None else red_score - expected_red
        blue_error = '' if expected_blue is None else blue_score - expected_blue
        elapsed = time.time() - started
        row = {
            'video': video_path.name,
            'status': status,
            'expected_red': '' if expected_red is None else expected_red,
            'actual_red': red_score,
            'red_error': red_error,
            'expected_blue': '' if expected_blue is None else expected_blue,
            'actual_blue': blue_score,
            'blue_error': blue_error,
            'total_events': int(result.get('total_events', 0)),
            'unique_balls_tracked': int(result.get('unique_balls_tracked', 0)),
            'detections_or_markers': len(detections),
            'zones': len(zones),
            'prediction_fresh': predicted_fresh,
            'prediction_json': str(prediction_json) if prediction_json else '',
            'zone_path': str(zone_path),
            'seconds': f'{elapsed:.2f}',
            'error': error,
        }
        rows.append(row)
        print(row)
        if not args.no_save:
            with report_path.open('w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=list(row.keys()))
                writer.writeheader()
                writer.writerows(rows)
            json_report_path.write_text(json.dumps(rows, indent=2))

    if args.no_save:
        print(json.dumps(rows, indent=2))
        if temp_prediction_dir is not None:
            temp_prediction_dir.cleanup()
        print('No-save mode: benchmark predictions and reports were not persisted.')
    else:
        print(f'Wrote {report_path}')
        print(f'Wrote {json_report_path}')


if __name__ == '__main__':
    main()
