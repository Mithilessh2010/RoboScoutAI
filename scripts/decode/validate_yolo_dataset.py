#!/usr/bin/env python3
"""Validate the DECODE YOLO dataset layout and annotations."""
import argparse
from dataclasses import dataclass
from pathlib import Path

import yaml

EXPECTED_NAMES = [
    "robot_red",
    "robot_blue",
    "artifact_purple",
    "artifact_green",
    "goal_red",
    "goal_blue",
    "ramp_red",
    "ramp_blue",
    "base_red",
    "base_blue",
    "obelisk",
    "field_boundary",
]

PHASE1_ARTIFACT_NAMES = [
    "artifact_green",
    "artifact_purple",
]

ROBOT_NAMES = [
    "robot",
]


@dataclass
class ValidationResult:
    images: int = 0
    labels: int = 0
    warnings: int = 0


def names_as_list(names):
    if isinstance(names, dict):
        return [names[i] for i in sorted(names)]
    return list(names or [])


def validate(data_yaml: Path, allow_empty: bool = False, expected: str = "auto") -> ValidationResult:
    if not data_yaml.exists():
        raise SystemExit(f"Missing {data_yaml}")
    d = yaml.safe_load(data_yaml.read_text()) or {}
    names = names_as_list(d.get("names"))
    nc = int(d.get("nc", len(names)))
    expected_options = {
        "phase1-artifacts": PHASE1_ARTIFACT_NAMES,
        "phase2-robot": ROBOT_NAMES,
        "full-decode": EXPECTED_NAMES,
    }
    if expected == "auto":
        valid_names = list(expected_options.values())
        if names not in valid_names or nc != len(names):
            raise SystemExit(
                "Expected Phase 1 artifact classes "
                f"{PHASE1_ARTIFACT_NAMES}, Phase 2 robot classes {ROBOT_NAMES}, "
                f"or full DECODE classes; got nc={nc}, names={names}"
            )
    else:
        expected_names = expected_options[expected]
        if nc != len(expected_names) or names != expected_names:
            raise SystemExit(f"Expected {expected_names}, got nc={nc}, names={names}")
    print(f"Found {nc} classes")
    root = data_yaml.parent
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    result = ValidationResult()

    def to_path(value):
        path = Path(value)
        return path if path.is_absolute() else (root / path).resolve()

    for split in ["train", "val", "test"]:
        split_value = d.get(split)
        if not split_value:
            raise SystemExit(f"No {split} split in data.yaml")
        split_dir = to_path(split_value)
        labels_candidates = [
            split_dir.parent / "labels",
            root / "labels" / split,
            root / split / "labels",
        ]
        labels_dir = next((path for path in labels_candidates if path.exists()), labels_candidates[0])
        if not split_dir.exists():
            raise SystemExit(f"Missing {split} image directory: {split_dir}")
        if not labels_dir.exists():
            raise SystemExit(f"Missing {split} label directory: {labels_dir}")
        images = sorted([p for p in split_dir.rglob("*") if p.suffix.lower() in image_exts])
        labels = sorted(labels_dir.glob("*.txt"))
        if not images:
            print(f"{split}: 0 images")
            if not allow_empty:
                raise SystemExit(f"{split} split is empty. Add labeled images before training.")
            continue
        result.images += len(images)
        result.labels += len(labels)
        print(f"{split}: {len(images)} images, {len(labels)} label files")
        if not labels and not allow_empty:
            raise SystemExit(f"{split} has images but no YOLO labels.")
        for imgp in images:
            lbl = labels_dir / imgp.with_suffix(".txt").name
            if not lbl.exists():
                result.warnings += 1
                print(f"Warning: label missing for {imgp}")
                if not allow_empty:
                    raise SystemExit(f"Missing label for {imgp}")
                continue
            for line in lbl.read_text().splitlines():
                parts = line.split()
                if not parts:
                    continue
                if len(parts) != 5:
                    raise SystemExit(f"Invalid label line in {lbl}: {line}")
                try:
                    cid = int(parts[0])
                    vals = list(map(float, parts[1:5]))
                except ValueError as exc:
                    raise SystemExit(f"Non-numeric label value in {lbl}: {line}") from exc
                if cid < 0 or cid >= nc:
                    raise SystemExit(f"Invalid class id {cid} in {lbl}")
                x, y, w, h = vals
                if any(v < 0 or v > 1 for v in vals) or w <= 0 or h <= 0:
                    raise SystemExit(f"BBox out of range or empty in {lbl}: {line}")

    if result.images == 0:
        print("YOLO dataset scaffold is present, but no labeled split images were found.")
        if not allow_empty:
            raise SystemExit("No labeled data found. Label sampled frames before training.")
    elif result.labels == 0:
        raise SystemExit("Images were found, but no labels were found. Supervised training cannot run.")
    else:
        print("YOLO dataset validation passed")
    return result


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="decode-training/labeled-dataset/data.yaml")
    p.add_argument("--allow-empty", action="store_true", help="Only validate scaffold/classes; do not require labeled splits.")
    p.add_argument(
        "--expected",
        choices=["auto", "phase1-artifacts", "phase2-robot", "full-decode"],
        default="auto",
        help="Expected DECODE class set.",
    )
    args = p.parse_args()
    validate(Path(args.data), allow_empty=args.allow_empty, expected=args.expected)


if __name__ == "__main__":
    main()
