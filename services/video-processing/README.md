# RoboScoutAI Video Processing Scaffold

This service is intentionally a scaffold. The MVP does not fake automatic scoring.

Future pipeline:

1. Extract frames from uploaded videos or livestream snapshots.
2. Run object detection with YOLO, Roboflow, OpenCV, or a custom detector.
3. Detect season-specific game objects, field zones, robots, and game element motion.
4. Convert detections into suggested timeline events.
5. Apply season-specific scoring logic.
6. Show confidence for each suggestion.
7. Let humans confirm or correct every suggested event.
8. Store corrections as future training data.

For FTC 2025-2026 DECODE, placeholder classes include:

- artifact
- goal
- ramp
- base
- robot
- field zone
- obstacle/game-specific object

Live mode should display confidence and uncertainty. It should never pretend to be perfect.
