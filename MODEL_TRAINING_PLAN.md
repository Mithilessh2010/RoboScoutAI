Model Training Plan (DECODE)
===========================

1. Data collection: place all raw videos in `decode-training/raw-videos/unsorted/`.
2. Frame extraction & sampling: run the extraction and sampling scripts to create a labeling set.
3. Labeling: use CVAT/Roboflow to annotate objects with the 12 DECODE classes.
4. Validation: run `validate_yolo_dataset.py` to check correctness.
5. Training: use `scripts/decode/train_yolo_decode.py` with `ultralytics` (GPU recommended) or follow the Colab notebook.
6. Evaluation: run `scripts/decode/evaluate_yolo_decode.py` (TODO implement) or use Ultralytics val command.
7. Integration: place `best.pt` in `decode-training/trained-models/best.pt` and use `services/video-processing/object_detector.py` to load and run inference for scoring.

Notes on augmentation and angle flexibility
-----------------------------------------
- Use brightness/contrast, blur, perspective warp, rotation, scale, crops and JPEG compression during training.
- Do not require camera-angle labels; diversify the labeled frames across angles.
