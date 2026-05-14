#!/usr/bin/env python3
"""Split YOLO-labeled DECODE images into train/val/test folders."""
import argparse
from pathlib import Path
import random
import shutil

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def split(source_images: Path, source_labels: Path, out_images: Path, out_labels: Path, ratios=(0.8, 0.1, 0.1), seed=42):
    imgs = sorted([p for p in source_images.iterdir() if p.suffix.lower() in IMAGE_EXTS])
    if not imgs:
        raise SystemExit(f"No images found in {source_images}")
    random.seed(seed)
    random.shuffle(imgs)
    n = len(imgs)
    n_train = max(1, int(ratios[0] * n))
    n_val = max(1, int(ratios[1] * n)) if n >= 3 else 0
    if n_train + n_val >= n and n >= 3:
        n_train = n - 2
        n_val = 1
    splits = {
        'train': imgs[:n_train],
        'val': imgs[n_train:n_train + n_val],
        'test': imgs[n_train + n_val:]
    }
    for name, files in splits.items():
        img_out = out_images / name
        lbl_out = out_labels / name
        img_out.mkdir(parents=True, exist_ok=True)
        lbl_out.mkdir(parents=True, exist_ok=True)
        for f in files:
            shutil.copy(f, img_out / f.name)
            lbl = source_labels / (f.stem + '.txt')
            if lbl.exists():
                shutil.copy(lbl, lbl_out / lbl.name)
            else:
                print(f"Warning: missing label for {f.name}")
        print(f"{name}: {len(files)} images")


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--images', default='decode-training/labeled-dataset/images')
    p.add_argument('--labels', default='decode-training/labeled-dataset/labels')
    p.add_argument('--out-images', default='decode-training/labeled-dataset/images')
    p.add_argument('--out-labels', default='decode-training/labeled-dataset/labels')
    args = p.parse_args()
    split(Path(args.images)/'all', Path(args.labels)/'all', Path(args.out_images), Path(args.out_labels))


if __name__ == '__main__':
    main()
