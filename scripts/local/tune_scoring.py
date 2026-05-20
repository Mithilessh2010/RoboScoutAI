#!/usr/bin/env python3
"""Simple tuner to search persistence/confidence parameters to match target counts."""
import json
from pymongo import MongoClient
from bson import ObjectId
import math
import sys
from pathlib import Path

# Ensure local scripts package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))
from autoscore_algorithm import score_video


def score_diff(result, target_red, target_blue):
    # Weighted absolute error
    return abs(result['red_score'] - target_red) + abs(result['blue_score'] - target_blue)


def main():
    client = MongoClient('mongodb://localhost:27017')
    db = client['test']
    job = db.autoscorejobs.find_one(sort=[('createdAt', -1)])
    if not job:
        print('No job')
        return 1
    job_id = job['_id']
    dets = list(db.autoscoredetections.find({'jobId': job_id}))
    zones = list(db.autoscorecalibrationzones.find({'jobId': job_id}))

    target_red = 74
    target_blue = 122

    best = None
    grid = []
    for p in [1, 2, 3, 4]:
        for c in [0.3, 0.5, 0.6, 0.7]:
            for md in [0.15, 0.2, 0.25]:
                grid.append((p, c, md))

    print(f'Testing {len(grid)} parameter combinations...')
    for p, c, md in grid:
        print(f'Trying p={p} c={c} md={md}...')
        res = score_video(str(job_id), dets, zones, persistence_frames=p, confidence_threshold=c, max_distance=md)
        diff = score_diff(res, target_red, target_blue)
        print(f' -> Red={res["red_score"]} Blue={res["blue_score"]} diff={diff}')
        if best is None or diff < best[0]:
            best = (diff, p, c, md, res)
    print('\nBest:', best)
    # Save best result
    outpath = f'runs/tune_result_{str(job_id)}.json'
    with open(outpath, 'w') as f:
        json.dump({'best': {'p': best[1], 'c': best[2], 'md': best[3]}, 'result': best[4]}, f, default=str)
    print('Saved tuning result to', outpath)
    return 0


if __name__ == '__main__':
    sys.exit(main())
