#!/usr/bin/env python3
"""Create deterministic train/val/test splits for the scoring-structure dataset."""
from __future__ import annotations

import argparse
import random
import shutil
from pathlib import Path

import yaml


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="decode-training/scoring-structure-dataset")
    parser.add_argument("--seed", type=int, default=20260518)
    parser.add_argument("--val-ratio", type=float, default=0.1)
    parser.add_argument("--test-ratio", type=float, default=0.1)
    args = parser.parse_args()

    root = Path(args.root)
    source_images = root / "train" / "images"
    source_labels = root / "train" / "labels"
    images = sorted(source_images.glob("*"))
    if not images:
        raise SystemExit(f"No source images found in {source_images}")

    pairs = [(img, source_labels / f"{img.stem}.txt") for img in images]
    missing = [img for img, label in pairs if not label.exists()]
    if missing:
        raise SystemExit(f"Missing labels for {len(missing)} images; first missing: {missing[0]}")

    rng = random.Random(args.seed)
    rng.shuffle(pairs)
    total = len(pairs)
    test_count = round(total * args.test_ratio)
    val_count = round(total * args.val_ratio)
    split_pairs = {
        "test": pairs[:test_count],
        "val": pairs[test_count:test_count + val_count],
        "train": pairs[test_count + val_count:],
    }

    for split in split_pairs:
        for kind in ("images", "labels"):
            dest = root / kind / split
            if dest.exists():
                shutil.rmtree(dest)
            dest.mkdir(parents=True, exist_ok=True)

    for split, split_items in split_pairs.items():
        for image, label in split_items:
            shutil.copy2(image, root / "images" / split / image.name)
            shutil.copy2(label, root / "labels" / split / label.name)

    data = {
        "path": str(root.resolve()),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": 2,
        "names": ["scoring_basket_blue", "scoring_basket_red"],
    }
    (root / "data.yaml").write_text(yaml.safe_dump(data, sort_keys=False))

    print(
        "Prepared scoring-structure dataset:",
        f"train={len(split_pairs['train'])}",
        f"val={len(split_pairs['val'])}",
        f"test={len(split_pairs['test'])}",
    )


if __name__ == "__main__":
    main()
