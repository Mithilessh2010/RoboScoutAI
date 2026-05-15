Autoscore Training Status
=========================

Current status
--------------
- Raw DECODE videos live in `decode-training/raw-videos/unsorted/`.
- Phase 1 artifact data is in `decode-training/labeled-dataset/`.
- Phase 2 robot data can be prepared in `decode-training/labeled-dataset-robot/`.
- The deployed artifact detector is `services/video-processing/models/decode/best.pt`.
- The robot detector is trained separately and stored at
  `services/video-processing/models/decode/robot/best.pt`.

Why two models
--------------
Artifact and robot datasets currently have different class sets and were labeled
separately. The runtime combines both specialist detectors into one JSON stream,
which lets the app use artifact detections for scoring and robot detections for
gate, launch-line, and base review without retraining the artifact model.

What is ready
-------------
- Frame extraction and sampling from unsorted match videos.
- Artifact YOLO validation, training, evaluation, and prediction.
- Robot-only YOLO validation and training support.
- Combined artifact + robot video prediction.
- Autoscore cockpit overlays for artifacts and robots.
- Robot-assisted gate-release, estimated LEAVE, and estimated BASE hooks.

Training commands
-----------------
Artifact model:

```bash
python3 scripts/decode/train_yolo_decode.py \
  --data decode-training/labeled-dataset/data.yaml \
  --expected phase1-artifacts \
  --best-dest services/video-processing/models/decode/best.pt
```

Robot model:

```bash
python3 scripts/decode/train_yolo_decode.py \
  --data decode-training/labeled-dataset-robot/data.yaml \
  --expected phase2-robot \
  --best-dest services/video-processing/models/decode/robot/best.pt
```

Combined prediction
-------------------

```bash
python3 scripts/decode/predict_video_decode.py path/to/video.mov \
  --model services/video-processing/models/decode/best.pt \
  --robot-model services/video-processing/models/decode/robot/best.pt \
  --stride 90 --conf 0.25 --save-annotated
```
