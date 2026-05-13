"""Placeholder object detector service.
Provides a minimal interface for loading a YOLO model and running inference.
"""
from pathlib import Path
from typing import Any, List, Dict


class ObjectDetector:
    def __init__(self, model_path: Path):
        self.model_path = model_path
        self.model = None

    def load(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(str(self.model_path))
        except Exception:
            raise RuntimeError('Install ultralytics to use ObjectDetector')

    def predict(self, image) -> List[Dict[str, Any]]:
        if self.model is None:
            raise RuntimeError('Model not loaded')
        res = self.model.predict(image, verbose=False)
        out = []
        r = res[0]
        for box in getattr(r, 'boxes').data.tolist():
            out.append({'bbox': box[:4], 'score': float(box[4]), 'class': int(box[5])})
        return out
