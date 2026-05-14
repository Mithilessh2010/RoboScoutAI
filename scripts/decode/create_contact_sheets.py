#!/usr/bin/env python3
"""Create optional contact sheets for quick DECODE frame review."""
import argparse
import hashlib
from pathlib import Path
import cv2
from PIL import Image, ImageDraw, ImageFont

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def output_name(video_path: Path) -> str:
    digest = hashlib.sha1(video_path.name.encode("utf-8")).hexdigest()[:8]
    return f"{video_path.stem}_{video_path.suffix.lower().lstrip('.')}_{digest}_contact.jpg"


def frames_at_percentages(cap, percentages):
    frames = []
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    for pct in percentages:
        idx = int(max(0, min(total - 1, round(pct * max(total - 1, 0)))))
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        timestamp = idx / fps if fps else 0.0
        frames.append((cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), timestamp) if ret else (None, timestamp))
    return frames


def make_contact_sheet(items, title, out_path, thumb_size=(360, 202), cols=4):
    rows = max(1, (len(items) + cols - 1) // cols)
    label_h = 26
    title_h = 36
    width = cols * thumb_size[0]
    height = title_h + rows * (thumb_size[1] + label_h)
    sheet = Image.new("RGB", (width, height), color=(24, 24, 24))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 15)
    except Exception:
        font = ImageFont.load_default()
    draw.text((8, 8), title, fill=(255, 255, 255), font=font)

    for pos, (img, timestamp) in enumerate(items):
        col = pos % cols
        row = pos // cols
        x = col * thumb_size[0]
        y = title_h + row * (thumb_size[1] + label_h)
        if img is None:
            thumb = Image.new("RGB", thumb_size, color=(80, 80, 80))
        else:
            thumb = Image.fromarray(img)
            thumb.thumbnail(thumb_size)
            bg = Image.new("RGB", thumb_size, (0, 0, 0))
            bg.paste(thumb, ((thumb_size[0] - thumb.width) // 2, (thumb_size[1] - thumb.height) // 2))
            thumb = bg
        sheet.paste(thumb, (x, y))
        draw.text((x + 8, y + thumb_size[1] + 5), f"{timestamp:0.1f}s", fill=(220, 220, 220), font=font)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=92)


def process_video(video_path: Path, out_dir: Path):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"Cannot open {video_path}")
        return False
    percentages = [0.02, 0.08, 0.16, 0.25, 0.40, 0.50, 0.60, 0.75, 0.84, 0.92, 0.98]
    frames = frames_at_percentages(cap, percentages)
    cap.release()
    make_contact_sheet(frames, video_path.name, out_dir / output_name(video_path))
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="decode-training/raw-videos/unsorted")
    parser.add_argument("--out", default="decode-training/reports/contact-sheets")
    args = parser.parse_args()

    videos = sorted([p for p in Path(args.src).glob("**/*.*") if p.suffix.lower() in VIDEO_EXTS])
    print(f"Found {len(videos)} videos")
    made = 0
    for video in videos:
        print(f"Processing {video.name}")
        made += 1 if process_video(video, Path(args.out)) else 0
    print(f"Saved {made} contact sheets to {args.out}")


if __name__ == "__main__":
    main()
