#!/usr/bin/env python3
"""Camera-motion compensation for local autoscore detections.

The user draws scoring zones on one calibration frame. Phone videos can shake or
drift, so fixed zones stop lining up with later frames. This module estimates a
global affine transform from each video frame back to the calibration frame and
rewrites detection centers into that stabilized coordinate space before scoring.

It does not write files or persist benchmark data.
"""
from __future__ import annotations

from collections import defaultdict
from statistics import median
from pathlib import Path
from typing import Dict, Iterable, List, Tuple
import os

import cv2
import numpy as np


def _calibration_timestamp(zones: List[Dict]) -> float:
    timestamps = [
        float(zone.get("frameTimestamp", 0.0) or 0.0)
        for zone in zones
        if zone.get("frameTimestamp") is not None
    ]
    if not timestamps:
        return 0.0
    return float(median(timestamps))


def _video_fps(video_path: Path) -> float:
    cap = cv2.VideoCapture(str(video_path))
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
    cap.release()
    return fps if fps > 0 else 30.0


def _read_frame(cap: cv2.VideoCapture, frame_number: int):
    cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, int(frame_number)))
    ok, frame = cap.read()
    return frame if ok else None


def _resize_gray(frame, max_width: int = 960):
    height, width = frame.shape[:2]
    scale = min(1.0, max_width / max(1, width))
    if scale < 1.0:
        frame = cv2.resize(frame, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    return gray, scale


def _field_mask(shape: Tuple[int, int], zones: List[Dict], scale: float):
    height, width = shape
    mask = np.zeros((height, width), dtype=np.uint8)
    field_zones = [zone for zone in zones if zone.get("zoneType") == "field_boundary"]
    if field_zones:
        for zone in field_zones:
            coords = zone.get("coordinates") or []
            if len(coords) < 2:
                continue
            points = np.array(
                [
                    [
                        int(float(point.get("x", 0.0)) * width),
                        int(float(point.get("y", 0.0)) * height),
                    ]
                    for point in coords
                ],
                dtype=np.int32,
            )
            if len(points) == 2:
                x1, y1 = points[0]
                x2, y2 = points[1]
                cv2.rectangle(mask, (min(x1, x2), min(y1, y2)), (max(x1, x2), max(y1, y2)), 255, -1)
            elif len(points) >= 3:
                cv2.fillPoly(mask, [points], 255)
    else:
        # Avoid broadcast lower-thirds/scoreboard graphics when no field zone exists.
        mask[: int(height * 0.86), :] = 255

    # Leave a small border out; edge letters/black bars tend to produce unstable features.
    border = max(4, int(min(width, height) * 0.015))
    mask[:border, :] = 0
    mask[-border:, :] = 0
    mask[:, :border] = 0
    mask[:, -border:] = 0
    return mask


def _target_frames(rows: List[Dict]) -> List[int]:
    return sorted({
        int(row.get("frameNumber", 0) or 0)
        for row in rows
        if row.get("frameNumber") is not None
    })


def _estimate_frame_transforms(video_path: Path, rows: List[Dict], zones: List[Dict]) -> Tuple[Dict[int, np.ndarray], Dict]:
    has_field_boundary = any(zone.get("zoneType") == "field_boundary" for zone in zones)
    if not has_field_boundary and os.environ.get("ROBOSCOUTAI_FORCE_STABILIZE") != "1":
        return {}, {
            "enabled": False,
            "reason": "field_boundary zone required for safe stabilization",
        }

    fps = _video_fps(video_path)
    calibration_frame = int(round(_calibration_timestamp(zones) * fps))
    frames = _target_frames(rows)
    if not frames:
        return {}, {"enabled": False, "reason": "no frames"}

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return {}, {"enabled": False, "reason": f"could not open {video_path}"}

    reference = _read_frame(cap, calibration_frame)
    if reference is None:
        cap.release()
        return {}, {"enabled": False, "reason": f"could not read calibration frame {calibration_frame}"}

    ref_gray, scale = _resize_gray(reference)
    mask = _field_mask(ref_gray.shape, zones, scale)
    ref_points = cv2.goodFeaturesToTrack(
        ref_gray,
        maxCorners=900,
        qualityLevel=0.01,
        minDistance=9,
        blockSize=7,
        mask=mask,
    )
    if ref_points is None or len(ref_points) < 24:
        cap.release()
        return {
            frame: np.array([[1, 0, 0], [0, 1, 0]], dtype=np.float32)
            for frame in frames
        }, {"enabled": False, "reason": "not enough stable reference features"}

    transforms: Dict[int, np.ndarray] = {}
    accepted = 0
    rejected = 0
    inlier_counts: List[int] = []
    translation_pixels: List[float] = []
    identity = np.array([[1, 0, 0], [0, 1, 0]], dtype=np.float32)

    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    target_set = set(frames)
    max_frame = max(frames)
    frame_number = 0
    while frame_number <= max_frame:
        ok, frame = cap.read()
        if not ok:
            break
        if frame_number not in target_set:
            frame_number += 1
            continue

        if abs(frame_number - calibration_frame) <= 1:
            transforms[frame_number] = identity.copy()
            accepted += 1
            frame_number += 1
            continue

        gray, _current_scale = _resize_gray(frame)
        current_points, status, _err = cv2.calcOpticalFlowPyrLK(
            ref_gray,
            gray,
            ref_points,
            None,
            winSize=(25, 25),
            maxLevel=3,
            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01),
        )
        if current_points is None or status is None:
            transforms[frame_number] = identity.copy()
            rejected += 1
            frame_number += 1
            continue

        good_ref = ref_points[status.ravel() == 1].reshape(-1, 2)
        good_current = current_points[status.ravel() == 1].reshape(-1, 2)
        if len(good_ref) < 18:
            transforms[frame_number] = identity.copy()
            rejected += 1
            frame_number += 1
            continue

        matrix, inliers = cv2.estimateAffinePartial2D(
            good_current,
            good_ref,
            method=cv2.RANSAC,
            ransacReprojThreshold=3.0,
            maxIters=1500,
            confidence=0.98,
        )
        if matrix is None or inliers is None:
            transforms[frame_number] = identity.copy()
            rejected += 1
            frame_number += 1
            continue

        inlier_count = int(inliers.sum())
        sx = float(np.hypot(matrix[0, 0], matrix[1, 0]))
        sy = float(np.hypot(matrix[0, 1], matrix[1, 1]))
        translation = float(np.hypot(matrix[0, 2], matrix[1, 2]))
        # This is meant to absorb shake/drift, not wildly remap a changed camera.
        if inlier_count < 14 or not (0.92 <= sx <= 1.08 and 0.92 <= sy <= 1.08) or translation > ref_gray.shape[1] * 0.28:
            transforms[frame_number] = identity.copy()
            rejected += 1
        else:
            transforms[frame_number] = matrix.astype(np.float32)
            accepted += 1
            inlier_counts.append(inlier_count)
            translation_pixels.append(translation / max(scale, 1e-6))
        frame_number += 1

    cap.release()
    for frame in frames:
        transforms.setdefault(frame, identity.copy())

    return transforms, {
        "enabled": True,
        "calibrationFrame": calibration_frame,
        "frames": len(frames),
        "acceptedTransforms": accepted,
        "rejectedTransforms": rejected,
        "medianInliers": int(median(inlier_counts)) if inlier_counts else 0,
        "medianTranslationPixels": round(float(median(translation_pixels)), 2) if translation_pixels else 0.0,
    }


def stabilize_detection_rows(video_path: str | Path, rows: List[Dict], zones: List[Dict]) -> Tuple[List[Dict], Dict]:
    """Return copied rows with detection centers mapped to the calibration frame."""
    video_path = Path(video_path)
    transforms, debug = _estimate_frame_transforms(video_path, rows, zones)
    if not transforms or not debug.get("enabled"):
        return [dict(row) for row in rows], debug

    stabilized = []
    changed = 0
    for row in rows:
        copied = dict(row)
        center_x = copied.get("centerX")
        center_y = copied.get("centerY")
        width = float(copied.get("frameWidth") or 0.0)
        height = float(copied.get("frameHeight") or 0.0)
        if center_x is not None and center_y is not None and width > 0 and height > 0:
            matrix = transforms.get(int(copied.get("frameNumber", 0) or 0))
            if matrix is not None:
                scale = min(1.0, 960 / max(1.0, width))
                point = np.array([[[float(center_x) * width * scale, float(center_y) * height * scale]]], dtype=np.float32)
                mapped = cv2.transform(point, matrix)[0, 0]
                copied["rawCenterX"] = center_x
                copied["rawCenterY"] = center_y
                copied["centerX"] = max(0.0, min(1.0, float(mapped[0]) / (width * scale)))
                copied["centerY"] = max(0.0, min(1.0, float(mapped[1]) / (height * scale)))
                changed += 1
        stabilized.append(copied)

    debug = dict(debug)
    debug["stabilizedDetections"] = changed
    return stabilized, debug
