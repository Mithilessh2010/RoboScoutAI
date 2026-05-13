#!/usr/bin/env python3
"""Sample frames from extracted frames for labeling.

This script evenly samples across videos and also selects some random frames.
"""
import argparse
from pathlib import Path
import random
import shutil


def sample_frames(extracted_dir: Path, out_dir: Path, per_video: int = 20, random_seed: int = 42):
    out_dir.mkdir(parents=True, exist_ok=True)
    videos = [p for p in extracted_dir.iterdir() if p.is_dir()]
    random.seed(random_seed)
    sampled = 0
    for v in videos:
        frames = sorted(list(v.glob("*.jpg")))
        if not frames:
            continue
        # evenly spaced
        n = min(per_video, len(frames))
        idxs = set()
        for i in range(n//2):
            idx = int(i * len(frames) / (n//2))
            idxs.add(min(idx, len(frames)-1))
        # random others
        while len(idxs) < n:
            idxs.add(random.randrange(len(frames)))
        for i in sorted(list(idxs)):
            src = frames[i]
            dst = out_dir / f"{v.name}_{src.name}"
            if not dst.exists():
                shutil.copy(src, dst)
                sampled += 1
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
