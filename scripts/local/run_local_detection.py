#!/usr/bin/env python3
"""Helper to run autoscore detection locally against a local video file.

Usage:
  python3 scripts/local/run_local_detection.py --video "decode-training/raw-videos/unsorted/BroBots.mp4" \
    --mongo "mongodb://localhost:27017" --db test --worker http://localhost:8001 --port 8080

What it does:
- Serves the directory containing the video on a local HTTP server
- Inserts a job document into MongoDB (collection `autoscorejobs`)
- Calls the worker `/run-artifact-detection` endpoint with the jobId and public video URL
- Polls the job document until `status` becomes `detection_complete` or `failed`
"""
import argparse
import http.server
import os
import socketserver
import threading
import time
import urllib.parse

from datetime import datetime

import json
import subprocess
from pathlib import Path

import requests
from bson import ObjectId
from pymongo import MongoClient


def utcnow_iso():
    return datetime.utcnow().isoformat() + "Z"


def serve_directory(directory: str, port: int):
    os.chdir(directory)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("0.0.0.0", port), handler)

    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--video", required=True, help="Path to local video file")
    p.add_argument("--mongo", default=os.environ.get("DATABASE_URL", "mongodb://localhost:27017"))
    p.add_argument("--db", default=os.environ.get("MONGODB_DB_NAME", "test"))
    p.add_argument("--worker", default=os.environ.get("AUTOSCORE_WORKER_URL", "http://localhost:8001"))
    p.add_argument("--port", type=int, default=8080, help="Local HTTP server port to serve the file")
    p.add_argument("--stride", type=int, default=30)
    p.add_argument("--conf", type=float, default=0.25)
    p.add_argument("--zones", help="Path to JSON file with calibration zones to insert before scoring")
    p.add_argument("--manual-json", help="Path to JSON file containing manualLeave/manualBase/confirmedZones to set on the job")
    p.add_argument("--local-process", action="store_true", help="Run prediction locally and process results into MongoDB")
    args = p.parse_args()

    video_path = os.path.abspath(args.video)
    if not os.path.exists(video_path):
        raise SystemExit(f"Video not found: {video_path}")

    video_dir = os.path.dirname(video_path)
    video_name = os.path.basename(video_path)

    print(f"Serving {video_dir} on port {args.port} (file: {video_name})")
    httpd = serve_directory(video_dir, args.port)

    video_url = f"http://localhost:{args.port}/{urllib.parse.quote(video_name)}"
    print(f"Public video URL: {video_url}")

    print("Connecting to MongoDB...", args.mongo)
    client = MongoClient(args.mongo)
    db = client[args.db]

    job_id = ObjectId()
    now = datetime.utcnow()
    job_doc = {
        "_id": job_id,
        "status": "pending",
        "videoUrl": video_url,
        "createdAt": now,
        "updatedAt": now,
    }
    db.autoscorejobs.insert_one(job_doc)
    print(f"Inserted job {_id_repr(job_id)} into collection autoscorejobs")

    # If zones JSON provided, insert calibration zones for this job
    if args.zones:
        zones_path = os.path.abspath(args.zones)
        if not os.path.exists(zones_path):
            print(f"Zones file not found: {zones_path}")
        else:
            try:
                zones = json.loads(open(zones_path, "r").read())
                for zone in zones:
                    zone_record = {
                        "jobId": job_id,
                        "zoneType": zone.get("zoneType"),
                        "alliance": zone.get("alliance"),
                        "shapeType": zone.get("shapeType", "rectangle"),
                        "coordinates": zone.get("coordinates", []),
                        "frameTimestamp": zone.get("frameTimestamp", 0),
                        "color": zone.get("color"),
                        "index": zone.get("index"),
                        "rampDirection": zone.get("rampDirection"),
                        "createdAt": now,
                        "updatedAt": now,
                    }
                    # Try to upsert by jobId+zoneType+index to avoid duplicates
                    try:
                        db.autoscorecalibrationzones.update_one(
                            {"jobId": job_id, "zoneType": zone_record["zoneType"], "index": zone_record.get("index")},
                            {"$set": zone_record},
                            upsert=True,
                        )
                    except Exception:
                        db.autoscorecalibrationzones.insert_one(zone_record)
                print(f"Inserted/updated {len(zones)} zones into autoscorecalibrationzones")
            except Exception as exc:
                print("Failed to load zones JSON:", exc)

    # If manual JSON provided, update job with manualLeave/manualBase/confirmedZones
    if args.manual_json:
        manual_path = os.path.abspath(args.manual_json)
        if not os.path.exists(manual_path):
            print(f"Manual JSON file not found: {manual_path}")
        else:
            try:
                manual = json.loads(open(manual_path, "r").read())
                update = {}
                if "manualLeave" in manual:
                    update["manualLeave"] = manual["manualLeave"]
                if "manualBase" in manual:
                    update["manualBase"] = manual["manualBase"]
                if "confirmedZones" in manual:
                    update["confirmedZones"] = manual["confirmedZones"]
                if update:
                    db.autoscorejobs.update_one({"_id": job_id}, {"$set": update})
                    print("Updated job with manual scoring settings.")
            except Exception as exc:
                print("Failed to load manual JSON:", exc)

    if args.local_process:
        # Run prediction locally and perform scoring logic into MongoDB
        print("Running local prediction and scoring...")
        root = Path(__file__).resolve().parents[2]
        predict_script = root / "scripts" / "decode" / "predict_video_decode.py"
        model_path = root / "services" / "video-processing" / "models" / "decode" / "best.pt"
        predictions_dir = root / "decode-training" / "predictions"
        predictions_dir.mkdir(parents=True, exist_ok=True)

        if not predict_script.exists():
            httpd.shutdown()
            raise SystemExit(f"Missing predict script: {predict_script}")
        if not model_path.exists():
            print(f"Warning: model not found at {model_path}. Prediction may fail.")

        cmd = [
            "python3",
            str(predict_script),
            str(video_path),
            "--model",
            str(model_path),
            "--detector-mode",
            "artifact",
            "--stride",
            str(args.stride),
            "--conf",
            str(args.conf),
            "--out",
            str(predictions_dir),
        ]
        print("Running:", " ".join(cmd))
        proc = subprocess.Popen(cmd, cwd=str(root), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if proc.stdout:
            for line in proc.stdout:
                print(line.rstrip())
        ret = proc.wait()
        if ret != 0:
            httpd.shutdown()
            raise SystemExit(f"Prediction script exited with code {ret}")

        prediction_json = predictions_dir / f"{Path(video_path).stem}.json"
        if not prediction_json.exists():
            httpd.shutdown()
            raise SystemExit(f"Prediction output missing: {prediction_json}")

        print("Loading predictions from", prediction_json)
        prediction = json.loads(prediction_json.read_text())

        # Flatten detections and insert into MongoDB
        now = datetime.utcnow()
        rows = []
        default_width = float(prediction.get("width", 0) or 0)
        default_height = float(prediction.get("height", 0) or 0)
        for frame in prediction.get("detections", []):
            timestamp = float(frame.get("timestamp", 0))
            frame_width = float(frame.get("width", default_width) or default_width)
            frame_height = float(frame.get("height", default_height) or default_height)
            phase = "AUTO" if timestamp <= 30 else "ENDGAME" if timestamp >= 150 else "TELEOP"
            for detection in frame.get("detections", []):
                x1, y1, x2, y2 = detection.get("bbox_xyxy", [0, 0, 0, 0])
                class_name = detection.get("class_name")
                rows.append(
                    {
                        "jobId": job_id,
                        "frameNumber": int(frame.get("frame", 0)),
                        "timestamp": timestamp,
                        "phase": phase,
                        "className": class_name,
                        "classId": int(detection.get("class_id", 0)),
                        "detectorType": detection.get("detector_type", "robot" if class_name == "robot" else "artifact"),
                        "artifactColor": "green" if class_name == "artifact_green" else "purple" if class_name == "artifact_purple" else None,
                        "confidence": float(detection.get("confidence", 0.0)),
                        "x": float(x1),
                        "y": float(y1),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        "centerX": (float(x1 + x2) / 2 / frame_width) if frame_width else None,
                        "centerY": (float(y1 + y2) / 2 / frame_height) if frame_height else None,
                        "frameWidth": frame_width,
                        "frameHeight": frame_height,
                        "createdAt": now,
                        "updatedAt": now,
                    }
                )

        # Update DB: insert rows
        print(f"Inserting {len(rows)} detection rows into autoscoredetections")
        db.autoscoredetections.delete_many({"jobId": job_id})
        if rows:
            # convert jobId to ObjectId type for storage (already ObjectId)
            db.autoscoredetections.insert_many(rows)

        # Compute summary
        all_rows = list(db.autoscoredetections.find({"jobId": job_id}))
        confidences = [r.get("confidence", 0) for r in all_rows]
        total_detections = len(all_rows)
        artifact_green_count = sum(1 for r in all_rows if r.get("className") == "artifact_green")
        artifact_purple_count = sum(1 for r in all_rows if r.get("className") == "artifact_purple")
        robot_detection_count = sum(1 for r in all_rows if r.get("className") == "robot")
        average_confidence = sum(confidences) / len(confidences) if confidences else 0
        max_confidence = max(confidences) if confidences else 0

        summary = {
            "jobId": job_id,
            "totalDetections": total_detections,
            "artifactGreenCount": artifact_green_count,
            "artifactPurpleCount": artifact_purple_count,
            "robotDetectionCount": robot_detection_count,
            "averageConfidence": average_confidence,
            "maxConfidence": max_confidence,
            "updatedAt": now,
        }
        db.autoscoresummaries.update_one({"jobId": job_id}, {"$set": summary, "$setOnInsert": {"createdAt": now}}, upsert=True)

        # Update job
        prediction_json_path = str(prediction_json)
        annotated_frames_path = str(predictions_dir / Path(video_path).stem / "annotated-frames")
        db.autoscorejobs.update_one({"_id": job_id}, {"$set": {"status": "detection_complete", "errorMessage": None, "predictionJsonPath": prediction_json_path, "annotatedFramesPath": annotated_frames_path, "updatedAt": now, "progress": 100}})

        print("Local scoring complete. Job updated.")
    else:
        payload = {
            "jobId": str(job_id),
            "videoUrl": video_url,
            "stride": args.stride,
            "conf": args.conf,
            "saveAnnotated": False,
            "detectorMode": "artifact",
        }

        print(f"Calling worker {args.worker}/run-artifact-detection")
        try:
            resp = requests.post(f"{args.worker.rstrip('/')}/run-artifact-detection", json=payload, timeout=10)
            try:
                print("Worker response:", resp.status_code, resp.json())
            except Exception:
                print("Worker response status", resp.status_code, resp.text)
            resp.raise_for_status()
        except Exception as exc:
            print("Failed to call worker:", exc)
            httpd.shutdown()
            raise

        print("Worker accepted job, polling job status in MongoDB...")
        end = time.time() + 60 * 60  # 60 minutes max
        while time.time() < end:
            job = db.autoscorejobs.find_one({"_id": job_id})
            status = job.get("status") if job else None
            print(f"{utcnow_iso()} status={status}")
            if status in {"detection_complete", "failed"}:
                print("Final job doc:")
                print(job)
                break
            time.sleep(10)

    print("Stopping local file server")
    httpd.shutdown()


def _id_repr(oid: ObjectId) -> str:
    try:
        return str(oid)
    except Exception:
        return "<invalid-id>"


if __name__ == "__main__":
    main()
