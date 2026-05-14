TRAIN DECODE YOLO (Google Colab)
================================

Use this when local training has no GPU/MPS or is too slow.

1. Start a Colab notebook with GPU runtime.

2. Install dependencies:

```bash
!pip install ultralytics opencv-python-headless pyyaml tqdm pillow
```

3. Upload the repo/dataset or mount Google Drive:

```python
from google.colab import drive
drive.mount('/content/drive')
```

Place the labeled dataset so Colab can see:

```text
/content/RoboScoutAI/decode-training/labeled-dataset/data.yaml
/content/RoboScoutAI/decode-training/labeled-dataset/images/train
/content/RoboScoutAI/decode-training/labeled-dataset/images/val
/content/RoboScoutAI/decode-training/labeled-dataset/images/test
/content/RoboScoutAI/decode-training/labeled-dataset/labels/train
/content/RoboScoutAI/decode-training/labeled-dataset/labels/val
/content/RoboScoutAI/decode-training/labeled-dataset/labels/test
```

4. Validate the dataset:

```bash
%cd /content/RoboScoutAI
!python scripts/decode/validate_yolo_dataset.py
```

5. Train YOLO:

```python
from ultralytics import YOLO

model = YOLO("yolov8n.pt")
results = model.train(
    data="decode-training/labeled-dataset/data.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    device=0,
    project="decode-training/trained-models/runs",
    name="decode-yolo",
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    degrees=8.0,
    translate=0.1,
    scale=0.5,
    shear=2.0,
    perspective=0.0008,
    fliplr=0.5,
    mosaic=1.0,
    mixup=0.05,
    copy_paste=0.05,
    erasing=0.2,
)
```

YOLO11 can also be used later by changing the model name, for example
`YOLO("yolo11n.pt")`, if the installed Ultralytics version supports it.

6. Validate the trained model:

```python
model = YOLO("decode-training/trained-models/runs/decode-yolo/weights/best.pt")
metrics = model.val(data="decode-training/labeled-dataset/data.yaml", imgsz=640)
print(metrics)
```

7. Copy and download `best.pt`:

```bash
!mkdir -p decode-training/trained-models
!cp decode-training/trained-models/runs/decode-yolo/weights/best.pt decode-training/trained-models/best.pt
```

Download `decode-training/trained-models/best.pt` and place it in the same path
inside the RoboScoutAI repo.

8. Test prediction:

```bash
!python scripts/decode/predict_video_decode.py decode-training/raw-videos/unsorted/YOUR_VIDEO.mov --save-video
```
