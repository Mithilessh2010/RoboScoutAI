#!/usr/bin/env python3
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from autoscore_algorithm import score_video

ZONES = [
    {'zoneType': 'field_boundary', 'coordinates': [{'x': 0, 'y': 0}, {'x': 1, 'y': 1}]},
    {'zoneType': 'basket_red', 'alliance': 'red', 'coordinates': [{'x': 0.05, 'y': 0.40}, {'x': 0.20, 'y': 0.60}]},
    {'zoneType': 'tunnel_red', 'alliance': 'red', 'coordinates': [{'x': 0.22, 'y': 0.40}, {'x': 0.35, 'y': 0.60}]},
    {'zoneType': 'ramp_red', 'alliance': 'red', 'coordinates': [{'x': 0.60, 'y': 0.40}, {'x': 0.90, 'y': 0.60}]},
    {'zoneType': 'basket_blue', 'alliance': 'blue', 'coordinates': [{'x': 0.05, 'y': 0.70}, {'x': 0.20, 'y': 0.90}]},
    {'zoneType': 'tunnel_blue', 'alliance': 'blue', 'coordinates': [{'x': 0.22, 'y': 0.70}, {'x': 0.35, 'y': 0.90}]},
    {'zoneType': 'ramp_blue', 'alliance': 'blue', 'coordinates': [{'x': 0.60, 'y': 0.70}, {'x': 0.90, 'y': 0.90}]},
]

def det(frame, x, y, color='green', conf=0.95):
    return {
        'frameNumber': frame,
        'timestamp': frame / 10,
        'className': f'artifact_{color}',
        'artifactColor': color,
        'confidence': conf,
        'centerX': x,
        'centerY': y,
    }

def stationary_ramp(frames=20):
    return [det(frame, 0.65, 0.50, 'green') for frame in range(frames)]

def preloaded_ramp_drop():
    rows = []
    five_positions = [0.62, 0.67, 0.72, 0.77, 0.82]
    three_positions = [0.62, 0.67, 0.72]
    for frame in range(0, 6):
        for index, x in enumerate(five_positions):
            rows.append(det(frame, x, 0.50 + index * 0.01, 'green' if index % 2 == 0 else 'purple'))
    for frame in range(6, 14):
        for index, x in enumerate(three_positions):
            rows.append(det(frame, x, 0.50 + index * 0.01, 'green' if index % 2 == 0 else 'purple'))
    return rows

def path_then_ramp(start_frame, y=0.50, color='green', ramp_x=0.65):
    return [
        det(start_frame, 0.10, y, color),
        det(start_frame + 1, 0.26, y, color),
        det(start_frame + 2, ramp_x, y, color),
        det(start_frame + 3, ramp_x + 0.01, y, color),
        det(start_frame + 4, ramp_x + 0.02, y, color),
        det(start_frame + 5, ramp_x + 0.02, y, color),
    ]

def run(name, rows, zones=ZONES):
    result = score_video(name, rows, zones, persistence_frames=2, confidence_threshold=0.25, max_distance=0.08)
    return result

def assert_eq(actual, expected, label):
    if actual != expected:
        raise AssertionError(f'{label}: expected {expected}, got {actual}')

def main():
    same = run('same artifact on ramp', stationary_ramp())
    assert_eq(same['red_score'], 0, 'same artifact on ramp should not score without path evidence')

    preloaded_drop = run('preloaded 5 to 3', preloaded_ramp_drop())
    assert_eq(preloaded_drop['red_score'], 0, 'preloaded ramp count 5 to 3 should not add or subtract points')
    if not any('dropped' in warning for warning in preloaded_drop['warnings']):
        raise AssertionError('preloaded ramp drop should create warning')

    one = run('2 to 3', path_then_ramp(0))
    assert_eq(one['red_score'], 3, 'single ramp increase gives one classified event worth 3')
    assert_eq(len([e for e in one['events'] if e['eventType'] == 'classified']), 1, 'single classified event')

    three_rows = []
    three_rows += path_then_ramp(0, y=0.45, color='green', ramp_x=0.62)
    three_rows += path_then_ramp(0, y=0.50, color='purple', ramp_x=0.72)
    three_rows += path_then_ramp(0, y=0.56, color='green', ramp_x=0.82)
    three = run('2 to 5', three_rows)
    assert_eq(three['red_score'], 9, 'three simultaneous ramp additions give three classified events worth 9')
    assert_eq(len([e for e in three['events'] if e['eventType'] == 'classified']), 3, 'three classified events')

    steady_rows = []
    steady_rows += path_then_ramp(0, ramp_x=0.62)
    steady_rows += [det(frame, 0.62, 0.50) for frame in range(10, 20)]
    steady = run('3 to 3', steady_rows)
    assert_eq(steady['red_score'], 3, 'holding steady after one increase should not add more')

    drop_rows = []
    drop_rows += path_then_ramp(0, y=0.45, ramp_x=0.62)
    drop_rows += path_then_ramp(0, y=0.55, color='purple', ramp_x=0.72)
    drop_rows += [det(frame, 0.62, 0.50) for frame in range(8, 14)]
    drop = run('5 to 3', drop_rows)
    assert_eq(drop['red_score'], 6, 'ramp drop should not subtract classified points')
    if not any('dropped' in warning for warning in drop['warnings']):
        raise AssertionError('ramp drop should create warning')

    overflow_rows = [det(0, 0.10, 0.50), det(1, 0.26, 0.50), det(2, 0.40, 0.50), det(3, 0.45, 0.50)]
    overflow = run('overflow', overflow_rows)
    assert_eq(overflow['red_score'], 1, 'path evidence without ramp increase gives one overflow point')
    assert_eq(len([e for e in overflow['events'] if e['eventType'] == 'overflow']), 1, 'one overflow event')

    replay_a = run('replay a', path_then_ramp(0))
    replay_b = run('replay b', path_then_ramp(0))
    assert_eq(replay_a['red_score'], replay_b['red_score'], 'replay deterministic score')
    assert_eq(len(replay_a['events']), len(replay_b['events']), 'replay deterministic events')

    print('All stateful DECODE scorer tests passed')

if __name__ == '__main__':
    main()
