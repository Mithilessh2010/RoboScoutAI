"""Confidence and warning helpers for the DECODE autoscore pipeline."""
from dataclasses import dataclass, field
from typing import Dict, List


def warning_dict(message: str, level: str = "warning", code: str | None = None):
    payload = {"message": message, "level": level}
    if code:
        payload["code"] = code
    return payload


@dataclass
class ConfidenceReport:
    score: float = 1.0
    warnings: List[Dict[str, str]] = field(default_factory=list)

    def add_warning(self, message: str, level: str = "warning", code: str | None = None, penalty: float = 0.1):
        self.warnings.append(warning_dict(message, level=level, code=code))
        self.score = max(0.0, self.score - penalty)

    def as_dict(self):
        return {"confidence": round(self.score, 3), "warnings": self.warnings}
