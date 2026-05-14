#!/usr/bin/env python3
"""Evaluate a trained YOLO model on the DECODE dataset."""

import argparse
import json
from pathlib import Path
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', default='decode-training/labeled-dataset/data.yaml')
    parser.add_argument('--model', default='decode-training/trained-models/best.pt')
    parser.add_argument('--imgsz', type=int, default=640)
    parser.add_argument('--batch', type=int, default=8)
    parser.add_argument('--out', default='decode-training/reports/evaluations')
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        print(f'Missing trained model: {model_path}')
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except Exception:
        print('Install ultralytics to run evaluation locally')
        sys.exit(0)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    model = YOLO(str(model_path))
    metrics = model.val(data=args.data, imgsz=args.imgsz, batch=args.batch)

    summary = {}
    if hasattr(metrics, 'results_dict'):
        try:
            summary = dict(metrics.results_dict)
        except Exception:
            summary = {}
    elif hasattr(metrics, 'box'):
        summary = {
            'map50': float(getattr(metrics.box, 'map50', 0.0)),
            'map75': float(getattr(metrics.box, 'map75', 0.0)),
            'map': float(getattr(metrics.box, 'map', 0.0)),
        }

    out_file = out_dir / 'evaluation.json'
    out_file.write_text(json.dumps(summary, indent=2, sort_keys=True))
    print(f'Saved evaluation summary to {out_file}')
    if summary:
        print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
