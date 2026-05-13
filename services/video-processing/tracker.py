"""Placeholder multi-object tracker for DECODE pipeline.
Replace with SORT/DeepSORT or other tracker when integrating.
"""
from typing import List, Dict, Any


class SimpleTracker:
    def __init__(self):
        self.next_id = 1

    def update(self, detections: List[Dict[str, Any]]):
        # naive assign each detection a new id
        out = []
        for d in detections:
            d['track_id'] = self.next_id
            self.next_id += 1
            out.append(d)
        return out
