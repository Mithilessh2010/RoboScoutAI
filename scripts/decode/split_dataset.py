#!/usr/bin/env python3
"""Split labeled images into train/val/test folders.
Expects YOLO-style labels next to images in the labeled-dataset folders.
"""
import argparse
from pathlib import Path
import random
import shutil


def split(source_images: Path, source_labels: Path, out_images: Path, out_labels: Path, ratios=(0.8,0.1,0.1), seed=42):
    imgs = sorted([p for p in source_images.glob('*.jpg')])
    random.seed(seed)
    random.shuffle(imgs)
    n = len(imgs)
    n_train = int(ratios[0]*n)
    n_val = int(ratios[1]*n)
    splits = {
        'train': imgs[:n_train],
        'val': imgs[n_train:n_train+n_val],
        'test': imgs[n_train+n_val:]
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
