import json
import os
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bson import ObjectId
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient


ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "services/video-processing/models/decode/best.pt"
PREDICT_SCRIPT = ROOT / "scripts/decode/predict_video_decode.py"
PREDICTIONS_DIR = Path(os.environ.get("AUTOSCORE_PREDICTIONS_DIR", "/tmp/decode-autoscore/predictions"))
VIDEO_DIR = Path(os.environ.get("AUTOSCORE_VIDEO_DIR", "/tmp/decode-autoscore/videos"))
DEFAULT_STRIDE = int(os.environ.get("AUTOSCORE_FRAME_STRIDE", "90"))
DEFAULT_CONF = float(os.environ.get("AUTOSCORE_CONF", "0.25"))

app = FastAPI(title="RoboScoutAI DECODE Autoscore Worker")


class RunRequest(BaseModel):
    jobId: str
    videoUrl: str | None = None
    stride: int = DEFAULT_STRIDE
    conf: float = DEFAULT_CONF
    saveAnnotated: bool = True


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def database():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set.")
    return MongoClient(database_url).get_default_database()


def check_secret(authorization: str | None) -> None:
    secret = os.environ.get("AUTOSCORE_WORKER_SECRET")
    if not secret:
        return
    expected = f"Bearer {secret}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid autoscore worker secret.")


def normalize_video_url(video_url: str) -> str:
    match = re.search(r"drive\.google\.com/file/d/([^/]+)", video_url)
    if match:
        return f"https://drive.google.com/uc?export=download&id={match.group(1)}"
    return video_url


def download_video(video_url: str, job_id: str) -> Path:
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    normalized_url = normalize_video_url(video_url)
    suffix = Path(normalized_url.split("?", 1)[0]).suffix or ".mp4"
    target = VIDEO_DIR / f"{job_id}{suffix}"

    with requests.get(normalized_url, stream=True, timeout=120) as response:
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if "text/html" in content_type:
            raise RuntimeError(
                "The video URL returned an HTML page instead of a video. Use a direct video URL or upload the file."
            )
        with target.open("wb") as file:
            shutil.copyfileobj(response.raw, file)

    return target


def flatten_detections(job_object_id: ObjectId, prediction: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    now = utcnow()
    for frame in prediction.get("detections", []):
        for detection in frame.get("detections", []):
            x1, y1, x2, y2 = detection["bbox_xyxy"]
            rows.append(
                {
                    "jobId": job_object_id,
                    "frameNumber": int(frame.get("frame", 0)),
                    "timestamp": float(frame.get("timestamp", 0)),
                    "className": detection["class_name"],
                    "classId": int(detection["class_id"]),
                    "confidence": float(detection["confidence"]),
                    "x": float(x1),
                    "y": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1),
                    "createdAt": now,
                    "updatedAt": now,
                }
            )
    return rows


def run_job(request: RunRequest) -> None:
    db = database()
    job_object_id = ObjectId(request.jobId)
    job = db.autoscorejobs.find_one({"_id": job_object_id})
    if not job:
        raise RuntimeError("Autoscore job not found.")

    video_url = request.videoUrl or job.get("videoUrl")
    if not video_url:
        raise RuntimeError("Autoscore worker requires a videoUrl.")

    now = utcnow()
    db.autoscorejobs.update_one(
        {"_id": job_object_id},
        {
            "$set": {
                "status": "running",
                "phase": "artifact_detection",
                "errorMessage": None,
                "updatedAt": now,
            }
        },
    )

    try:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Missing model file: {MODEL_PATH}")
        if not PREDICT_SCRIPT.exists():
            raise RuntimeError(f"Missing prediction script: {PREDICT_SCRIPT}")

        PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
        source_path = download_video(video_url, request.jobId)
        command = [
            "python3",
            str(PREDICT_SCRIPT),
            str(source_path),
            "--model",
            str(MODEL_PATH),
            "--stride",
            str(max(1, request.stride)),
            "--conf",
            str(request.conf),
            "--out",
            str(PREDICTIONS_DIR),
        ]
        if request.saveAnnotated:
            command.append("--save-annotated")

        subprocess.run(command, cwd=ROOT, check=True, timeout=60 * 45)

        prediction_json_path = PREDICTIONS_DIR / f"{source_path.stem}.json"
        prediction_data = json.loads(prediction_json_path.read_text())
        rows = flatten_detections(job_object_id, prediction_data)
        confidences = [row["confidence"] for row in rows]
        total_detections = len(rows)
        artifact_green_count = sum(1 for row in rows if row["className"] == "artifact_green")
        artifact_purple_count = sum(1 for row in rows if row["className"] == "artifact_purple")
        average_confidence = sum(confidences) / len(confidences) if confidences else 0
        max_confidence = max(confidences) if confidences else 0

        db.autoscoredetections.delete_many({"jobId": job_object_id})
        if rows:
            db.autoscoredetections.insert_many(rows)

        summary = {
            "jobId": job_object_id,
            "totalDetections": total_detections,
            "artifactGreenCount": artifact_green_count,
            "artifactPurpleCount": artifact_purple_count,
            "averageConfidence": average_confidence,
            "maxConfidence": max_confidence,
            "updatedAt": utcnow(),
        }
        db.autoscoresummaries.update_one(
            {"jobId": job_object_id},
            {"$set": summary, "$setOnInsert": {"createdAt": utcnow()}},
            upsert=True,
        )

        annotated_frames_path = PREDICTIONS_DIR / source_path.stem / "annotated-frames"
        db.autoscorejobs.update_one(
            {"_id": job_object_id},
            {
                "$set": {
                    "status": "complete",
                    "errorMessage": None,
                    "predictionJsonPath": str(prediction_json_path),
                    "annotatedFramesPath": str(annotated_frames_path),
                    "updatedAt": utcnow(),
                }
            },
        )
    except Exception as exc:
        db.autoscorejobs.update_one(
            {"_id": job_object_id},
            {"$set": {"status": "failed", "errorMessage": str(exc), "updatedAt": utcnow()}},
        )
        raise
    finally:
        shutil.rmtree(VIDEO_DIR, ignore_errors=True)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "modelExists": MODEL_PATH.exists(),
        "predictScriptExists": PREDICT_SCRIPT.exists(),
    }


@app.post("/run-artifact-detection")
def run_artifact_detection(
    request: RunRequest,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    check_secret(authorization)
    background_tasks.add_task(run_job, request)
    return {"started": True, "jobId": request.jobId}
