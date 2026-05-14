"""Frame extraction helpers for DECODE video processing."""
from pathlib import Path
from typing import Iterator, Tuple

import cv2


def extract_frames_for_video(video_path: Path, out_dir: Path, fps: float = 2.0):
    from scripts.decode.extract_frames import extract_from_video
    return extract_from_video(video_path, out_dir, fps=fps)


def iter_video_frames(video_path: Path, stride: int = 1) -> Iterator[Tuple[int, float, object]]:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video: {video_path}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_idx = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx % max(1, stride) == 0:
                yield frame_idx, frame_idx / fps, frame
            frame_idx += 1
    finally:
        cap.release()
