#!/usr/bin/env python3
"""Convert YOLO segmentation polygons into YOLO detection bounding boxes."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import yaml


def polygon_line_to_box(line: str) -> str:
    parts = line.split()
    if len(parts) == 5:
        return line
    if len(parts) < 7 or len(parts[1:]) % 2:
        raise ValueError(f"Expected segmentation polygon, got: {line}")
    class_id = parts[0]
    coords = [float(value) for value in parts[1:]]
    xs = coords[0::2]
    ys = coords[1::2]
    x1, x2 = min(xs), max(xs)
    y1, y2 = min(ys), max(ys)
    x_center = (x1 + x2) / 2
    y_center = (y1 + y2) / 2
    width = x2 - x1
    height = y2 - y1
    return f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="decode-training/scoring-structure-dataset")
    parser.add_argument("--dest", default="decode-training/scoring-structure-detection-dataset")
    args = parser.parse_args()

    source = Path(args.source)
    dest = Path(args.dest)
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)

    for split in ("train", "val", "test"):
        image_src = source / "images" / split
        label_src = source / "labels" / split
        image_dest = dest / "images" / split
        label_dest = dest / "labels" / split
        shutil.copytree(image_src, image_dest)
        label_dest.mkdir(parents=True)
        for label_path in sorted(label_src.glob("*.txt")):
            converted = []
            for line in label_path.read_text().splitlines():
                line = line.strip()
                if line:
                    converted.append(polygon_line_to_box(line))
            (label_dest / label_path.name).write_text("\n".join(converted))

    data = {
        "path": str(dest.resolve()),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": 2,
        "names": ["scoring_basket_blue", "scoring_basket_red"],
    }
    (dest / "data.yaml").write_text(yaml.safe_dump(data, sort_keys=False))
    print(f"Converted segmentation dataset to detection boxes at {dest}")


if __name__ == "__main__":
    main()
