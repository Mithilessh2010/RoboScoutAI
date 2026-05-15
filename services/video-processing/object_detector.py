"""YOLO object detector for DECODE autoscore computer vision."""
from pathlib import Path
from typing import Any, List, Dict

class ObjectDetector:
    def __init__(self, model_path: Path = Path("services/video-processing/models/decode/best.pt"), confidence: float = 0.25):
        self.model_path = model_path
        self.confidence = confidence
        self.model = None

    def load(self):
        if not self.model_path.exists():
            raise FileNotFoundError(f"Missing DECODE YOLO model: {self.model_path}")
        try:
            from ultralytics import YOLO
            self.model = YOLO(str(self.model_path))
        except Exception:
            raise RuntimeError('Install ultralytics to use ObjectDetector')
        return self

    def predict(self, image) -> List[Dict[str, Any]]:
        if self.model is None:
            raise RuntimeError('Model not loaded')
        res = self.model.predict(image, verbose=False, conf=self.confidence)
        out = []
        r = res[0]
        names = getattr(r, "names", getattr(self.model, "names", {}))
        boxes = getattr(getattr(r, "boxes", None), "data", [])
        for box in boxes.tolist():
            class_id = int(box[5])
            out.append({
                "bbox_xyxy": [float(v) for v in box[:4]],
                "confidence": float(box[4]),
                "class_id": class_id,
                "class_name": names.get(class_id, str(class_id)) if isinstance(names, dict) else str(class_id),
            })
        return out


class CombinedObjectDetector:
    """Run specialist DECODE detectors together while preserving their labels."""

    def __init__(
        self,
        artifact_model_path: Path = Path("services/video-processing/models/decode/best.pt"),
        robot_model_path: Path = Path("services/video-processing/models/decode/robot/best.pt"),
        confidence: float = 0.25,
    ):
        self.detectors = {
            "artifact": ObjectDetector(artifact_model_path, confidence),
            "robot": ObjectDetector(robot_model_path, confidence),
        }

    def load(self):
        for detector in self.detectors.values():
            detector.load()
        return self

    def predict(self, image) -> List[Dict[str, Any]]:
        rows = []
        for detector_type, detector in self.detectors.items():
            rows.extend({**row, "detector_type": detector_type} for row in detector.predict(image))
        return rows
