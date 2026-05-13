#!/usr/bin/env python3
"""Create contact sheet per video by sampling frames at percentages.
Saves sheets to decode-training/reports/contact-sheets/ by default.
"""
import argparse
from pathlib import Path
import cv2
from PIL import Image, ImageDraw, ImageFont
import math


def frames_at_percentages(cap, percentages):
    frames = []
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    for p in percentages:
        idx = int(p * total)
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, min(idx, total-1)))
        ret, frame = cap.read()
        if not ret:
            frames.append(None)
        else:
            # convert BGR->RGB
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    return frames


def make_contact_sheet(images, title, out_path, thumb_size=(480,270)):
    # layout horizontally
    cols = len(images)
    rows = 1
    w, h = thumb_size
    sheet = Image.new('RGB', (cols*w, rows*h + 40), color=(20,20,20))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('DejaVuSans.ttf', 16)
    except Exception:
        font = ImageFont.load_default()
    draw.text((6,6), title, fill=(255,255,255), font=font)
    y = 40
    x = 0
    for img in images:
        if img is None:
            thumb = Image.new('RGB', thumb_size, color=(80,80,80))
        else:
            thumb = Image.fromarray(img)
            thumb.thumbnail(thumb_size)
            # paste centered
            bg = Image.new('RGB', thumb_size, (0,0,0))
            bg.paste(thumb, ((thumb_size[0]-thumb.width)//2, (thumb_size[1]-thumb.height)//2))
            thumb = bg
        sheet.paste(thumb, (x,y))
        x += w
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def process_video(video_path: Path, out_dir: Path):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"Cannot open {video_path}")
        return
    perc = [0.1, 0.3, 0.5, 0.7, 0.9]
    frames = frames_at_percentages(cap, perc)
    title = video_path.name
    out_path = out_dir / f"{video_path.stem}_contact.jpg"
    make_contact_sheet(frames, title, out_path)
    cap.release()


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--src', default='decode-training/raw-videos/unsorted')
    p.add_argument('--out', default='decode-training/reports/contact-sheets')
    args = p.parse_args()
    src = Path(args.src)
    out = Path(args.out)
    video_exts = {'.mp4', '.mov', '.mkv', '.webm', '.avi'}
    videos = [p for p in src.glob('**/*.*') if p.suffix.lower() in video_exts]
    print(f'Found {len(videos)} videos')
    for v in videos:
        print('Processing', v.name)
        process_video(v, out)


if __name__ == '__main__':
    main()
