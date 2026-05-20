#!/usr/bin/env python3
"""Run DECODE YOLO inference on an image or video and output JSON."""
import argparse
from pathlib import Path
import json
import cv2
import subprocess
import tempfile

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def collect_detections(result, model, detector_type):
    names = getattr(result, "names", getattr(model, "names", {}))
    detections = []
    for box in result.boxes.data.tolist() if hasattr(result.boxes, "data") else []:
        cls_id = int(box[5])
        detections.append({
            "bbox_xyxy": [float(v) for v in box[:4]],
            "confidence": float(box[4]),
            "class_id": cls_id,
            "class_name": names.get(cls_id, str(cls_id)) if isinstance(names, dict) else str(cls_id),
            "detector_type": detector_type,
        })
    return detections


def run_models(models, image, conf):
    combined = []
    results = []
    for detector_type, model in models:
        result = model.predict(image, verbose=False, conf=conf)[0]
        results.append(result)
        combined.extend(collect_detections(result, model, detector_type))
    return combined, results


def draw_detections(image, detections):
    annotated = image.copy()
    colors = {
        "artifact_green": (57, 217, 138),
        "artifact_purple": (184, 107, 255),
        "robot": (255, 196, 64),
        "scoring_basket_red": (70, 70, 255),
        "scoring_basket_blue": (255, 120, 70),
    }
    for detection in detections:
        x1, y1, x2, y2 = [int(v) for v in detection["bbox_xyxy"]]
        color = colors.get(detection["class_name"], (255, 255, 255))
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        label = f'{detection["class_name"]} {detection["confidence"]:.2f}'
        cv2.putText(annotated, label, (x1, max(18, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return annotated


def model_manifest(models, model_paths):
    return [
        {"detector_type": detector_type, "path": str(model_paths[detector_type])}
        for detector_type, _model in models
    ]


def predict_image(models, source, out_dir, model_paths, conf, save_annotated):
    image = cv2.imread(str(source))
    if image is None:
        raise SystemExit(f"Could not open image: {source}")
    height, width = image.shape[:2]

    detections, _results = run_models(models, image, conf)

    if save_annotated:
        annotated_dir = out_dir / source.stem / "annotated-images"
        annotated_dir.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(annotated_dir / f"{source.stem}.jpg"), draw_detections(image, detections))

    out_file = out_dir / f"{source.stem}.json"
    out_file.write_text(json.dumps({
        "source": str(source),
        "source_type": "image",
        "models": model_manifest(models, model_paths),
        "width": width,
        "height": height,
        "detections": detections,
    }, indent=2))
    print("Saved predictions to", out_file)


def _transcode_video_for_opencv(source):
    temp_dir = tempfile.TemporaryDirectory(prefix="roboscoutai-video-")
    transcoded = Path(temp_dir.name) / f"{source.stem}.opencv.mp4"
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(source),
        "-map",
        "0:v:0",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        str(transcoded),
    ]
    subprocess.run(cmd, check=True)
    return temp_dir, transcoded


def predict_video(models, source, out_dir, model_paths, conf, stride, save_annotated, save_video, fallback_used=False, display_source=None):
    display_source = display_source or source
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise SystemExit(f"Could not open video: {source}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    frames_dir = out_dir / source.stem / "annotated-frames"
    if save_annotated:
        frames_dir.mkdir(parents=True, exist_ok=True)
    writer = None
    if save_video:
        annotated_video = out_dir / f"{source.stem}_annotated.mp4"
        writer = cv2.VideoWriter(str(annotated_video), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    results = []
    frame_idx = 0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    sampled_total = max(1, (total_frames + max(1, stride) - 1) // max(1, stride))
    sampled_done = 0
    while frame_idx < total_frames or total_frames <= 0:
        if frame_idx % max(1, stride) != 0:
            if not cap.grab():
                break
            frame_idx += 1
            continue
        ret, frame = cap.read()
        if not ret:
            break
        detections, _results = run_models(models, frame, conf)
        results.append({"frame": frame_idx, "timestamp": frame_idx / fps, "width": width, "height": height, "detections": detections})
        sampled_done += 1
        if sampled_done == 1 or sampled_done % 10 == 0 or sampled_done == sampled_total:
            print(f"Processed {sampled_done}/{sampled_total} frames", flush=True)
        if save_annotated or writer is not None:
            annotated = draw_detections(frame, detections)
            if save_annotated:
                cv2.imwrite(str(frames_dir / f"frame_{frame_idx:06d}.jpg"), annotated)
            if writer is not None:
                writer.write(annotated)
        frame_idx += 1

    incomplete = total_frames > 0 and frame_idx < max(0, total_frames - max(2, stride))
    cap.release()
    if writer is not None:
        writer.release()
    if incomplete and not fallback_used:
        print(
            f"OpenCV stopped early at frame {frame_idx}/{total_frames}; "
            "transcoding to H.264 MP4 and retrying so partial predictions are not scored.",
            flush=True,
        )
        temp_dir, transcoded = _transcode_video_for_opencv(display_source)
        try:
            return predict_video(
                models,
                transcoded,
                out_dir,
                model_paths,
                conf,
                stride,
                save_annotated,
                save_video,
                fallback_used=True,
                display_source=display_source,
            )
        finally:
            temp_dir.cleanup()
    if incomplete:
        raise SystemExit(
            f"Video read incomplete after fallback: processed through frame {frame_idx} "
            f"of {total_frames}. Not writing partial predictions."
        )

    out_file = out_dir / f"{display_source.stem}.json"
    out_file.write_text(json.dumps({
        "source": str(display_source),
        "source_type": "video",
        "models": model_manifest(models, model_paths),
        "width": width,
        "height": height,
        "fps": fps,
        "frame_stride": max(1, stride),
        "transcoded_for_opencv": fallback_used,
        "detections": results,
    }, indent=2))
    print("Saved predictions to", out_file)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('source', help='Image or video to run artifact detection on')
    p.add_argument('--model', default='services/video-processing/models/decode/best.pt')
    p.add_argument('--robot-model', default=None, help='Optional robot detector weights to run beside the artifact model')
    p.add_argument('--structure-model', default=None, help='Optional scoring-structure detector weights')
    p.add_argument('--detector-mode', choices=['artifact', 'robot', 'structure', 'both', 'all'], default='both')
    p.add_argument('--out', default='decode-training/predictions')
    p.add_argument('--conf', type=float, default=0.25)
    p.add_argument('--stride', type=int, default=1, help='For videos, run every Nth frame')
    p.add_argument('--save-annotated', action='store_true')
    p.add_argument('--save-video', action='store_true', help='For videos, save an annotated MP4')
    args = p.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        raise SystemExit(f"Missing trained model: {model_path}. Train or copy best.pt first.")
    robot_model_path = Path(args.robot_model) if args.robot_model else None
    if robot_model_path and not robot_model_path.exists():
        raise SystemExit(f"Missing robot model: {robot_model_path}. Train or copy robot weights first.")
    structure_model_path = Path(args.structure_model) if args.structure_model else None
    if structure_model_path and not structure_model_path.exists():
        raise SystemExit(f"Missing scoring-structure model: {structure_model_path}. Train or copy structure weights first.")
    source = Path(args.source)
    if not source.exists():
        raise SystemExit(f"Missing source file: {source}")

    try:
        from ultralytics import YOLO
    except Exception:
        print('Install ultralytics to run prediction locally')
        return

    models = []
    model_paths = {}
    if args.detector_mode in {"artifact", "both", "all"}:
        models.append(("artifact", YOLO(str(model_path))))
        model_paths["artifact"] = model_path
    if args.detector_mode in {"robot", "both", "all"} and robot_model_path:
        models.append(("robot", YOLO(str(robot_model_path))))
        model_paths["robot"] = robot_model_path
    if args.detector_mode in {"structure", "all"} and structure_model_path:
        models.append(("structure", YOLO(str(structure_model_path))))
        model_paths["structure"] = structure_model_path
    if not models:
        raise SystemExit("No models selected for detection.")
    outp = Path(args.out)
    outp.mkdir(parents=True, exist_ok=True)

    suffix = source.suffix.lower()
    if suffix in IMAGE_EXTS:
        predict_image(models, source, outp, model_paths, args.conf, args.save_annotated)
    elif suffix in VIDEO_EXTS:
        predict_video(models, source, outp, model_paths, args.conf, args.stride, args.save_annotated, args.save_video)
    else:
        raise SystemExit(f"Unsupported source type: {source.suffix}")


if __name__ == '__main__':
    main()
