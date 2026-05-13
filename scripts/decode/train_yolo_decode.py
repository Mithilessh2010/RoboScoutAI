#!/usr/bin/env python3
"""Train YOLO on the DECODE dataset using Ultralytics.
Falls back to instructions if GPU or ultralytics not available.
"""
import argparse
from pathlib import Path
import subprocess
import sys


def check_gpu():
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


def has_ultralytics():
    try:
        import ultralytics
        return True
    except Exception:
        return False


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data', default='decode-training/labeled-dataset/data.yaml')
    p.add_argument('--model', default='yolov8n.pt')
    p.add_argument('--epochs', type=int, default=20)
    p.add_argument('--batch', type=int, default=8)
    args = p.parse_args()

    gpu = check_gpu()
    if not has_ultralytics() or not gpu:
        print('Ultralytics or GPU not available locally. See notebooks/TRAIN_DECODE_YOLO.md for Colab instructions.')
        sys.exit(0)

    # run ultralytics training
    from ultralytics import YOLO
    model = YOLO(args.model)
    model.train(data=args.data, epochs=args.epochs, batch=args.batch, imgsz=640, workers=4)
    # copy best to trained-models
    best = Path('runs')
    # attempt to find best.pt
    import glob
    candidates = list(Path('runs').glob('**/best.pt'))
    if candidates:
        dst = Path('decode-training/trained-models/best.pt')
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(candidates[0].read_bytes())
        print('Saved best.pt to', dst)
    else:
        print('Training complete but could not find best.pt automatically. Check runs/ for artifacts.')


if __name__ == '__main__':
    main()
