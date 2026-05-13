TRAIN DECODE YOLO (Colab)
=========================

1. Install dependencies:

```bash
pip install -r /content/RoboScoutAI/requirements-decode.txt
pip install ultralytics
```

2. Upload or mount your dataset into `/content/RoboScoutAI/decode-training/`.

3. Ensure `decode-training/labeled-dataset/data.yaml` is correct.

4. Run training (example):

```python
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
model.train(data='decode-training/labeled-dataset/data.yaml', epochs=50, imgsz=640)
```

5. Download `runs/train/exp*/best.pt` to `decode-training/trained-models/best.pt`.

6. Use `scripts/decode/predict_video_decode.py` to run inference locally.
