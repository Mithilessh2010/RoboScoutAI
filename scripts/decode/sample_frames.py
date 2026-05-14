#!/usr/bin/env python3
"""Sample extracted frames for DECODE labeling.

The sampler treats all camera angles as useful training data. For each video it
includes early, middle, late, evenly spaced, and random frames.
"""
import argparse
import json
from pathlib import Path
import random
import shutil


def choose_indices(count: int, per_video: int, rng: random.Random):
    if count <= 0:
        return []
    per_video = min(per_video, count)
    anchors = {0, count // 4, count // 2, (3 * count) // 4, count - 1}
    indices = {max(0, min(count - 1, i)) for i in anchors}

    even_count = max(1, per_video // 2)
    if even_count == 1:
        indices.add(count // 2)
    else:
        for i in range(even_count):
            indices.add(round(i * (count - 1) / (even_count - 1)))

    while len(indices) < per_video:
        indices.add(rng.randrange(count))
    return sorted(indices)[:per_video]


def sample_frames(extracted_dir: Path, out_dir: Path, per_video: int = 20, random_seed: int = 42):
    out_dir.mkdir(parents=True, exist_ok=True)
    videos = sorted([p for p in extracted_dir.iterdir() if p.is_dir()])
    rng = random.Random(random_seed)
    sampled = 0
    manifest = []
    for v in videos:
        frames = sorted(v.glob("*.jpg"))
        if not frames:
            continue
        for i in choose_indices(len(frames), per_video, rng):
            src = frames[i]
            dst = out_dir / f"{v.name}_{src.name}"
            if not dst.exists():
                shutil.copy(src, dst)
                sampled += 1
            manifest.append({"sample": dst.name, "source": str(src), "video": v.name, "index_in_video": i})
    (out_dir / "sample_manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"Sampled {sampled} frames to {out_dir}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--extracted", default="decode-training/extracted-frames")
    p.add_argument("--out", default="decode-training/sampled-frames")
    p.add_argument("--per-video", type=int, default=20)
    args = p.parse_args()
    sample_frames(Path(args.extracted), Path(args.out), per_video=args.per_video)


if __name__ == "__main__":
    main()
