#!/usr/bin/env python3
"""Validate a YOLO dataset layout and labels.
Checks data.yaml, folder existence, class ids, and bounding box ranges.
"""
import argparse
import yaml
from pathlib import Path


def validate(data_yaml: Path):
    if not data_yaml.exists():
        raise SystemExit(f"Missing {data_yaml}")
    d = yaml.safe_load(data_yaml.read_text())
    nc = len(d.get('names', []))
    print(f"Found {nc} classes")
    for split in ['train','val','test']:
        imgs = d.get(split)
        if not imgs:
            raise SystemExit(f"No {split} split in data.yaml")
        print(f"{split}: {len(imgs)} entries")
    # Check labels
    for split in ['train','val','test']:
        for img in d.get(split, []):
            imgp = Path(img)
            lbl = imgp.with_suffix('.txt')
            if not lbl.exists():
                print(f"Warning: label missing for {img}")
            else:
                for line in lbl.read_text().splitlines():
                    parts = line.split()
                    if not parts:
                        continue
                    cid = int(parts[0])
                    if cid < 0 or cid >= nc:
                        raise SystemExit(f"Invalid class id {cid} in {lbl}")
                    # bbox coords are floats
                    vals = list(map(float, parts[1:5]))
                    if any(v < 0 or v > 1 for v in vals):
                        raise SystemExit(f"BBox out of range in {lbl}")
    print('YOLO dataset validation passed')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data', default='decode-training/labeled-dataset/data.yaml')
    args = p.parse_args()
    validate(Path(args.data))


if __name__ == '__main__':
    main()
