#!/usr/bin/env python3
"""Extract frames from videos in decode-training/raw-videos/unsorted/.

Default: 2 FPS. Filenames include video basename and timestamp to avoid collisions.
"""
import argparse
import os
from pathlib import Path
import cv2
from tqdm import tqdm


def extract_from_video(video_path: Path, out_dir: Path, fps: float = 2.0):
    out_dir.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"Failed to open {video_path}")
        return 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration = total_frames / video_fps if video_fps else 0

    step = 1.0 / fps
    t = 0.0
    saved = 0
    pbar = tqdm(total=int(duration * fps) + 1, desc=video_path.name)
    while t <= duration:
        sec = t
        cap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000)
        ret, frame = cap.read()
        if not ret:
            break
        fname = f"{video_path.stem}_t{sec:.2f}_f{saved:06d}.jpg"
        out_path = out_dir / fname
        if not out_path.exists():
            cv2.imwrite(str(out_path), frame)
        saved += 1
        t += step
        pbar.update(1)
    pbar.close()
    cap.release()
    return saved


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src", default="decode-training/raw-videos/unsorted", help="source videos")
    p.add_argument("--out", default="decode-training/extracted-frames", help="output folder")
    p.add_argument("--fps", type=float, default=2.0, help="frames per second to extract")
    args = p.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    videos = list(src.glob("**/*.*"))
    video_exts = {".mp4", ".mov", ".mkv", ".webm", ".avi"}
    videos = [v for v in videos if v.suffix.lower() in video_exts]
    total = 0
    for v in videos:
        video_out = out / v.stem
        n = extract_from_video(v, video_out, fps=args.fps)
        total += n
    print(f"Extracted {total} frames from {len(videos)} videos.")


if __name__ == "__main__":
    main()
