DECODE Dataset Guide
====================

1. Put all unknown videos into `decode-training/raw-videos/unsorted/`.
2. Generate contact sheets:

   ```bash
   pip install -r requirements-decode.txt
   python scripts/decode/create_video_contact_sheets.py
   ```

3. Extract frames (default 2 FPS):

   ```bash
   python scripts/decode/extract_frames.py --fps 2
   ```

4. Sample frames for labeling:

   ```bash
   python scripts/decode/sample_frames.py --per-video 20
   ```

5. Label sampled frames using CVAT or Roboflow. Export in YOLO format.

6. Place exported images into `decode-training/labeled-dataset/images/train|val|test`
   and labels into `decode-training/labeled-dataset/labels/train|val|test`.

7. Validate dataset:

   ```bash
   python scripts/decode/validate_yolo_dataset.py --data decode-training/labeled-dataset/data.yaml
   ```

8. Train locally with GPU and `ultralytics`, or use the provided Colab instructions in `notebooks/TRAIN_DECODE_YOLO.md`.

Notes
-----
- You do not need to sort by camera angle. Unsorted videos are fine.
- It's OK to train from unsorted videos as long as labeled frames include multiple camera angles and variations.
- See `scripts/decode/sort_videos_by_angle.py` for an optional manual sorter GUI/workflow.
