#!/usr/bin/env python3
"""Run DECODE YOLO inference on an image or video and output JSON."""
import argparse
from pathlib import Path
import json
import cv2

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def collect_detections(result, model):
    names = getattr(result, "names", getattr(model, "names", {}))
    detections = []
    for box in result.boxes.data.tolist() if hasattr(result.boxes, "data") else []:
        cls_id = int(box[5])
        detections.append({
            "bbox_xyxy": [float(v) for v in box[:4]],
            "confidence": float(box[4]),
            "class_id": cls_id,
            "class_name": names.get(cls_id, str(cls_id)) if isinstance(names, dict) else str(cls_id),
        })
    return detections


def predict_image(model, source, out_dir, model_path, conf, save_annotated):
    image = cv2.imread(str(source))
    if image is None:
        raise SystemExit(f"Could not open image: {source}")
    height, width = image.shape[:2]

    result = model.predict(image, verbose=False, conf=conf)[0]
    detections = collect_detections(result, model)

    if save_annotated:
        annotated_dir = out_dir / source.stem / "annotated-images"
        annotated_dir.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(annotated_dir / f"{source.stem}.jpg"), result.plot())

    out_file = out_dir / f"{source.stem}.json"
    out_file.write_text(json.dumps({
        "source": str(source),
        "source_type": "image",
        "model": str(model_path),
        "width": width,
        "height": height,
        "detections": detections,
    }, indent=2))
    print("Saved predictions to", out_file)


def predict_video(model, source, out_dir, model_path, conf, stride, save_annotated, save_video):
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise SystemExit(f"Could not open video: {source}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frames_dir = out_dir / source.stem / "annotated-frames"
    if save_annotated:
        frames_dir.mkdir(parents=True, exist_ok=True)
    writer = None
    if save_video:
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        annotated_video = out_dir / f"{source.stem}_annotated.mp4"
        writer = cv2.VideoWriter(str(annotated_video), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    results = []
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % max(1, stride) != 0:
            frame_idx += 1
            continue
        result = model.predict(frame, verbose=False, conf=conf)[0]
        detections = collect_detections(result, model)
        results.append({"frame": frame_idx, "timestamp": frame_idx / fps, "detections": detections})
        if save_annotated or writer is not None:
            annotated = result.plot()
            if save_annotated:
                cv2.imwrite(str(frames_dir / f"frame_{frame_idx:06d}.jpg"), annotated)
            if writer is not None:
                writer.write(annotated)
        frame_idx += 1

    out_file = out_dir / f"{source.stem}.json"
    out_file.write_text(json.dumps({
        "source": str(source),
        "source_type": "video",
        "model": str(model_path),
        "width": width,
        "height": height,
        "fps": fps,
        "frame_stride": max(1, stride),
        "detections": results,
    }, indent=2))
    cap.release()
    if writer is not None:
        writer.release()
    print("Saved predictions to", out_file)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('source', help='Image or video to run artifact detection on')
    p.add_argument('--model', default='services/video-processing/models/decode/best.pt')
    p.add_argument('--out', default='decode-training/predictions')
    p.add_argument('--conf', type=float, default=0.25)
    p.add_argument('--stride', type=int, default=1, help='For videos, run every Nth frame')
    p.add_argument('--save-annotated', action='store_true')
    p.add_argument('--save-video', action='store_true', help='For videos, save an annotated MP4')
    args = p.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        raise SystemExit(f"Missing trained model: {model_path}. Train or copy best.pt first.")
    source = Path(args.source)
    if not source.exists():
        raise SystemExit(f"Missing source file: {source}")

    try:
        from ultralytics import YOLO
    except Exception:
        print('Install ultralytics to run prediction locally')
        return

    model = YOLO(str(model_path))
    outp = Path(args.out)
    outp.mkdir(parents=True, exist_ok=True)

    suffix = source.suffix.lower()
    if suffix in IMAGE_EXTS:
        predict_image(model, source, outp, model_path, args.conf, args.save_annotated)
    elif suffix in VIDEO_EXTS:
        predict_video(model, source, outp, model_path, args.conf, args.stride, args.save_annotated, args.save_video)
    else:
        raise SystemExit(f"Unsupported source type: {source.suffix}")


if __name__ == '__main__':
    main()
