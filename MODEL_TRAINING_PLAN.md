Model Training Plan (DECODE)
============================

Objective
---------
Train DECODE-only computer vision detectors for RoboScoutAI autoscore. Video
scoring must use computer vision. OpenRouter can summarize a scoring timeline
later, but it must not be the visual scorer.

Pipeline
--------
```text
video
-> extract frames
-> detect DECODE objects with YOLO
-> estimate field zones automatically
-> track objects over time
-> detect scoring events
-> calculate red and blue score
-> generate timestamped scoring timeline
```

Dataset plan
------------
1. Keep all raw videos in `decode-training/raw-videos/unsorted/`.
2. Extract frames at configurable FPS, default 2 FPS.
3. Sample early, middle, late, evenly spaced, and random frames across every video.
4. Label focused datasets in Roboflow or CVAT. Specialist datasets are allowed:
   artifacts can use `artifact_green` / `artifact_purple`, robots can use `robot`.
5. Export YOLO format and place images/labels into train, val, and test splits.
6. Run `scripts/decode/validate_yolo_dataset.py`.
7. Train with Ultralytics YOLO, defaulting to `yolov8n.pt` for quick iteration.
8. Save deployed weights under `services/video-processing/models/decode/`:
   artifact `best.pt`, robot `robot/best.pt`.

Runtime composition
-------------------
The current production path runs the artifact detector and robot detector
together, then merges detections by `class_name` plus `detector_type`. This keeps
the two labeled datasets useful immediately while preserving a future path to a
larger unified detector if more complete labels become available later.

Augmentation
------------
Training uses angle-flexible augmentation:
- brightness and color jitter
- contrast/value changes
- perspective warp
- crop/translation
- rotation
- scale changes
- mosaic/mixup/copy-paste
- random erasing/compression-like artifacts

Field calibration
-----------------
Do not hardcode scoring zones as fixed pixel positions. The first integration
pass estimates zones from detected objects:
- field boundary
- red and blue goal zones
- red and blue ramp zones
- red and blue base zones
- obelisk when visible

Warnings and confidence should be emitted for:
- field boundary not detected clearly
- goal zone partially blocked or missing
- camera angle reduces confidence
- scoring zones estimated
- object occlusion may affect score

Local vs Colab
--------------
Local training is supported if Ultralytics and GPU/MPS are available. If the
machine has no suitable accelerator, use `notebooks/TRAIN_DECODE_YOLO.md` for
Google Colab GPU training.
