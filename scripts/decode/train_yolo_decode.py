#!/usr/bin/env python3
"""Train a DECODE-only YOLO detector with Ultralytics."""
import argparse
import shutil
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.decode.validate_yolo_dataset import validate


def check_gpu():
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
        return "cpu"
    except Exception:
        return "cpu"


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
    p.add_argument('--epochs', type=int, default=50)
    p.add_argument('--batch', type=int, default=8)
    p.add_argument('--imgsz', type=int, default=640)
    p.add_argument('--device', default=None, help='cuda, mps, cpu, or blank for auto')
    p.add_argument('--project', default='decode-training/trained-models/runs')
    p.add_argument('--name', default='decode-yolo')
    p.add_argument(
        '--expected',
        choices=['auto', 'phase1-artifacts', 'phase2-robot', 'full-decode'],
        default='auto',
        help='Expected dataset class set.',
    )
    p.add_argument(
        '--best-dest',
        default='decode-training/trained-models/best.pt',
        help='Where to copy the best trained weights after training.',
    )
    args = p.parse_args()

    result = validate(Path(args.data), allow_empty=False, expected=args.expected)
    if result.images == 0 or result.labels == 0:
        print('No labeled data available. See DECODE_DATASET_GUIDE.md before training.')
        sys.exit(0)

    if not has_ultralytics():
        print('Ultralytics is not installed. Run: pip install -r requirements-decode.txt')
        print('For GPU training, see notebooks/TRAIN_DECODE_YOLO.md.')
        sys.exit(0)

    device = args.device or check_gpu()
    if device == "cpu":
        print('No local GPU/MPS detected. Training can run on CPU but will be slow.')
        print('Use notebooks/TRAIN_DECODE_YOLO.md for Google Colab GPU training if preferred.')

    from ultralytics import YOLO
    model = YOLO(args.model)
    train_result = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=device,
        project=args.project,
        name=args.name,
        workers=4,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=8.0,
        translate=0.1,
        scale=0.5,
        shear=2.0,
        perspective=0.0008,
        flipud=0.0,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.05,
        copy_paste=0.05,
        erasing=0.2,
    )

    save_dir = Path(getattr(train_result, "save_dir", Path(args.project) / args.name))
    candidates = sorted(save_dir.glob('weights/best.pt'), key=lambda pth: pth.stat().st_mtime, reverse=True)
    if not candidates:
        candidates = sorted(Path(args.project).glob('**/best.pt'), key=lambda pth: pth.stat().st_mtime, reverse=True)
    if candidates:
        dst = Path(args.best_dest)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(candidates[0], dst)
        print(f'Saved trained model to {dst}')
    else:
        print('Training complete but could not find best.pt automatically. Check runs/ for artifacts.')


if __name__ == '__main__':
    main()
