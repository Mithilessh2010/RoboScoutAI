import json
import os
import re
import shutil
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bson import ObjectId
from fastapi import BackgroundTasks, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from gridfs import GridFSBucket
from pydantic import BaseModel
from pymongo import MongoClient


ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "services/video-processing/models/decode/best.pt"
ROBOT_MODEL_PATH = ROOT / "services/video-processing/models/decode/robot/best.pt"
PREDICT_SCRIPT = ROOT / "scripts/decode/predict_video_decode.py"
PREDICTIONS_DIR = Path(os.environ.get("AUTOSCORE_PREDICTIONS_DIR", "/tmp/decode-autoscore/predictions"))
VIDEO_DIR = Path(os.environ.get("AUTOSCORE_VIDEO_DIR", "/tmp/decode-autoscore/videos"))
UPLOAD_DIR = Path(os.environ.get("AUTOSCORE_UPLOAD_DIR", "/tmp/decode-autoscore/uploads"))
DEFAULT_STRIDE = int(os.environ.get("AUTOSCORE_FRAME_STRIDE", "90"))
DEFAULT_CONF = float(os.environ.get("AUTOSCORE_CONF", "0.25"))
AUTO_SECONDS = 30
MATCH_SECONDS = 150
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "https://roboscoutai-autoscore-worker.fly.dev").rstrip("/")

app = FastAPI(title="RoboScoutAI DECODE Autoscore Worker")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://roboscoutai-web.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


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
    db_name = os.environ.get("MONGODB_DB_NAME", "test")
    return MongoClient(database_url)[db_name]


def video_bucket():
    return GridFSBucket(database(), bucket_name="autoscorevideos")


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
        return f"https://drive.usercontent.google.com/download?id={match.group(1)}&export=download&confirm=t"
    return video_url


def filename_suffix_from_headers(headers: requests.structures.CaseInsensitiveDict[str]) -> str | None:
    content_disposition = headers.get("content-disposition", "")
    match = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)', content_disposition)
    if not match:
        return None
    suffix = Path(match.group(1)).suffix
    return suffix or None


def download_video(video_url: str, job_id: str) -> Path:
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    normalized_url = normalize_video_url(video_url)
    suffix = Path(normalized_url.split("?", 1)[0]).suffix or ".mp4"

    with requests.get(normalized_url, stream=True, timeout=(30, 600)) as response:
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if "text/html" in content_type:
            raise RuntimeError(
                "The video URL returned an HTML page instead of a video. Use a direct video URL or upload the file."
            )
        suffix = filename_suffix_from_headers(response.headers) or suffix
        target = VIDEO_DIR / f"{job_id}{suffix}"
        with target.open("wb") as file:
            shutil.copyfileobj(response.raw, file)

    return target


def transcode_video(source_path: Path, target_path: Path) -> None:
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(source_path),
        "-vf",
        "scale=-2:720",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-movflags",
        "+faststart",
        "-an",
        str(target_path),
    ]
    subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def iter_gridfs_file(stream, chunk_size: int = 1024 * 1024):
    while True:
        chunk = stream.read(chunk_size)
        if not chunk:
            break
        yield chunk


def flatten_detections(job_object_id: ObjectId, prediction: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    now = utcnow()
    default_width = float(prediction.get("width", 0))
    default_height = float(prediction.get("height", 0))
    for frame in prediction.get("detections", []):
        timestamp = float(frame.get("timestamp", 0))
        frame_width = float(frame.get("width", default_width))
        frame_height = float(frame.get("height", default_height))
        phase = "AUTO" if timestamp <= AUTO_SECONDS else "ENDGAME" if timestamp >= MATCH_SECONDS else "TELEOP"
        for detection in frame.get("detections", []):
            x1, y1, x2, y2 = detection["bbox_xyxy"]
            class_name = detection["class_name"]
            rows.append(
                {
                    "jobId": job_object_id,
                    "frameNumber": int(frame.get("frame", 0)),
                    "timestamp": timestamp,
                    "phase": phase,
                    "className": class_name,
                    "classId": int(detection["class_id"]),
                    "detectorType": detection.get("detector_type", "robot" if class_name == "robot" else "artifact"),
                    "artifactColor": "green" if class_name == "artifact_green" else "purple" if class_name == "artifact_purple" else None,
                    "confidence": float(detection["confidence"]),
                    "x": float(x1),
                    "y": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1),
                    "centerX": float((x1 + x2) / 2),
                    "centerY": float((y1 + y2) / 2),
                    "frameWidth": frame_width,
                    "frameHeight": frame_height,
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
                "status": "detecting",
                "phase": "artifact_detection",
                "errorMessage": None,
                "updatedAt": now,
                "progress": 0,
            }
        },
    )

    def log(message: str, level: str = "info"):
        try:
            entry = {"jobId": job_object_id, "level": level, "message": message, "createdAt": utcnow()}
            db.autoscorelogs.insert_one(entry)
            db.autoscorejobs.update_one({"_id": job_object_id}, {"$set": {"lastLog": entry, "updatedAt": utcnow()}})
        except Exception:
            pass

    def set_progress(pct: int):
        try:
            pct = max(0, min(100, int(pct)))
            db.autoscorejobs.update_one({"_id": job_object_id}, {"$set": {"progress": pct, "updatedAt": utcnow()}})
        except Exception:
            pass

    try:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Missing model file: {MODEL_PATH}")
        if not PREDICT_SCRIPT.exists():
            raise RuntimeError(f"Missing prediction script: {PREDICT_SCRIPT}")

        PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)
        log("Starting video download", "info")
        set_progress(5)
        source_path = download_video(video_url, request.jobId)
        log(f"Downloaded video to {source_path}", "info")
        set_progress(15)

        command = [
            "python3",
            str(PREDICT_SCRIPT),
            str(source_path),
            "--model",
            str(MODEL_PATH),
            *(
                ["--robot-model", str(ROBOT_MODEL_PATH)]
                if ROBOT_MODEL_PATH.exists()
                else []
            ),
            "--stride",
            str(max(1, request.stride)),
            "--conf",
            str(request.conf),
            "--out",
            str(PREDICTIONS_DIR),
        ]
        if request.saveAnnotated:
            command.append("--save-annotated")

        log(f"Running prediction: {' '.join(command)}", "info")

        # Run the prediction subprocess and stream logs to MongoDB so progress can be observed
        process = subprocess.Popen(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        last_progress_update = 15
        if process.stdout:
            for line in process.stdout:
                line = line.rstrip("\n")
                log(line, "stdout")
                # try to parse progress indicators from the predict script's output
                # e.g., lines like "Processed 123/1000 frames" or "Progress: 12%"
                m = re.search(r"(\d+)/(\d+) frames", line)
                if m:
                    try:
                        processed = int(m.group(1))
                        total = int(m.group(2))
                        pct = 20 + int((processed / max(1, total)) * 70)
                        if pct - last_progress_update >= 3:
                            set_progress(pct)
                            last_progress_update = pct
                    except Exception:
                        pass
                m2 = re.search(r"Progress[: ]+(\d+)%", line)
                if m2:
                    try:
                        pct = 20 + int(int(m2.group(1)) * 0.7)
                        if pct - last_progress_update >= 3:
                            set_progress(pct)
                            last_progress_update = pct
                    except Exception:
                        pass

        ret = process.wait(timeout=60 * 45)
        if ret != 0:
            raise RuntimeError(f"Predict script exited with code {ret}")

        set_progress(80)

        prediction_json_path = PREDICTIONS_DIR / f"{source_path.stem}.json"
        prediction_data = json.loads(prediction_json_path.read_text())
        rows = flatten_detections(job_object_id, prediction_data)
        confidences = [row["confidence"] for row in rows]
        total_detections = len(rows)
        artifact_green_count = sum(1 for row in rows if row["className"] == "artifact_green")
        artifact_purple_count = sum(1 for row in rows if row["className"] == "artifact_purple")
        robot_detection_count = sum(1 for row in rows if row["className"] == "robot")
        average_confidence = sum(confidences) / len(confidences) if confidences else 0
        max_confidence = max(confidences) if confidences else 0

        db.autoscoredetections.delete_many({"jobId": job_object_id})
        if rows:
            db.autoscoredetections.insert_many(rows)

        set_progress(90)

        summary = {
            "jobId": job_object_id,
            "totalDetections": total_detections,
            "artifactGreenCount": artifact_green_count,
            "artifactPurpleCount": artifact_purple_count,
            "robotDetectionCount": robot_detection_count,
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
                    "status": "detection_complete",
                    "errorMessage": None,
                    "predictionJsonPath": str(prediction_json_path),
                    "annotatedFramesPath": str(annotated_frames_path),
                    "updatedAt": utcnow(),
                    "progress": 100,
                }
            },
        )
    except Exception as exc:
        log(f"Job failed: {exc}", "error")
        db.autoscorejobs.update_one(
            {"_id": job_object_id},
            {"$set": {"status": "failed", "errorMessage": str(exc), "updatedAt": utcnow(), "progress": 0}},
        )
    finally:
        shutil.rmtree(VIDEO_DIR, ignore_errors=True)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "modelExists": MODEL_PATH.exists(),
        "robotModelExists": ROBOT_MODEL_PATH.exists(),
        "predictScriptExists": PREDICT_SCRIPT.exists(),
    }


def process_uploaded_video(upload_object_id: ObjectId, raw_path: Path, original_name: str | None) -> None:
    db = database()
    mp4_path = raw_path.with_suffix(".transcoded.mp4")
    try:
        if raw_path.suffix.lower() == ".mp4" and raw_path.stat().st_size <= 50 * 1024 * 1024:
            media_path = raw_path
        else:
            transcode_video(raw_path, mp4_path)
            media_path = mp4_path
        bucket = video_bucket()
        with media_path.open("rb") as source:
            video_id = bucket.upload_from_stream(
                f"{raw_path.stem}.mp4",
                source,
                metadata={
                    "originalName": original_name,
                    "contentType": "video/mp4",
                    "createdAt": utcnow(),
                },
            )
        db.autoscorevideouploads.update_one(
            {"_id": upload_object_id},
            {
                "$set": {
                    "status": "ready",
                    "videoId": video_id,
                    "videoUrl": f"{PUBLIC_BASE_URL}/videos/{video_id}",
                    "contentType": "video/mp4",
                    "sizeBytes": media_path.stat().st_size,
                    "updatedAt": utcnow(),
                }
            },
        )
    except Exception as exc:
        db.autoscorevideouploads.update_one(
            {"_id": upload_object_id},
            {"$set": {"status": "failed", "errorMessage": str(exc), "updatedAt": utcnow()}},
        )
    finally:
        raw_path.unlink(missing_ok=True)
        mp4_path.unlink(missing_ok=True)


@app.post("/upload-video")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> dict[str, Any]:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "video.mov").suffix or ".mov"
    upload_id = uuid.uuid4().hex
    raw_path = UPLOAD_DIR / f"{upload_id}{suffix}"

    try:
        with raw_path.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                output.write(chunk)
        now = utcnow()
        insert_result = database().autoscorevideouploads.insert_one(
            {
                "status": "processing",
                "originalName": file.filename,
                "createdAt": now,
                "updatedAt": now,
            }
        )
        background_tasks.add_task(process_uploaded_video, insert_result.inserted_id, raw_path, file.filename)
        return {
            "uploadId": str(insert_result.inserted_id),
            "status": "processing",
        }
    except Exception:
        raw_path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()


@app.get("/uploads/{upload_id}")
def get_upload(upload_id: str) -> dict[str, Any]:
    upload = database().autoscorevideouploads.find_one({"_id": ObjectId(upload_id)})
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")
    return {
        "uploadId": str(upload["_id"]),
        "status": upload["status"],
        "videoId": str(upload["videoId"]) if upload.get("videoId") else None,
        "videoUrl": upload.get("videoUrl"),
        "videoName": upload.get("originalName"),
        "contentType": upload.get("contentType"),
        "sizeBytes": upload.get("sizeBytes"),
        "errorMessage": upload.get("errorMessage"),
    }


@app.get("/videos/{video_id}")
def get_video(video_id: str):
    try:
        bucket = video_bucket()
        stream = bucket.open_download_stream(ObjectId(video_id))
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Video not found.") from exc

    return StreamingResponse(
        iter_gridfs_file(stream),
        media_type="video/mp4",
        headers={
            "Content-Length": str(stream.length),
            "Accept-Ranges": "none",
            "Cache-Control": "public, max-age=3600",
        },
    )


@app.post("/run-artifact-detection")
def run_artifact_detection(
    request: RunRequest,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    check_secret(authorization)
    background_tasks.add_task(run_job, request)
    return {"started": True, "jobId": request.jobId}
