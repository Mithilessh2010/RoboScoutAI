Autoscore Training Status
=========================

Status: Initial pipeline scaffolding created. No labeled dataset detected in repo.

Next steps:
- Label sampled frames (CVAT/Roboflow)
- Validate dataset and run training (GPU recommended)
- Integrate `best.pt` into `decode-training/trained-models/`

Warnings:
- No trained model supplied. The code includes training wrappers and Colab instructions.
- Field calibration, tracking and event detection are placeholders and must be implemented for accurate scoring.
