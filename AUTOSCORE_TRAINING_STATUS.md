Autoscore Training Status
=========================

Current status
--------------
- Raw DECODE videos are expected in `decode-training/raw-videos/unsorted/`.
- Extracted frames are stored in `decode-training/extracted-frames/`.
- Labeling samples are stored in `decode-training/sampled-frames/`.
- The labeled dataset scaffold exists at `decode-training/labeled-dataset/`.
- No real trained model should be claimed until `decode-training/trained-models/best.pt` is produced by Ultralytics training.

Labeled data status
-------------------
No YOLO label files were detected at the time this status file was updated.
Supervised training cannot run until sampled frames are labeled and exported in
YOLO format.

What is ready
-------------
- Frame extraction from unsorted videos.
- Even/random/early/middle/late frame sampling.
- Contact-sheet generation.
- YOLO dataset validation.
- Ultralytics YOLO training script.
- Evaluation and video prediction scripts.
- Computer vision service scaffolding for detection, field calibration, tracking,
  event detection, scoring, confidence, and warnings.

Next steps
----------
1. Label frames from `decode-training/sampled-frames/` in Roboflow or CVAT.
2. Export YOLO format with the 12 DECODE classes.
3. Place exported files in `decode-training/labeled-dataset/images/*` and `labels/*`.
4. Run `python scripts/decode/validate_yolo_dataset.py`.
5. Train with `python scripts/decode/train_yolo_decode.py --model yolov8n.pt --epochs 50`.
6. Confirm `decode-training/trained-models/best.pt` exists.
7. Run `scripts/decode/predict_video_decode.py` on a held-out match video.
