"""Simple frame extractor service wrapper for other code to import."""
from pathlib import Path
from typing import Iterable


def extract_frames_for_video(video_path: Path, out_dir: Path, fps: float = 2.0):
    # thin wrapper that calls the script-level implementation when needed
    from scripts.decode.extract_frames import extract_from_video
    return extract_from_video(video_path, out_dir, fps=fps)
