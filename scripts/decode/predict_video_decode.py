#!/usr/bin/env python3
"""Run inference on a video and output detections as JSON.
Requires ultralytics installed and a trained model at decode-training/trained-models/best.pt
"""
import argparse
from pathlib import Path
import json
import cv2


def main():
    p = argparse.ArgumentParser()
    p.add_argument('video')
    p.add_argument('--model', default='decode-training/trained-models/best.pt')
    p.add_argument('--out', default='decode-training/predictions')
    args = p.parse_args()

    try:
        from ultralytics import YOLO
    except Exception:
        print('Install ultralytics to run prediction locally')
        return

    model = YOLO(args.model)
    cap = cv2.VideoCapture(str(args.video))
    outp = Path(args.out)
    outp.mkdir(parents=True, exist_ok=True)
    results = []
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # run model on frame (BGR->RGB)
        import numpy as np
        im = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = model.predict(im, verbose=False)
        # take first result
        r = res[0]
        detections = []
        for box in r.boxes.data.tolist() if hasattr(r.boxes, 'data') else []:
            # box format: [x1,y1,x2,y2,score,class]
            detections.append({
                'bbox': box[:4],
                'score': float(box[4]),
                'class': int(box[5])
            })
        results.append({'frame': frame_idx, 'detections': detections})
        frame_idx += 1

    out_file = outp / (Path(args.video).stem + '.json')
    out_file.write_text(json.dumps(results))
    print('Saved predictions to', out_file)


if __name__ == '__main__':
    main()
