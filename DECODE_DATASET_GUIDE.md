DECODE Dataset Guide
====================

Raw videos
----------
Put every DECODE match video in:

```bash
decode-training/raw-videos/unsorted/
```

Do not sort by camera angle. The DECODE detector should learn from diverse
angles through labeled examples and augmentation.

Prepare frames
--------------
Install dependencies, extract frames at 2 FPS, sample frames for labeling, and
optionally create contact sheets:

```bash
pip install -r requirements-decode.txt
python scripts/decode/extract_frames.py --fps 2
python scripts/decode/sample_frames.py --per-video 20
python scripts/decode/create_contact_sheets.py
```

Outputs:
- Extracted frames: `decode-training/extracted-frames/`
- Labeling subset: `decode-training/sampled-frames/`
- Contact sheets: `decode-training/reports/contact-sheets/`

Labeling classes
----------------
Use exactly these YOLO class IDs:

```text
0 robot_red
1 robot_blue
2 artifact_purple
3 artifact_green
4 goal_red
5 goal_blue
6 ramp_red
7 ramp_blue
8 base_red
9 base_blue
10 obelisk
11 field_boundary
```

Roboflow workflow
-----------------
1. Create an object detection project.
2. Upload images from `decode-training/sampled-frames/`.
3. Add the 12 classes above in the same order.
4. Draw bounding boxes for visible robots, artifacts, field elements, and field boundary.
5. Export in YOLOv8/YOLO11 format.
6. Copy exported files into:

```text
decode-training/labeled-dataset/images/train/
decode-training/labeled-dataset/images/val/
decode-training/labeled-dataset/images/test/
decode-training/labeled-dataset/labels/train/
decode-training/labeled-dataset/labels/val/
decode-training/labeled-dataset/labels/test/
```

CVAT workflow
-------------
1. Create a detection task with images from `decode-training/sampled-frames/`.
2. Add the 12 labels above.
3. Annotate bounding boxes.
4. Export as YOLO 1.1 / Ultralytics YOLO.
5. Place images and `.txt` labels into the split folders listed above.

Validate and train
------------------
Validate the dataset:

```bash
python scripts/decode/validate_yolo_dataset.py
```

Train after validation passes:

```bash
python scripts/decode/train_yolo_decode.py --model yolov8n.pt --epochs 50
```

The trained detector should be saved at:

```text
decode-training/trained-models/best.pt
```

Test prediction
---------------
After `best.pt` exists:

```bash
python scripts/decode/predict_video_decode.py decode-training/raw-videos/unsorted/VIDEO_NAME.mov --save-video
```

Predictions are written to `decode-training/predictions/`.
