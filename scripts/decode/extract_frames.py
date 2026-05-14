#!/usr/bin/env python3
"""Extract DECODE training frames from unsorted match videos.

Videos stay in decode-training/raw-videos/unsorted/. Camera angles are not
required or inferred. Output filenames include a sanitized video name, timestamp,
and source frame index so reruns can skip existing frames.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import cv2
from tqdm import tqdm

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def safe_video_id(path: Path) -> str:
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", path.stem).strip("_") or "video"
    suffix = path.suffix.lower().lstrip(".") or "video"
    digest = hashlib.sha1(str(path.name).encode("utf-8")).hexdigest()[:8]
    return f"{base}_{suffix}_{digest}"


def extract_from_video(video_path: Path, out_dir: Path, fps: float = 2.0, resume: bool = True):
    out_dir.mkdir(parents=True, exist_ok=True)
    if resume and any(out_dir.glob("*.jpg")):
        existing = len(list(out_dir.glob("*.jpg")))
        print(f"{video_path.name}: {existing} frames already exist; skipping to avoid duplicates")
        return 0
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"Failed to open {video_path}")
        return 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration = total_frames / video_fps if video_fps else 0

    if fps <= 0:
        raise ValueError("--fps must be greater than 0")
    if video_fps <= 0:
        video_fps = 30.0

    frame_step = max(1, round(video_fps / fps))
    video_name = safe_video_id(video_path)
    saved = 0
    skipped = 0
    metadata = {
        "source_video": str(video_path),
        "source_fps": video_fps,
        "requested_fps": fps,
        "duration_seconds": duration,
        "frames": [],
    }
    pbar = tqdm(total=max(1, total_frames // frame_step), desc=video_path.name)

    source_idx = 0
    while source_idx < total_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, source_idx)
        ret, frame = cap.read()
        if not ret:
            break
        sec = source_idx / video_fps
        fname = f"{video_name}_t{sec:.2f}_src{source_idx:06d}.jpg"
        out_path = out_dir / fname
        if not out_path.exists():
            cv2.imwrite(str(out_path), frame)
            saved += 1
        else:
            skipped += 1
        metadata["frames"].append({"file": fname, "timestamp": round(sec, 3), "source_frame": source_idx})
        source_idx += frame_step
        pbar.update(1)

    pbar.close()
    cap.release()
    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print(f"{video_path.name}: saved {saved}, skipped {skipped}")
    return saved


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src", default="decode-training/raw-videos/unsorted", help="source videos")
    p.add_argument("--out", default="decode-training/extracted-frames", help="output folder")
    p.add_argument("--fps", type=float, default=2.0, help="frames per second to extract")
    p.add_argument("--force", action="store_true", help="Extract even if frames already exist for a video")
    args = p.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    videos = sorted([v for v in src.glob("**/*.*") if v.suffix.lower() in VIDEO_EXTS])
    total = 0
    for v in videos:
        video_out = out / safe_video_id(v)
        n = extract_from_video(v, video_out, fps=args.fps, resume=not args.force)
        total += n
    print(f"Extracted {total} new frames from {len(videos)} videos.")


if __name__ == "__main__":
    main()
