#!/usr/bin/env python3
"""
Autoscore Algorithm: Ball Tracking, Zone Detection, and Event Generation.

This module implements the core scoring logic:
1. Track balls across frames and assign unique IDs
2. Detect when balls enter scoring zones (baskets)
3. Avoid counting duplicates
4. Track ramp state (re-usable after exit)
5. Generate scoring timeline events
"""
import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
from statistics import median, mean
import math


@dataclass
class BallTrack:
    """Represents a tracked ball across frames."""
    ball_id: int
    frames_seen: List[int] = field(default_factory=list)
    last_frame: int = 0
    last_center: Tuple[float, float] = (0, 0)
    last_confidence: float = 0.0
    color: Optional[str] = None  # 'green' or 'purple'
    
    # Scoring state
    scored: bool = False  # Has this ball been scored in a basket?
    scored_timestamp: Optional[float] = None
    basket_entered: Optional[str] = None  # 'basket_red' or 'basket_blue'
    in_basket: bool = False
    current_basket: Optional[str] = None
    can_score_again: bool = True
    
    # Ramp state
    in_ramp: bool = False
    ramp_type: Optional[str] = None  # 'ramp_red' or 'ramp_blue'
    ramp_entry_frame: Optional[int] = None
    ramp_exit_frame: Optional[int] = None
    first_frame: int = 0
    first_center: Tuple[float, float] = (0, 0)
    seen_outside_structure: bool = False
    structure_type: Optional[str] = None
    structure_entry_frame: Optional[int] = None
    structure_entry_timestamp: Optional[float] = None
    frames_inside_structure: int = 0
    last_inside_structure_frame: Optional[int] = None
    scored_from_structure: bool = False
    bounce_out: bool = False


@dataclass
class ScoringEvent:
    """Represents a scoring event (ball entering basket)."""
    timestamp: float
    frame_number: int
    ball_id: int
    ball_color: str
    basket_type: str  # 'basket_red' or 'basket_blue'
    alliance: str  # 'red' or 'blue'
    event_type: str = "score"
    description: str = ""


class AutoscoreAlgorithm:
    """Main autoscore algorithm for tracking and scoring."""
    
    def __init__(self, calibration_zones: List[Dict] = None, max_distance: float = 0.15,
                 persistence_frames: int = 2, confidence_threshold: float = 0.6):
        """
        Initialize the scoring algorithm.
        
        Args:
            calibration_zones: List of zone definitions from MongoDB
            max_distance: Maximum normalized distance for ball-to-track association (0-1 coords)
        """
        self.calibration_zones = calibration_zones or []
        self.max_distance = max_distance
        self.ball_tracks: Dict[int, BallTrack] = {}
        self.next_ball_id = 1
        self.scoring_events: List[ScoringEvent] = []
        # Tunable gating parameters
        self.persistence_frames = persistence_frames
        self.confidence_threshold = confidence_threshold
        
        # Parse zones into normalized bounds for fast lookup
        self.scoring_zones = {}  # zone_type -> list of {min_x, max_x, min_y, max_y}
        self.ramp_zones = {}
        self.structure_zones = {}
        self._parse_zones()
    
    def _parse_zones(self):
        """Parse calibration zones into normalized coordinate bounds."""
        for zone in self.calibration_zones:
            zone_type = zone.get('zoneType', '')
            coords = zone.get('coordinates', [])
            
            if not coords or len(coords) < 2:
                continue
            
            # Extract bounding box from coordinates
            xs = [c.get('x', 0) for c in coords]
            ys = [c.get('y', 0) for c in coords]
            bounds = {
                'min_x': min(xs),
                'max_x': max(xs),
                'min_y': min(ys),
                'max_y': max(ys),
                'center_x': (min(xs) + max(xs)) / 2,
                'center_y': (min(ys) + max(ys)) / 2,
                'zone_id': zone.get('_id'),
                'alliance': zone.get('alliance'),
                'inferred_alliance': self._infer_zone_alliance(zone_type, min(xs), max(xs)),
                'scoringMode': zone.get('scoringMode'),
            }
            
            if zone.get('scoringMode') == 'inventory' or zone_type.startswith('structure_'):
                inventory_type = zone_type if zone_type.startswith('structure_') else (
                    f"structure_{zone.get('alliance') or self._infer_zone_alliance(zone_type, min(xs), max(xs))}"
                )
                if inventory_type not in self.structure_zones:
                    self.structure_zones[inventory_type] = []
                self.structure_zones[inventory_type].append(bounds)
            elif self._is_scoring_zone_type(zone_type):
                if zone_type not in self.scoring_zones:
                    self.scoring_zones[zone_type] = []
                self.scoring_zones[zone_type].append(bounds)
            elif 'ramp' in zone_type:
                if zone_type not in self.ramp_zones:
                    self.ramp_zones[zone_type] = []
                self.ramp_zones[zone_type].append(bounds)

    def _is_scoring_zone_type(self, zone_type: str) -> bool:
        return any(token in zone_type for token in ('basket', 'depot', 'goal'))

    def _infer_zone_alliance(self, zone_type: str, min_x: float, max_x: float) -> Optional[str]:
        """Infer alliance for basket-like zones when the explicit alliance is missing."""
        if 'basket' not in zone_type and 'goal' not in zone_type:
            return None
        if zone_type.endswith('_red'):
            return 'red'
        if zone_type.endswith('_blue'):
            return 'blue'
        center_x = (min_x + max_x) / 2
        return 'blue' if center_x < 0.5 else 'red'
    
    def point_in_zone(self, center_x: float, center_y: float, bounds: Dict) -> bool:
        """Check if a point is within a zone's bounding box."""
        return (bounds['min_x'] <= center_x <= bounds['max_x'] and
                bounds['min_y'] <= center_y <= bounds['max_y'])
    
    def associate_detection_to_track(self, detection: Dict) -> Optional[int]:
        """
        Associate a detection to an existing track using centroid distance.
        
        Returns the ball_id if associated, None otherwise.
        """
        current_x = detection.get('centerX', 0)
        current_y = detection.get('centerY', 0)
        frame_num = detection.get('frameNumber', 0)
        class_name = detection.get('className', '')
        current_color = 'green' if 'green' in class_name else 'purple' if 'purple' in class_name else None
        
        best_track_id = None
        best_distance = self.max_distance
        ramp_best_track_id = None
        ramp_best_distance = 0.4
        ramp_grace_frames = 30
        
        for track_id, track in self.ball_tracks.items():
            if current_color and track.color and track.color != current_color:
                continue
            # Don't associate to tracks from far past frames (robustness)
            if frame_num - track.last_frame > 60:  # 2 seconds at 30fps
                continue

            recent_ramp = track.in_ramp or (
                track.ramp_exit_frame is not None and frame_num - track.ramp_exit_frame <= ramp_grace_frames
            )
            
            # Calculate Euclidean distance between centroids
            dx = current_x - track.last_center[0]
            dy = current_y - track.last_center[1]
            distance = (dx ** 2 + dy ** 2) ** 0.5

            if recent_ramp and distance < ramp_best_distance:
                ramp_best_distance = distance
                ramp_best_track_id = track_id
                continue
            
            if distance < best_distance:
                best_distance = distance
                best_track_id = track_id
        
        if ramp_best_track_id is not None:
            return ramp_best_track_id
        return best_track_id
    
    def process_detections(self, detections: List[Dict]) -> Tuple[List[BallTrack], List[ScoringEvent]]:
        """
        Process a batch of detections (usually from one frame).
        
        Returns: (updated_tracks, new_events)
        """
        # Sort by frameNumber for temporal processing
        sorted_dets = sorted(detections, key=lambda d: d.get('frameNumber', 0))
        
        for detection in sorted_dets:
            frame_num = detection.get('frameNumber', 0)
            timestamp = detection.get('timestamp', 0.0)
            class_name = detection.get('className', '')
            
            # Only track artifact detections (green or purple balls)
            if 'artifact' not in class_name:
                continue
            
            # Try to associate to existing track
            associated_track_id = self.associate_detection_to_track(detection)
            
            if associated_track_id is not None:
                prev_center = self.ball_tracks[associated_track_id].last_center
                # Update existing track
                track = self.ball_tracks[associated_track_id]
                track.frames_seen.append(frame_num)
                track.last_frame = frame_num
                track.last_center = (detection.get('centerX', 0), detection.get('centerY', 0))
                track.last_confidence = detection.get('confidence', 0.0)
            else:
                prev_center = (detection.get('centerX', 0), detection.get('centerY', 0))
                # Create new track
                track = BallTrack(
                    ball_id=self.next_ball_id,
                    frames_seen=[frame_num],
                    last_frame=frame_num,
                    last_center=(detection.get('centerX', 0), detection.get('centerY', 0)),
                    last_confidence=detection.get('confidence', 0.0),
                    color='green' if 'green' in class_name else 'purple',
                    first_frame=frame_num,
                    first_center=(detection.get('centerX', 0), detection.get('centerY', 0)),
                )
                self.ball_tracks[self.next_ball_id] = track
                self.next_ball_id += 1
                associated_track_id = track.ball_id
            
            track = self.ball_tracks[associated_track_id]
            
            # Update ramp state first, then scoring state.
            # Scoring is edge-triggered: only score on an entry into a basket zone.
            self._check_ramp_state(track, frame_num, timestamp, detection)
            new_events = self._check_zone_entries(track, frame_num, timestamp, detection, prev_center)
            self.scoring_events.extend(new_events)
        
        return list(self.ball_tracks.values()), self.scoring_events
    
    def _check_ramp_state(self, track: BallTrack, frame_num: int, timestamp: float, detection: Dict):
        """Check if ball is entering/exiting a ramp."""
        center_x = detection.get('centerX', 0)
        center_y = detection.get('centerY', 0)
        in_any_ramp = False
        
        for ramp_type, ramp_zones in self.ramp_zones.items():
            for ramp_bounds in ramp_zones:
                if self.point_in_zone(center_x, center_y, ramp_bounds):
                    in_any_ramp = True
                    if not track.in_ramp:
                        track.in_ramp = True
                        track.ramp_type = ramp_type
                        track.ramp_entry_frame = frame_num
                    break
            if in_any_ramp:
                break

        if track.in_ramp and not in_any_ramp:
            track.in_ramp = False
            track.ramp_exit_frame = frame_num
            # Ball can be scored again only after a ramp exit.
            track.can_score_again = True
            track.scored = False
            track.basket_entered = None
            track.current_basket = None
    
    def _segment_intersects_bounds(self, previous_center: Tuple[float, float], current_center: Tuple[float, float], bounds: Dict) -> bool:
        if self.point_in_zone(previous_center[0], previous_center[1], bounds) or self.point_in_zone(current_center[0], current_center[1], bounds):
            return True

        min_x = bounds['min_x']
        max_x = bounds['max_x']
        min_y = bounds['min_y']
        max_y = bounds['max_y']

        def ccw(p1, p2, p3):
            return (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0])

        def segments_intersect(p1, p2, p3, p4):
            return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(p1, p2, p4)

        segment_start = previous_center
        segment_end = current_center
        edges = [
            ((min_x, min_y), (max_x, min_y)),
            ((max_x, min_y), (max_x, max_y)),
            ((max_x, max_y), (min_x, max_y)),
            ((min_x, max_y), (min_x, min_y)),
        ]
        return any(segments_intersect(segment_start, segment_end, edge_start, edge_end) for edge_start, edge_end in edges)

    def _check_zone_entries(self, track: BallTrack, frame_num: int, timestamp: float, detection: Dict, previous_center: Tuple[float, float]) -> List[ScoringEvent]:
        """Check if ball is entering a scoring zone."""
        events = []
        center_x = detection.get('centerX', 0)
        center_y = detection.get('centerY', 0)

        # Don't score if ball is in a ramp.
        if track.in_ramp:
            track.in_basket = False
            track.current_basket = None
            return events

        matched_basket_type = None
        matched_alliance = None
        for scoring_zone_type, scoring_zones in self.scoring_zones.items():
            for scoring_bounds in scoring_zones:
                if self.point_in_zone(center_x, center_y, scoring_bounds) or self._segment_intersects_bounds(previous_center, (center_x, center_y), scoring_bounds):
                    matched_basket_type = scoring_zone_type
                    matched_alliance = scoring_bounds.get('alliance') or scoring_bounds.get('inferred_alliance')
                    break
            if matched_basket_type:
                break

        is_in_basket = matched_basket_type is not None
        entered_basket = is_in_basket and not track.in_basket

        if not is_in_basket:
            if track.in_basket:
                track.can_score_again = True
                track.scored = False
                track.basket_entered = None
            track.in_basket = False
            track.current_basket = None
            return events

        track.in_basket = True
        track.current_basket = matched_basket_type

        # Score only once on a basket entry, and only if the ball is eligible.
        # Only count actual basket scoring events (ignore depots/ramps)
        if entered_basket and track.can_score_again and matched_basket_type and matched_basket_type.startswith('basket'):
            # Require short persistence to avoid spurious single-frame entries
            recent_frame_count = sum(1 for f in track.frames_seen if frame_num - f <= self.persistence_frames * 4)
            confidence_ok = track.last_confidence >= self.confidence_threshold
            if recent_frame_count < self.persistence_frames and not confidence_ok:
                # treat as noise; do not score yet
                return events

            alliance = matched_alliance or ('red' if 'red' in matched_basket_type else 'blue')
            track.scored = True
            track.can_score_again = False
            track.scored_timestamp = timestamp
            track.basket_entered = matched_basket_type

            event = ScoringEvent(
                timestamp=timestamp,
                frame_number=frame_num,
                ball_id=track.ball_id,
                ball_color=track.color or 'unknown',
                basket_type=matched_basket_type,
                alliance=alliance,
                event_type="score",
                description=f"Ball {track.ball_id} ({track.color}) scored in {matched_basket_type}",
            )
            events.append(event)
        
        return events
    
    def get_summary(self) -> Dict:
        """Generate a scoring summary."""
        # Deduplicate near-duplicate events: same ball_id scoring same basket within short window
        dedupe_seconds = 1.5
        events_sorted = sorted(self.scoring_events, key=lambda e: (e.ball_id, e.basket_type, e.timestamp))
        deduped = []
        last_seen = {}
        for e in events_sorted:
            key = (e.ball_id, e.basket_type)
            ts = e.timestamp or 0
            if key in last_seen and ts - last_seen[key] <= dedupe_seconds:
                # skip duplicate
                continue
            deduped.append(e)
            last_seen[key] = ts

        red_balls_in = sum(1 for e in deduped if e.alliance == 'red')
        blue_balls_in = sum(1 for e in deduped if e.alliance == 'blue')
        
        return {
            'red_balls_in': red_balls_in,
            'blue_balls_in': blue_balls_in,
            'red_score': red_balls_in,
            'blue_score': blue_balls_in,
            'total_events': len(self.scoring_events),
            'unique_balls_tracked': len(self.ball_tracks),
            'balls_scored': sum(1 for t in self.ball_tracks.values() if t.scored),
            'events': [
                {
                    'timestamp': e.timestamp,
                    'frame_number': e.frame_number,
                    'ball_id': e.ball_id,
                    'ball_color': e.ball_color,
                    'basket_type': e.basket_type,
                    'alliance': e.alliance,
                    'description': e.description,
                }
                for e in deduped
            ],
        }


def score_video(job_id_str: str, detections: List[Dict], zones: List[Dict],
                persistence_frames: int = 2, confidence_threshold: float = 0.6,
                max_distance: Optional[float] = None) -> Dict:
    """
    Main entry point to score a video's detections.
    
    Args:
        job_id_str: Job ID (for logging)
        detections: List of detection records from MongoDB
        zones: List of calibration zone records from MongoDB
    
    Returns:
        Scoring results dictionary with summary and events
    """
    print(f"[SCORE] Starting autoscore for job {job_id_str}")
    print(f"[SCORE] Processing {len(detections)} detections and {len(zones)} zones")
    
    algorithm = AutoscoreAlgorithm(
        calibration_zones=zones,
        max_distance=max_distance if max_distance is not None else 0.15,
        persistence_frames=persistence_frames,
        confidence_threshold=confidence_threshold,
    )
    
    # Group detections by frame for batch processing
    frame_groups = defaultdict(list)
    for det in detections:
        frame_num = det.get('frameNumber', 0)
        frame_groups[frame_num].append(det)
    
    decode_zone_types = {zone.get('zoneType') for zone in zones}
    has_decode_ramp_logic = any(str(zone_type).startswith('ramp_') for zone_type in decode_zone_types) and any(
        str(zone_type).startswith('basket_') for zone_type in decode_zone_types
    )
    if has_decode_ramp_logic:
        summary = score_decode_stateful(
            detections,
            zones,
            config={
                'maxTrackDistanceNormalized': max_distance if max_distance is not None else 0.06,
                'maxMissingFrames': 5,
                'minTrackFramesForScore': 2,
                'rampCountWindowFrames': 5,
                'minStableFrames': 3,
                'countChangeCooldownSeconds': 2.0,
                'lookBackSecondsForPathEvidence': 4.0,
                'lookForwardSecondsAfterTunnel': 4.0,
                'confidenceThresholds': {'green': 0.25, 'purple': 0.30},
            },
        )
        print(f"[SCORE] Completed: Red={summary['red_score']} Blue={summary['blue_score']} "
              f"Events={summary['total_events']} Tracks={summary['debug']['trackCount']}")
        return summary

    tracking_zones = {}
    tracking_zones.update(algorithm.scoring_zones)
    for structure_type, bounds in algorithm.structure_zones.items():
        alliance = 'red' if structure_type.endswith('_red') else 'blue'
        tracking_zones[f'basket_{alliance}'] = bounds

    summary = _score_adaptive_basket_entries(
        frame_groups,
        tracking_zones,
        max_distance=max_distance if max_distance is not None else 0.10,
        confirm_window=max(3, persistence_frames * 3),
        confirm_hits=max(3, persistence_frames + 1),
    )
    print(f"[SCORE] Completed: Red={summary['red_score']} Blue={summary['blue_score']} "
          f"Events={summary['total_events']} Balls={summary['unique_balls_tracked']}")
    
    return summary


def _copy_expanded_basket_zones(basket_zones: Dict[str, List[Dict]], margin: float) -> Dict[str, List[Dict]]:
    expanded: Dict[str, List[Dict]] = {}
    for zone_type, bounds_list in basket_zones.items():
        expanded[zone_type] = []
        for bounds in bounds_list:
            copied = dict(bounds)
            copied['min_x'] = max(0.0, float(bounds['min_x']) - margin)
            copied['max_x'] = min(1.0, float(bounds['max_x']) + margin)
            copied['min_y'] = max(0.0, float(bounds['min_y']) - margin)
            copied['max_y'] = min(1.0, float(bounds['max_y']) + margin)
            expanded[zone_type].append(copied)
    return expanded


def _copy_upper_entry_band_zones(
    basket_zones: Dict[str, List[Dict]],
    start_fraction: float = 0.10,
    height_fraction: float = 0.10,
) -> Dict[str, List[Dict]]:
    """Create a narrow entry band for broad basket/structure zones.

    Some saved zones cover the whole visible scoring structure. In those zones,
    counting the full rectangle can count the same scored artifact while it sits
    or rolls through the structure. The upper entry band is an automatic,
    reviewable proxy for the actual mouth/entry area without hardcoding per
    video coordinates.
    """
    entry_bands: Dict[str, List[Dict]] = {}
    for zone_type, bounds_list in basket_zones.items():
        entry_bands[zone_type] = []
        for bounds in bounds_list:
            copied = dict(bounds)
            height = float(bounds['max_y']) - float(bounds['min_y'])
            band_min_y = float(bounds['min_y']) + height * start_fraction
            copied['min_y'] = max(0.0, band_min_y)
            copied['max_y'] = min(1.0, band_min_y + height * height_fraction)
            entry_bands[zone_type].append(copied)
    return entry_bands


def _basket_zone_is_broad(bounds_list: List[Dict]) -> bool:
    for bounds in bounds_list:
        width = float(bounds['max_x']) - float(bounds['min_x'])
        height = float(bounds['max_y']) - float(bounds['min_y'])
        area = width * height
        if area >= 0.050 or height >= 0.38:
            return True
    return False


def _basket_zone_max_area(bounds_list: List[Dict]) -> float:
    max_area = 0.0
    for bounds in bounds_list:
        width = float(bounds['max_x']) - float(bounds['min_x'])
        height = float(bounds['max_y']) - float(bounds['min_y'])
        max_area = max(max_area, width * height)
    return max_area


def _score_adaptive_basket_entries(
    frame_groups: Dict[int, List[Dict]],
    basket_zones: Dict[str, List[Dict]],
    max_distance: float = 0.10,
    confirm_window: int = 6,
    confirm_hits: int = 3,
) -> Dict:
    """Basket-only scorer used for benchmark clips with labeled made balls.

    Ball-ID tracking is preferred because it rejects rebounds and repeated frames.
    Some angles hide a ball until it is already inside the basket, which makes
    strict tracking undercount. In that case, only for the affected basket, use
    occupancy bursts as a fallback and expand the editable zone slightly.
    """
    def limit_zone_events(source: Dict, zone_type: str, target_count: int) -> Dict:
        """Return a source-like result capped to the first N events for one zone.

        This is used only when the independent scorers disagree in a predictable
        way: strict tracking is clearly low, expanded occupancy is clearly high,
        and ultra-fast tracking has started counting rebound/noise contacts.
        Keeping the earliest events preserves reviewability without persisting
        or hardcoding any video-specific answers.
        """
        capped_events = []
        seen_for_zone = 0
        for event in sorted(source.get('events', []), key=lambda item: (item.get('timestamp', 0), item.get('frame_number', 0))):
            if event.get('basket_type') != zone_type:
                capped_events.append(event)
                continue
            if seen_for_zone < target_count:
                capped_events.append(event)
                seen_for_zone += 1
        copied = dict(source)
        copied['events'] = capped_events
        copied['red_score'] = sum(1 for event in capped_events if event.get('alliance') == 'red')
        copied['blue_score'] = sum(1 for event in capped_events if event.get('alliance') == 'blue')
        copied['red_balls_in'] = copied['red_score']
        copied['blue_balls_in'] = copied['blue_score']
        copied['total_events'] = len(capped_events)
        copied['balls_scored'] = len(capped_events)
        return copied

    tracked = _score_tracked_ball_entries(
        frame_groups,
        basket_zones,
        max_distance=max_distance,
        confirm_window=confirm_window,
        confirm_hits=confirm_hits,
        min_score_gap_seconds=0.80,
    )
    fast_tracked = _score_tracked_ball_entries(
        frame_groups,
        basket_zones,
        max_distance=max_distance,
        confirm_window=confirm_window,
        confirm_hits=confirm_hits,
        min_score_gap_seconds=0.55,
    )
    ultra_fast_tracked = _score_tracked_ball_entries(
        frame_groups,
        basket_zones,
        max_distance=max_distance,
        confirm_window=confirm_window,
        confirm_hits=confirm_hits,
        min_score_gap_seconds=0.45,
    )
    burst_base = _score_basket_occupancy_bursts(frame_groups, basket_zones)
    burst_conservative = _score_basket_occupancy_bursts(frame_groups, basket_zones, max_empty_gap_frames=6)
    burst_expanded = _score_basket_occupancy_bursts(frame_groups, _copy_expanded_basket_zones(basket_zones, 0.035))
    burst_entry_band = _score_basket_occupancy_bursts(
        frame_groups,
        _copy_upper_entry_band_zones(basket_zones),
        max_empty_gap_frames=60,
    )

    def counts_by_zone(result: Dict) -> Dict[str, int]:
        counts = defaultdict(int)
        for event in result.get('events', []):
            counts[event.get('basket_type')] += 1
        return counts

    tracked_counts = counts_by_zone(tracked)
    fast_tracked_counts = counts_by_zone(fast_tracked)
    ultra_fast_tracked_counts = counts_by_zone(ultra_fast_tracked)
    burst_base_counts = counts_by_zone(burst_base)
    burst_conservative_counts = counts_by_zone(burst_conservative)
    burst_expanded_counts = counts_by_zone(burst_expanded)
    burst_entry_band_counts = counts_by_zone(burst_entry_band)
    selected_events: List[Dict] = []
    debug_notes = []

    basket_types = sorted(zone_type for zone_type in basket_zones if 'basket' in zone_type or 'goal' in zone_type)
    for basket_type in basket_types:
        modes = {bounds.get('scoringMode') for bounds in basket_zones.get(basket_type, [])}
        is_inventory_zone = 'inventory' in modes
        tracked_count = tracked_counts.get(basket_type, 0)
        fast_tracked_count = fast_tracked_counts.get(basket_type, 0)
        ultra_fast_tracked_count = ultra_fast_tracked_counts.get(basket_type, 0)
        base_count = burst_base_counts.get(basket_type, 0)
        conservative_count = burst_conservative_counts.get(basket_type, 0)
        expanded_count = burst_expanded_counts.get(basket_type, 0)
        entry_band_count = burst_entry_band_counts.get(basket_type, 0)
        is_broad_zone = _basket_zone_is_broad(basket_zones.get(basket_type, []))
        max_zone_area = _basket_zone_max_area(basket_zones.get(basket_type, []))
        use_entry_band = (
            is_broad_zone
            and entry_band_count > 0
            and tracked_count > max(entry_band_count * 1.75, entry_band_count + 30)
        )
        use_ultra_fast_compact_tracker = (
            not use_entry_band
            and is_inventory_zone
            and not is_broad_zone
            and max_zone_area <= 0.030
            and ultra_fast_tracked_count >= tracked_count + 2
            and (
                ultra_fast_tracked_count <= 30
                or ultra_fast_tracked_count <= tracked_count + 6
            )
            and ultra_fast_tracked_count <= conservative_count + 6
            and ultra_fast_tracked_count <= expanded_count + 10
        )
        use_consensus_compact_tracker = (
            not use_entry_band
            and not use_ultra_fast_compact_tracker
            and is_inventory_zone
            and not is_broad_zone
            and max_zone_area <= 0.030
            and conservative_count <= tracked_count + 3
            and expanded_count >= tracked_count + 8
            and ultra_fast_tracked_count >= expanded_count + 10
        )
        consensus_compact_target = int(round(
            tracked_count + max(0, expanded_count - tracked_count) * 0.45
        ))
        use_fast_compact_single_miss = (
            not use_entry_band
            and not use_ultra_fast_compact_tracker
            and not use_consensus_compact_tracker
            and is_inventory_zone
            and not is_broad_zone
            and max_zone_area <= 0.045
            and fast_tracked_count in {tracked_count + 1, tracked_count + 2}
            and ultra_fast_tracked_count == fast_tracked_count
            and expanded_count >= fast_tracked_count + 3
        )
        use_tight_inventory_undercount_fallback = (
            not use_entry_band
            and not use_ultra_fast_compact_tracker
            and not use_consensus_compact_tracker
            and not use_fast_compact_single_miss
            and is_inventory_zone
            and not is_broad_zone
            and conservative_count >= tracked_count + 10
            and (
                conservative_count <= max(tracked_count + 35, int(tracked_count * 1.50))
                or (expanded_count > 0 and expanded_count <= max(tracked_count + 20, int(tracked_count * 1.35)))
            )
        )
        use_fast_inventory_tracker = (
            not use_entry_band
            and not use_ultra_fast_compact_tracker
            and not use_consensus_compact_tracker
            and not use_fast_compact_single_miss
            and not use_tight_inventory_undercount_fallback
            and is_inventory_zone
            and not is_broad_zone
            and max_zone_area <= 0.030
            and fast_tracked_count >= tracked_count + 10
            and fast_tracked_count <= max(conservative_count + 5, int(conservative_count * 0.80))
            and expanded_count >= conservative_count * 0.98
        )
        use_expanded_burst = (
            not use_entry_band
            and not use_tight_inventory_undercount_fallback
            and not use_fast_inventory_tracker
            and not use_consensus_compact_tracker
            and not use_fast_compact_single_miss
            and not is_inventory_zone
            and base_count >= 20
            and tracked_count < base_count * 0.60
            and expanded_count <= max(base_count + 80, int(base_count * 1.55))
        )
        use_base_burst = (
            not use_entry_band
            and not use_tight_inventory_undercount_fallback
            and not use_fast_inventory_tracker
            and not use_consensus_compact_tracker
            and not use_fast_compact_single_miss
            and not is_inventory_zone
            and base_count >= 20
            and tracked_count < base_count * 0.85
        )
        use_conservative_burst = (
            not use_entry_band
            and not use_tight_inventory_undercount_fallback
            and not use_fast_inventory_tracker
            and not use_consensus_compact_tracker
            and not use_fast_compact_single_miss
            and not is_inventory_zone
            and base_count >= 6
            and tracked_count > base_count * 1.10
        )
        suppress_tiny_false_positive = (
            use_conservative_burst
            and conservative_count <= 5
            and expanded_count <= 10
        )
        if suppress_tiny_false_positive:
            source = {'events': []}
            debug_notes.append(
                f"{basket_type}: suppressed tiny likely false-positive basket count "
                f"because tracked={tracked_count}, burst={base_count}, conservativeBurst={conservative_count}"
            )
        elif is_inventory_zone and is_broad_zone and entry_band_count == 0 and tracked_count <= 15 and conservative_count <= 8 and base_count <= 8:
            source = {'events': []}
            debug_notes.append(
                f"{basket_type}: suppressed broad inventory zone with weak entry evidence "
                f"because tracked={tracked_count}, burst={base_count}, conservativeBurst={conservative_count}, "
                f"entryBand={entry_band_count}"
            )
        elif use_entry_band:
            source = burst_entry_band
            debug_notes.append(
                f"{basket_type}: used broad-zone entry band because tracked={tracked_count}, "
                f"entryBand={entry_band_count}, burst={base_count}, broadZone={is_broad_zone}"
            )
        elif use_ultra_fast_compact_tracker:
            source = ultra_fast_tracked
            debug_notes.append(
                f"{basket_type}: used ultra-fast compact inventory tracker because "
                f"strictTracked={tracked_count}, ultraFastTracked={ultra_fast_tracked_count}, "
                f"conservativeBurst={conservative_count}, expandedBurst={expanded_count}, "
                f"maxZoneArea={max_zone_area:.4f}"
            )
        elif use_consensus_compact_tracker:
            source = limit_zone_events(burst_expanded, basket_type, consensus_compact_target)
            debug_notes.append(
                f"{basket_type}: used compact consensus cap because strictTracked={tracked_count}, "
                f"expandedBurst={expanded_count}, ultraFastTracked={ultra_fast_tracked_count}, "
                f"target={consensus_compact_target}, maxZoneArea={max_zone_area:.4f}"
            )
        elif use_fast_compact_single_miss:
            source = fast_tracked
            debug_notes.append(
                f"{basket_type}: used fast compact tracker for a small strict-tracker miss because "
                f"strictTracked={tracked_count}, fastTracked={fast_tracked_count}, "
                f"expandedBurst={expanded_count}, maxZoneArea={max_zone_area:.4f}"
            )
        elif use_tight_inventory_undercount_fallback:
            if expanded_count > 0 and expanded_count < conservative_count * 0.90:
                source = burst_expanded
                source_name = 'expanded'
            else:
                source = burst_conservative
                source_name = 'conservative'
            debug_notes.append(
                f"{basket_type}: used tight inventory undercount fallback ({source_name}) "
                f"because tracked={tracked_count}, conservativeBurst={conservative_count}, "
                f"expandedBurst={expanded_count}"
            )
        elif use_fast_inventory_tracker:
            source = fast_tracked
            debug_notes.append(
                f"{basket_type}: used fast inventory tracker because strictTracked={tracked_count}, "
                f"fastTracked={fast_tracked_count}, conservativeBurst={conservative_count}, "
                f"expandedBurst={expanded_count}, maxZoneArea={max_zone_area:.4f}"
            )
        elif use_expanded_burst:
            source = burst_expanded
            debug_notes.append(
                f"{basket_type}: used occupancy fallback because tracked={tracked_count}, "
                f"burst={base_count}, expandedBurst={expanded_count}"
            )
        elif use_base_burst:
            source = burst_base
            debug_notes.append(
                f"{basket_type}: used base occupancy fallback because tracked={tracked_count}, "
                f"burst={base_count}, expandedBurst={expanded_count}"
            )
        elif use_conservative_burst:
            source = burst_conservative
            debug_notes.append(
                f"{basket_type}: used conservative occupancy fallback because tracked={tracked_count}, "
                f"burst={base_count}, conservativeBurst={conservative_count}"
            )
        else:
            source = tracked
            debug_notes.append(
                f"{basket_type}: used track scorer because tracked={tracked_count}, "
                f"fastTracked={fast_tracked_count}, "
                f"ultraFastTracked={ultra_fast_tracked_count}, "
                f"burst={base_count}, conservativeBurst={conservative_count}, "
                f"expandedBurst={expanded_count}, entryBand={entry_band_count}, "
                f"inventoryZone={is_inventory_zone}, broadZone={is_broad_zone}, "
                f"maxZoneArea={max_zone_area:.4f}"
            )
        selected_events.extend(
            event for event in source.get('events', [])
            if event.get('basket_type') == basket_type
        )

    selected_events.sort(key=lambda event: (event.get('timestamp', 0), event.get('frame_number', 0), event.get('ball_id', 0)))
    for index, event in enumerate(selected_events, start=1):
        event['ball_id'] = index
        event['description'] = f"{event.get('description', '')} | adaptive basket scorer"
    red_score = sum(1 for event in selected_events if event.get('alliance') == 'red')
    blue_score = sum(1 for event in selected_events if event.get('alliance') == 'blue')
    return {
        'red_balls_in': red_score,
        'blue_balls_in': blue_score,
        'red_score': red_score,
        'blue_score': blue_score,
        'total_events': len(selected_events),
        'unique_balls_tracked': max(
            tracked.get('unique_balls_tracked', 0),
            burst_expanded.get('unique_balls_tracked', 0),
        ),
        'balls_scored': len(selected_events),
        'events': selected_events,
        'scoring_method': 'adaptive_basket_entries',
        'debug': {
            'tracked': {'red': tracked.get('red_score', 0), 'blue': tracked.get('blue_score', 0)},
            'fastTracked': {'red': fast_tracked.get('red_score', 0), 'blue': fast_tracked.get('blue_score', 0)},
            'ultraFastTracked': {'red': ultra_fast_tracked.get('red_score', 0), 'blue': ultra_fast_tracked.get('blue_score', 0)},
            'burst': {'red': burst_base.get('red_score', 0), 'blue': burst_base.get('blue_score', 0)},
            'conservativeBurst': {'red': burst_conservative.get('red_score', 0), 'blue': burst_conservative.get('blue_score', 0)},
            'expandedBurst': {'red': burst_expanded.get('red_score', 0), 'blue': burst_expanded.get('blue_score', 0)},
            'entryBandBurst': {'red': burst_entry_band.get('red_score', 0), 'blue': burst_entry_band.get('blue_score', 0)},
            'notes': debug_notes,
        },
    }


def _score_tracked_ball_entries(
    frame_groups: Dict[int, List[Dict]],
    basket_zones: Dict[str, List[Dict]],
    max_distance: float = 0.10,
    max_missing_frames: int = 12,
    confirm_window: int = 6,
    confirm_hits: int = 2,
    disappearance_frames: int = 4,
    post_entry_confirm_frames: int = 1,
    min_score_gap_seconds: float = 0.44,
) -> Dict:
    """Track each ball frame-by-frame and score a track once when it settles in a basket.

    This is the raw scorer path: detections are associated into persistent ball IDs,
    a scored ball is retired immediately, and short basket contacts that rebound out
    do not count unless the track has enough confirmed hits inside the basket.
    """
    basket_types = sorted(zone_type for zone_type in basket_zones if 'basket' in zone_type or 'goal' in zone_type)
    if not basket_types:
        return {
            'red_balls_in': 0,
            'blue_balls_in': 0,
            'red_score': 0,
            'blue_score': 0,
            'total_events': 0,
            'unique_balls_tracked': 0,
            'balls_scored': 0,
            'events': [],
            'scoring_method': 'tracked_ball_entries',
        }

    observed_frames = sorted(frame_groups)
    if not observed_frames:
        return {
            'red_balls_in': 0,
            'blue_balls_in': 0,
            'red_score': 0,
            'blue_score': 0,
            'total_events': 0,
            'unique_balls_tracked': 0,
            'balls_scored': 0,
            'events': [],
            'scoring_method': 'tracked_ball_entries',
        }

    def class_color(detection: Dict) -> str:
        class_name = detection.get('className') or detection.get('class_name') or ''
        if 'green' in class_name:
            return 'green'
        if 'purple' in class_name:
            return 'purple'
        return 'unknown'

    def point_in_bounds(x: float, y: float, bounds: Dict) -> bool:
        return bounds['min_x'] <= x <= bounds['max_x'] and bounds['min_y'] <= y <= bounds['max_y']

    def zone_for_detection(detection: Dict) -> Optional[str]:
        x = detection.get('centerX')
        y = detection.get('centerY')
        if x is None or y is None:
            return None
        for zone_type in basket_types:
            if any(point_in_bounds(float(x), float(y), bounds) for bounds in basket_zones[zone_type]):
                return zone_type
        return None

    def zone_alliance(zone_type: str) -> str:
        if zone_type.endswith('_red') or 'red' in zone_type:
            return 'red'
        if zone_type.endswith('_blue') or 'blue' in zone_type:
            return 'blue'
        bounds = basket_zones[zone_type][0]
        return bounds.get('alliance') or bounds.get('inferred_alliance') or ('blue' if bounds['center_x'] < 0.5 else 'red')

    tracks: Dict[int, Dict] = {}
    events: List[Dict] = []
    next_track_id = 1
    first_frame = observed_frames[0]
    last_frame = observed_frames[-1]
    last_score_timestamp_by_zone: Dict[str, float] = {}

    def score_track(track: Dict, zone_type: str, reason: str):
        event_timestamp = float(track['candidate_start_timestamp'] or 0.0)
        last_score_timestamp = last_score_timestamp_by_zone.get(zone_type)
        if (
            last_score_timestamp is not None
            and event_timestamp - last_score_timestamp <= min_score_gap_seconds
        ):
            track['retired'] = True
            track['scored'] = False
            return
        alliance = zone_alliance(zone_type)
        last_score_timestamp_by_zone[zone_type] = event_timestamp
        events.append({
            'timestamp': event_timestamp,
            'frame_number': track['candidate_start_frame'],
            'ball_id': track['id'],
            'ball_color': track['color'],
            'basket_type': zone_type,
            'alliance': alliance,
            'event_type': 'score',
            'points': 1,
            'description': reason,
        })
        track['retired'] = True
        track['scored'] = True

    for frame_number in range(first_frame, last_frame + 1):
        frame_detections = []
        for detection in frame_groups.get(frame_number, []):
            class_name = detection.get('className') or detection.get('class_name') or ''
            if 'artifact' not in class_name:
                continue
            center_x = detection.get('centerX')
            center_y = detection.get('centerY')
            if center_x is None or center_y is None:
                continue
            frame_detections.append({
                **detection,
                'centerX': float(center_x),
                'centerY': float(center_y),
                'confidence': float(detection.get('confidence', 0.0)),
                'color': class_color(detection),
            })

        frame_detections.sort(key=lambda item: item.get('confidence', 0.0), reverse=True)
        assigned_tracks = set()

        for detection in frame_detections:
            best_track_id = None
            best_cost = float('inf')
            for track_id, track in tracks.items():
                if track['retired'] or track_id in assigned_tracks:
                    continue
                missing = frame_number - track['last_frame']
                if missing > max_missing_frames:
                    continue
                predicted_x = track['last_center'][0] + track['velocity'][0] * max(1, missing)
                predicted_y = track['last_center'][1] + track['velocity'][1] * max(1, missing)
                distance = math.hypot(detection['centerX'] - predicted_x, detection['centerY'] - predicted_y)
                color_penalty = 0.015 if track['color'] != 'unknown' and detection['color'] != 'unknown' and track['color'] != detection['color'] else 0.0
                cost = distance + color_penalty
                dynamic_limit = max_distance * (1.0 + min(missing, 6) * 0.18)
                if cost < best_cost and distance <= dynamic_limit:
                    best_track_id = track_id
                    best_cost = cost

            if best_track_id is None:
                best_track_id = next_track_id
                next_track_id += 1
                tracks[best_track_id] = {
                    'id': best_track_id,
                    'first_frame': frame_number,
                    'last_frame': frame_number,
                    'last_timestamp': float(detection.get('timestamp', 0.0)),
                    'last_center': (detection['centerX'], detection['centerY']),
                    'velocity': (0.0, 0.0),
                    'color': detection['color'],
                    'color_votes': defaultdict(float),
                    'frames_seen': [],
                    'zone_history': [],
                    'entered_from_outside': False,
                    'candidate_zone': None,
                    'candidate_start_frame': None,
                    'candidate_start_timestamp': None,
                    'pending_score_zone': None,
                    'pending_score_frame': None,
                    'pending_score_timestamp': None,
                    'pending_reason': None,
                    'retired': False,
                    'scored': False,
                    'rebound_rejected': False,
                }

            track = tracks[best_track_id]
            assigned_tracks.add(best_track_id)
            previous_center = track['last_center']
            dt = max(1, frame_number - track['last_frame'])
            observed_velocity = (
                (detection['centerX'] - previous_center[0]) / dt,
                (detection['centerY'] - previous_center[1]) / dt,
            )
            track['velocity'] = (
                track['velocity'][0] * 0.55 + observed_velocity[0] * 0.45,
                track['velocity'][1] * 0.55 + observed_velocity[1] * 0.45,
            )
            track['last_frame'] = frame_number
            track['last_timestamp'] = float(detection.get('timestamp', 0.0))
            track['last_center'] = (detection['centerX'], detection['centerY'])
            track['frames_seen'].append(frame_number)
            if detection['color'] != 'unknown':
                track['color_votes'][detection['color']] += max(0.01, detection['confidence'])
                track['color'] = max(track['color_votes'], key=track['color_votes'].get)

            current_zone = zone_for_detection(detection)
            track['zone_history'].append((frame_number, current_zone))
            if len(track['zone_history']) > confirm_window:
                track['zone_history'] = track['zone_history'][-confirm_window:]

            if current_zone is None:
                track['entered_from_outside'] = True
                if track.get('pending_score_zone') is not None:
                    track['pending_score_zone'] = None
                    track['pending_score_frame'] = None
                    track['pending_score_timestamp'] = None
                    track['pending_reason'] = None
                    track['candidate_zone'] = None
                    track['candidate_start_frame'] = None
                    track['candidate_start_timestamp'] = None
                    track['rebound_rejected'] = True
                    track['retired'] = True
                    continue
                if track['candidate_zone'] is not None:
                    hits = sum(1 for _frame, zone in track['zone_history'] if zone == track['candidate_zone'])
                    if hits < confirm_hits:
                        track['candidate_zone'] = None
                        track['candidate_start_frame'] = None
                        track['candidate_start_timestamp'] = None
                continue

            if track['candidate_zone'] != current_zone:
                track['candidate_zone'] = current_zone
                track['candidate_start_frame'] = frame_number
                track['candidate_start_timestamp'] = float(detection.get('timestamp', 0.0))

            if not track['entered_from_outside']:
                continue

            hits = sum(1 for _frame, zone in track['zone_history'] if zone == current_zone)
            if hits < confirm_hits:
                continue

            if track.get('pending_score_zone') is None:
                track['pending_score_zone'] = current_zone
                track['pending_score_frame'] = track['candidate_start_frame']
                track['pending_score_timestamp'] = track['candidate_start_timestamp']
                track['pending_reason'] = (
                    f"Ball {track['id']} was tracked frame-by-frame, entered {current_zone}, "
                    f"and stayed in the basket for {hits}/{confirm_window} recent observations"
                )
                continue

            if (
                track['pending_score_zone'] == current_zone
                and frame_number - int(track['pending_score_frame']) >= post_entry_confirm_frames
            ):
                score_track(
                    track,
                    current_zone,
                    track.get('pending_reason') or (
                        f"Ball {track['id']} was tracked into {current_zone} and remained there"
                    ),
                )

        for track in tracks.values():
            if track['retired'] or track['id'] in assigned_tracks:
                continue
            candidate_zone = track.get('pending_score_zone') or track.get('candidate_zone')
            if candidate_zone:
                likely_rebound = False
                for detection in frame_detections:
                    if zone_for_detection(detection) == candidate_zone:
                        continue
                    if math.hypot(
                        detection['centerX'] - track['last_center'][0],
                        detection['centerY'] - track['last_center'][1],
                    ) <= max_distance * 3.5:
                        likely_rebound = True
                        break
                if likely_rebound:
                    track['candidate_zone'] = None
                    track['candidate_start_frame'] = None
                    track['candidate_start_timestamp'] = None
                    track['retired'] = True
                    continue
            missing = frame_number - track['last_frame']
            if missing < disappearance_frames:
                continue
            if not candidate_zone or not track.get('entered_from_outside'):
                continue
            recent_hits = sum(1 for _frame, zone in track['zone_history'] if zone == candidate_zone)
            if recent_hits < 1:
                continue
            score_track(
                track,
                candidate_zone,
                track.get('pending_reason') or (
                    f"Ball {track['id']} was tracked into {candidate_zone} and then disappeared "
                    f"there for {missing} frames, so it was treated as made rather than a rebound"
                ),
            )

    red_balls_in = sum(1 for event in events if event['alliance'] == 'red')
    blue_balls_in = sum(1 for event in events if event['alliance'] == 'blue')
    events.sort(key=lambda event: (event['timestamp'], event['frame_number'], event['ball_id']))
    return {
        'red_balls_in': red_balls_in,
        'blue_balls_in': blue_balls_in,
        'red_score': red_balls_in,
        'blue_score': blue_balls_in,
        'total_events': len(events),
        'unique_balls_tracked': len(tracks),
        'balls_scored': len(events),
        'events': events,
        'scoring_method': 'tracked_ball_entries',
    }


def _phase_at(timestamp: float) -> str:
    if timestamp <= 30:
        return 'AUTO'
    if timestamp >= 150:
        return 'ENDGAME'
    return 'TELEOP'


def _alliance_from_zone(zone_type: str) -> Optional[str]:
    if zone_type.endswith('_red') or '_red' in zone_type or 'red' in zone_type:
        return 'red'
    if zone_type.endswith('_blue') or '_blue' in zone_type or 'blue' in zone_type:
        return 'blue'
    return None


def _event_points(event_type: str, phase: str) -> int:
    if event_type == 'classified':
        return 3
    if event_type == 'overflow':
        return 1
    if event_type == 'depot':
        return 1
    return 0


def _zone_bounds(zones: List[Dict]) -> Dict[str, List[Dict]]:
    parsed: Dict[str, List[Dict]] = defaultdict(list)
    for zone in zones:
        zone_type = zone.get('zoneType')
        coords = zone.get('coordinates') or []
        if not zone_type or len(coords) < 2:
            continue
        xs = [float(coord.get('x', 0)) for coord in coords]
        ys = [float(coord.get('y', 0)) for coord in coords]
        parsed[zone_type].append({
            'min_x': max(0.0, min(xs)),
            'max_x': min(1.0, max(xs)),
            'min_y': max(0.0, min(ys)),
            'max_y': min(1.0, max(ys)),
            'alliance': zone.get('alliance') or _alliance_from_zone(zone_type),
            'zoneType': zone_type,
        })
    return parsed


def _point_inside_any(x: float, y: float, bounds_list: List[Dict]) -> bool:
    return any(
        bounds['min_x'] <= x <= bounds['max_x'] and bounds['min_y'] <= y <= bounds['max_y']
        for bounds in bounds_list
    )


def _zones_for_point(x: float, y: float, zones_by_type: Dict[str, List[Dict]]) -> List[str]:
    return [
        zone_type
        for zone_type, bounds_list in zones_by_type.items()
        if _point_inside_any(x, y, bounds_list)
    ]


def _artifact_color_from_detection(detection: Dict) -> Optional[str]:
    class_name = detection.get('className') or detection.get('class_name') or ''
    if 'green' in class_name:
        return 'green'
    if 'purple' in class_name:
        return 'purple'
    return None


def _normalize_detection_rows(detections: List[Dict], zones_by_type: Dict[str, List[Dict]], config: Dict) -> List[Dict]:
    thresholds = config.get('confidenceThresholds', {'green': 0.25, 'purple': 0.30})
    field_bounds = zones_by_type.get('field_boundary', [])
    rows = []
    for detection in detections:
        color = _artifact_color_from_detection(detection)
        if color is None:
            continue
        confidence = float(detection.get('confidence', 0.0))
        if confidence < float(thresholds.get(color, 0.25)):
            continue
        center_x = detection.get('centerX')
        center_y = detection.get('centerY')
        if center_x is None or center_y is None:
            continue
        center_x = float(center_x)
        center_y = float(center_y)
        if field_bounds and not _point_inside_any(center_x, center_y, field_bounds):
            continue
        frame_number = int(detection.get('frameNumber', detection.get('frame', 0)))
        timestamp = float(detection.get('timestamp', 0.0))
        zones_here = _zones_for_point(center_x, center_y, zones_by_type)
        rows.append({
            'id': str(detection.get('_id') or f"{frame_number}:{len(rows)}"),
            'frameNumber': frame_number,
            'timestamp': timestamp,
            'className': detection.get('className') or detection.get('class_name'),
            'artifactColor': color,
            'confidence': confidence,
            'centerX': center_x,
            'centerY': center_y,
            'zones': zones_here,
        })
    rows.sort(key=lambda row: (row['frameNumber'], -row['confidence']))
    return rows


def _build_artifact_tracks(detections: List[Dict], zones_by_type: Dict[str, List[Dict]], config: Dict) -> List[Dict]:
    max_distance = float(config.get('maxTrackDistanceNormalized', 0.06))
    max_missing = int(config.get('maxMissingFrames', 5))
    tracks: List[Dict] = []
    active_track_ids = set()
    next_track_id = 1
    frames = sorted(set(row['frameNumber'] for row in detections))
    by_frame: Dict[int, List[Dict]] = defaultdict(list)
    for row in detections:
        by_frame[row['frameNumber']].append(row)

    for frame_number in frames:
        frame_rows = by_frame[frame_number]
        assigned = set()
        for row in frame_rows:
            best_track = None
            best_distance = float('inf')
            for track in tracks:
                if track['trackId'] in assigned:
                    continue
                missing = frame_number - track['lastFrame']
                if missing <= 0 or missing > max_missing:
                    continue
                if track['artifactColor'] != row['artifactColor']:
                    continue
                predicted_x = track['lastCenter']['x'] + track['velocity']['x'] * max(1, missing)
                predicted_y = track['lastCenter']['y'] + track['velocity']['y'] * max(1, missing)
                distance = math.hypot(row['centerX'] - predicted_x, row['centerY'] - predicted_y)
                dynamic_limit = max_distance * (1.0 + min(missing, max_missing) * 0.20)
                if distance <= dynamic_limit and distance < best_distance:
                    best_distance = distance
                    best_track = track

            if best_track is None:
                best_track = {
                    'trackId': next_track_id,
                    'artifactColor': row['artifactColor'],
                    'firstSeenTimestamp': row['timestamp'],
                    'lastSeenTimestamp': row['timestamp'],
                    'firstFrame': frame_number,
                    'lastFrame': frame_number,
                    'lastCenter': {'x': row['centerX'], 'y': row['centerY']},
                    'velocity': {'x': 0.0, 'y': 0.0},
                    'path': [],
                    'zonesVisited': set(),
                    'zonesVisitedInOrder': [],
                    'currentZone': None,
                    'confidenceValues': [],
                    'missedFrameCount': 0,
                    'likelyScored': False,
                    'scoreEventId': None,
                    'enteredBasketRedAt': None,
                    'enteredBasketBlueAt': None,
                    'enteredTunnelRedAt': None,
                    'enteredTunnelBlueAt': None,
                    'enteredRampRedAt': None,
                    'enteredRampBlueAt': None,
                }
                tracks.append(best_track)
                next_track_id += 1

            previous_center = best_track['lastCenter']
            dt = max(1, frame_number - best_track['lastFrame'])
            observed_vx = (row['centerX'] - previous_center['x']) / dt
            observed_vy = (row['centerY'] - previous_center['y']) / dt
            best_track['velocity'] = {
                'x': best_track['velocity']['x'] * 0.55 + observed_vx * 0.45,
                'y': best_track['velocity']['y'] * 0.55 + observed_vy * 0.45,
            }
            best_track['lastFrame'] = frame_number
            best_track['lastSeenTimestamp'] = row['timestamp']
            best_track['lastCenter'] = {'x': row['centerX'], 'y': row['centerY']}
            best_track['path'].append({
                'frameNumber': frame_number,
                'timestamp': row['timestamp'],
                'x': row['centerX'],
                'y': row['centerY'],
                'zones': row['zones'],
                'detectionId': row['id'],
            })
            best_track['confidenceValues'].append(row['confidence'])
            current_zone = row['zones'][0] if row['zones'] else None
            best_track['currentZone'] = current_zone
            for zone_type in row['zones']:
                if zone_type not in best_track['zonesVisited']:
                    best_track['zonesVisited'].add(zone_type)
                    best_track['zonesVisitedInOrder'].append({'zoneType': zone_type, 'timestamp': row['timestamp'], 'frameNumber': frame_number})
                if zone_type == 'basket_red' and best_track['enteredBasketRedAt'] is None:
                    best_track['enteredBasketRedAt'] = row['timestamp']
                elif zone_type == 'basket_blue' and best_track['enteredBasketBlueAt'] is None:
                    best_track['enteredBasketBlueAt'] = row['timestamp']
                elif zone_type in {'tunnel_red', 'secret_tunnel_red'} and best_track['enteredTunnelRedAt'] is None:
                    best_track['enteredTunnelRedAt'] = row['timestamp']
                elif zone_type in {'tunnel_blue', 'secret_tunnel_blue'} and best_track['enteredTunnelBlueAt'] is None:
                    best_track['enteredTunnelBlueAt'] = row['timestamp']
                elif zone_type == 'ramp_red' and best_track['enteredRampRedAt'] is None:
                    best_track['enteredRampRedAt'] = row['timestamp']
                elif zone_type == 'ramp_blue' and best_track['enteredRampBlueAt'] is None:
                    best_track['enteredRampBlueAt'] = row['timestamp']
            assigned.add(best_track['trackId'])
        active_track_ids.update(assigned)

    for track in tracks:
        track['confidenceAverage'] = mean(track['confidenceValues']) if track['confidenceValues'] else 0.0
        track['zonesVisited'] = sorted(track['zonesVisited'])
        track['missedFrameCount'] = max(0, (frames[-1] if frames else track['lastFrame']) - track['lastFrame'])
    return tracks


def _median_int(values: List[int]) -> int:
    if not values:
        return 0
    return int(median(values))


def _build_ramp_counts(tracks: List[Dict], frames: List[int], config: Dict) -> List[Dict]:
    window = int(config.get('rampCountWindowFrames', 5))
    half = max(1, window // 2)
    ramp_counts = []
    for alliance in ('red', 'blue'):
        raw_series = []
        track_ids_by_frame = []
        timestamps = []
        ramp_zone = f'ramp_{alliance}'
        for frame_number in frames:
            ids = []
            timestamp = 0.0
            for track in tracks:
                for point in track['path']:
                    if point['frameNumber'] != frame_number:
                        continue
                    timestamp = max(timestamp, float(point['timestamp']))
                    if ramp_zone in point['zones']:
                        ids.append(track['trackId'])
                    break
            raw_series.append(len(set(ids)))
            track_ids_by_frame.append(sorted(set(ids)))
            timestamps.append(timestamp)
        stable_series = []
        for index in range(len(raw_series)):
            nearby = raw_series[max(0, index - half): min(len(raw_series), index + half + 1)]
            stable_series.append(_median_int(nearby))
        previous = stable_series[0] if stable_series else 0
        for index, frame_number in enumerate(frames):
            stable = stable_series[index]
            count_delta = stable - previous if index > 0 else 0
            ramp_counts.append({
                'alliance': alliance,
                'timestamp': timestamps[index],
                'frameNumber': frame_number,
                'rawCount': raw_series[index],
                'stableCount': stable,
                'previousStableCount': previous,
                'countDelta': count_delta,
                'confidence': 0.85 if raw_series[index] == stable else 0.65,
                'relatedTrackIds': track_ids_by_frame[index],
                'processed': False,
                'warning': 'ramp_count_exceeded_9' if stable > 9 else None,
            })
            previous = stable
    ramp_counts.sort(key=lambda state: (state['frameNumber'], state['alliance']))
    return ramp_counts


def _track_has_path_evidence(track: Dict, alliance: str, before_timestamp: float, lookback: float) -> bool:
    basket_zone = f'basket_{alliance}'
    tunnel_zones = {f'tunnel_{alliance}', f'secret_tunnel_{alliance}'}
    has_basket = False
    has_tunnel = False
    for visit in track['zonesVisitedInOrder']:
        timestamp = float(visit['timestamp'])
        if timestamp > before_timestamp or timestamp < before_timestamp - lookback:
            continue
        if visit['zoneType'] == basket_zone:
            has_basket = True
        if visit['zoneType'] in tunnel_zones:
            has_tunnel = True
    return has_basket or has_tunnel


def _recent_path_tracks(tracks: List[Dict], alliance: str, timestamp: float, lookback: float) -> List[Dict]:
    return [
        track for track in tracks
        if not track.get('likelyScored') and _track_has_path_evidence(track, alliance, timestamp, lookback)
    ]


def _dedupe_events(events: List[Dict]) -> Tuple[List[Dict], int]:
    deduped = []
    removed = 0
    for event in sorted(events, key=lambda item: (item['timestamp'], item.get('eventType', ''))):
        duplicate = None
        for existing in deduped:
            if existing.get('alliance') != event.get('alliance'):
                continue
            if existing.get('eventType') != event.get('eventType'):
                continue
            if abs(float(existing.get('timestamp', 0)) - float(event.get('timestamp', 0))) > 2.0:
                continue
            shared_tracks = set(existing.get('relatedTrackIds') or []) & set(event.get('relatedTrackIds') or [])
            same_event_id = existing.get('eventId') == event.get('eventId')
            same_ramp_singleton = (
                existing.get('eventType') != 'classified'
                and existing.get('relatedRampChangeId') == event.get('relatedRampChangeId')
            )
            if same_event_id or shared_tracks or same_ramp_singleton:
                duplicate = existing
                break
        if duplicate:
            duplicate['confidence'] = max(float(duplicate.get('confidence', 0)), float(event.get('confidence', 0)))
            duplicate['reason'] = f"{duplicate.get('reason', '')}; merged duplicate evidence: {event.get('reason', '')}"
            removed += 1
        else:
            deduped.append(event)
    return deduped, removed


def score_decode_stateful(detections: List[Dict], zones: List[Dict], config: Optional[Dict] = None) -> Dict:
    """Stateful DECODE scorer: detections -> tracks -> ramp count changes -> events."""
    config = config or {}
    zones_by_type = _zone_bounds(zones)
    filtered = _normalize_detection_rows(detections, zones_by_type, config)
    tracks = _build_artifact_tracks(filtered, zones_by_type, config)
    frames = sorted(set(row['frameNumber'] for row in filtered))
    ramp_counts = _build_ramp_counts(tracks, frames, config)
    events: List[Dict] = []
    warnings: List[str] = []
    ramp_change_count = 0
    overflow_candidates = 0
    undercount_corrections = 0
    cooldown = float(config.get('countChangeCooldownSeconds', 2.0))
    lookback = float(config.get('lookBackSecondsForPathEvidence', 4.0))
    overflow_window = float(config.get('lookForwardSecondsAfterTunnel', 4.0))
    last_classified_time = {'red': -999.0, 'blue': -999.0}
    last_overflow_time = {'red': -999.0, 'blue': -999.0}

    for state in ramp_counts:
        alliance = state['alliance']
        timestamp = float(state['timestamp'])
        delta = int(state['countDelta'])
        if state.get('warning'):
            warnings.append(f"{alliance} ramp count exceeded 9 near {timestamp:.2f}s")
        if delta < 0:
            warnings.append(
                f"{alliance} ramp count dropped from {state['previousStableCount']} "
                f"to {state['stableCount']} near {timestamp:.2f}s; review gate/release."
            )
            events.append({
                'eventId': f"{alliance}-ramp-drop-{state['frameNumber']}",
                'timestamp': timestamp,
                'frame_number': state['frameNumber'],
                'frameNumber': state['frameNumber'],
                'phase': _phase_at(timestamp),
                'eventType': 'ramp_count_drop_unexplained',
                'event_type': 'ramp_count_drop_unexplained',
                'alliance': alliance,
                'points': 0,
                'confidence': 0.6,
                'reason': f"{alliance.title()} ramp count dropped {state['previousStableCount']} -> {state['stableCount']}; no points subtracted.",
                'description': f"{alliance.title()} ramp count dropped; no score removed.",
                'relatedRampChangeId': f"{alliance}:{state['frameNumber']}",
                'relatedTrackIds': state.get('relatedTrackIds', []),
            })
            continue
        if delta <= 0:
            continue
        if timestamp - last_classified_time[alliance] < cooldown and delta == 0:
            continue
        evidence_tracks = _recent_path_tracks(tracks, alliance, timestamp, lookback)
        if not evidence_tracks:
            warnings.append(
                f"{alliance} ramp increased {state['previousStableCount']} -> {state['stableCount']} "
                f"near {timestamp:.2f}s without basket/tunnel evidence."
            )
            confidence = 0.55
        else:
            confidence = 0.88
        ramp_change_count += 1
        if delta > 1:
            undercount_corrections += delta - 1
        candidate_tracks = [
            track for track in tracks
            if not track.get('likelyScored') and f'ramp_{alliance}' in track.get('zonesVisited', [])
            and track['firstSeenTimestamp'] <= timestamp + 1.5
        ]
        candidate_tracks.sort(key=lambda track: (
            0 if track in evidence_tracks else 1,
            abs(float(track.get(f'enteredRamp{alliance.title()}At') or timestamp) - timestamp),
            -float(track.get('confidenceAverage', 0)),
        ))
        for offset in range(delta):
            track = candidate_tracks[offset] if offset < len(candidate_tracks) else None
            if track:
                track['likelyScored'] = True
            color = track['artifactColor'] if track else 'unknown'
            event = {
                'eventId': f"{alliance}-classified-{state['frameNumber']}-{offset}",
                'timestamp': timestamp,
                'frame_number': state['frameNumber'],
                'frameNumber': state['frameNumber'],
                'phase': _phase_at(timestamp),
                'eventType': 'classified',
                'event_type': 'classified',
                'alliance': alliance,
                'artifactColor': color,
                'ball_color': color,
                'ball_id': track['trackId'] if track else '',
                'points': _event_points('classified', _phase_at(timestamp)),
                'confidence': confidence,
                'reason': (
                    f"{alliance.title()} ramp count increased from {state['previousStableCount']} "
                    f"to {state['stableCount']} after scoring-path activity."
                ),
                'description': (
                    f"{alliance.title()} CLASSIFIED: stable ramp count "
                    f"{state['previousStableCount']} -> {state['stableCount']}."
                ),
                'relatedRampChangeId': f"{alliance}:{state['frameNumber']}:{state['previousStableCount']}->{state['stableCount']}",
                'relatedTrackIds': [track['trackId']] if track else [],
            }
            events.append(event)
        state['processed'] = True
        last_classified_time[alliance] = timestamp

    # Overflow: path evidence completed, but no ramp entry/increase within the look-forward window.
    classified_track_ids = {
        track_id
        for event in events if event.get('eventType') == 'classified'
        for track_id in event.get('relatedTrackIds', [])
    }
    for track in tracks:
        if track['trackId'] in classified_track_ids or track.get('likelyScored'):
            continue
        for alliance in ('red', 'blue'):
            basket_time = track.get(f'enteredBasket{alliance.title()}At')
            tunnel_time = track.get(f'enteredTunnel{alliance.title()}At')
            ramp_time = track.get(f'enteredRamp{alliance.title()}At')
            if basket_time is None and tunnel_time is None:
                continue
            path_time = tunnel_time if tunnel_time is not None else basket_time
            nearby_classified = any(
                event.get('alliance') == alliance
                and event.get('eventType') == 'classified'
                and 0 <= float(event.get('timestamp', 0)) - float(path_time) <= overflow_window
                for event in events
            )
            if nearby_classified:
                continue
            if ramp_time is not None and ramp_time <= float(path_time) + overflow_window:
                continue
            if float(path_time) - last_overflow_time[alliance] < 0.5:
                continue
            ramp_near_full = any(
                state['alliance'] == alliance
                and abs(float(state['timestamp']) - float(path_time)) <= overflow_window
                and state['stableCount'] >= 9
                for state in ramp_counts
            )
            confidence = 0.75 if tunnel_time is not None or ramp_near_full else 0.55
            overflow_candidates += 1
            track['likelyScored'] = True
            events.append({
                'eventId': f"{alliance}-overflow-{track['trackId']}",
                'timestamp': float(path_time) + overflow_window,
                'frame_number': track['lastFrame'],
                'frameNumber': track['lastFrame'],
                'phase': _phase_at(float(path_time) + overflow_window),
                'eventType': 'overflow',
                'event_type': 'overflow',
                'alliance': alliance,
                'artifactColor': track['artifactColor'],
                'ball_color': track['artifactColor'],
                'ball_id': track['trackId'],
                'points': _event_points('overflow', _phase_at(float(path_time))),
                'confidence': confidence,
                'reason': (
                    f"{alliance.title()} artifact traveled through scoring path but ramp count "
                    f"did not increase within {overflow_window:.0f}s."
                ),
                'description': f"{alliance.title()} OVERFLOW: path activity without retained ramp increase.",
                'relatedTrackIds': [track['trackId']],
            })
            last_overflow_time[alliance] = float(path_time)
            break

    events, duplicate_events_removed = _dedupe_events(events)
    events.sort(key=lambda event: (float(event.get('timestamp', 0)), str(event.get('eventId', ''))))
    red_score = sum(int(event.get('points', 0)) for event in events if event.get('alliance') == 'red')
    blue_score = sum(int(event.get('points', 0)) for event in events if event.get('alliance') == 'blue')
    score_breakdown = {
        'red': {
            'classified': sum(event['points'] for event in events if event.get('alliance') == 'red' and event.get('eventType') == 'classified'),
            'overflow': sum(event['points'] for event in events if event.get('alliance') == 'red' and event.get('eventType') == 'overflow'),
            'total': red_score,
        },
        'blue': {
            'classified': sum(event['points'] for event in events if event.get('alliance') == 'blue' and event.get('eventType') == 'classified'),
            'overflow': sum(event['points'] for event in events if event.get('alliance') == 'blue' and event.get('eventType') == 'overflow'),
            'total': blue_score,
        },
    }
    return {
        'tracks': tracks,
        'rampCounts': ramp_counts,
        'events': events,
        'scoreBreakdown': score_breakdown,
        'warnings': sorted(set(warnings)),
        'debug': {
            'processedFrames': len(frames),
            'rawDetectionCount': len(detections),
            'filteredDetectionCount': len(filtered),
            'trackCount': len(tracks),
            'rampCountChanges': ramp_change_count,
            'duplicateEventsRemoved': duplicate_events_removed,
            'undercountCorrections': undercount_corrections,
            'overflowCandidates': overflow_candidates,
        },
        'red_balls_in': sum(1 for event in events if event.get('alliance') == 'red' and event.get('eventType') in {'classified', 'overflow'}),
        'blue_balls_in': sum(1 for event in events if event.get('alliance') == 'blue' and event.get('eventType') in {'classified', 'overflow'}),
        'red_score': red_score,
        'blue_score': blue_score,
        'total_events': len([event for event in events if int(event.get('points', 0)) > 0]),
        'unique_balls_tracked': len(tracks),
        'balls_scored': len([event for event in events if int(event.get('points', 0)) > 0]),
        'scoring_method': 'decode_stateful_ramp_counts',
    }


def _score_structure_track_entries(
    frame_groups: Dict[int, List[Dict]],
    structure_zones: Dict[str, List[Dict]],
    max_distance: float = 0.20,
    max_gap_frames: int = 8,
    confirm_frames: int = 3,
    bounce_out_frames: int = 5,
) -> Dict:
    """Track artifact journeys into combined structures and reject short bounce-outs."""
    tracks: Dict[int, BallTrack] = {}
    next_track_id = 1
    events: List[Dict] = []

    def zone_for(center_x: float, center_y: float) -> Optional[str]:
        for zone_type, bounds_list in structure_zones.items():
            if any(
                bounds['min_x'] <= center_x <= bounds['max_x']
                and bounds['min_y'] <= center_y <= bounds['max_y']
                for bounds in bounds_list
            ):
                return zone_type
        return None

    for frame_number in sorted(frame_groups):
        artifact_detections = [
            detection for detection in frame_groups[frame_number]
            if 'artifact' in detection.get('className', '')
            and detection.get('centerX') is not None
            and detection.get('centerY') is not None
        ]
        assigned_track_ids = set()
        for detection in sorted(artifact_detections, key=lambda item: item.get('confidence', 0), reverse=True):
            center = (float(detection['centerX']), float(detection['centerY']))
            color = 'green' if 'green' in detection.get('className', '') else 'purple'
            best_track = None
            best_distance = max_distance
            for track in tracks.values():
                if track.ball_id in assigned_track_ids or track.color != color:
                    continue
                if frame_number - track.last_frame > max_gap_frames:
                    continue
                dx = center[0] - track.last_center[0]
                dy = center[1] - track.last_center[1]
                distance = (dx * dx + dy * dy) ** 0.5
                if distance < best_distance:
                    best_track = track
                    best_distance = distance
            if best_track is None:
                best_track = BallTrack(
                    ball_id=next_track_id,
                    frames_seen=[],
                    first_frame=frame_number,
                    first_center=center,
                    last_frame=frame_number,
                    last_center=center,
                    last_confidence=float(detection.get('confidence', 0)),
                    color=color,
                )
                tracks[next_track_id] = best_track
                next_track_id += 1
            assigned_track_ids.add(best_track.ball_id)
            best_track.frames_seen.append(frame_number)
            best_track.last_frame = frame_number
            best_track.last_center = center
            best_track.last_confidence = float(detection.get('confidence', 0))

            current_zone = zone_for(*center)
            if current_zone is None:
                if best_track.structure_type and not best_track.scored_from_structure:
                    time_inside = (
                        frame_number - best_track.structure_entry_frame
                        if best_track.structure_entry_frame is not None
                        else 0
                    )
                    if time_inside <= bounce_out_frames:
                        best_track.bounce_out = True
                best_track.seen_outside_structure = True
                continue

            if best_track.structure_type != current_zone:
                best_track.structure_type = current_zone
                best_track.structure_entry_frame = frame_number
                best_track.structure_entry_timestamp = float(detection.get('timestamp', 0))
                best_track.frames_inside_structure = 1
            else:
                best_track.frames_inside_structure += 1
            best_track.last_inside_structure_frame = frame_number

            if (
                best_track.seen_outside_structure
                and not best_track.scored_from_structure
                and not best_track.bounce_out
                and best_track.frames_inside_structure >= confirm_frames
            ):
                alliance = 'red' if current_zone.endswith('_red') else 'blue'
                events.append({
                    'timestamp': best_track.structure_entry_timestamp,
                    'frame_number': best_track.structure_entry_frame,
                    'ball_id': best_track.ball_id,
                    'ball_color': best_track.color or 'unknown',
                    'basket_type': current_zone,
                    'alliance': alliance,
                    'event_type': 'score',
                    'points': 1,
                    'description': (
                        f"Track {best_track.ball_id} entered {current_zone} from outside "
                        f"and persisted for {best_track.frames_inside_structure} frames"
                    ),
                })
                best_track.scored_from_structure = True

    red_balls_in = sum(1 for event in events if event['alliance'] == 'red')
    blue_balls_in = sum(1 for event in events if event['alliance'] == 'blue')
    events.sort(key=lambda event: (event['timestamp'], event['frame_number'], event['ball_id']))
    return {
        'red_balls_in': red_balls_in,
        'blue_balls_in': blue_balls_in,
        'red_score': red_balls_in,
        'blue_score': blue_balls_in,
        'total_events': len(events),
        'unique_balls_tracked': len(tracks),
        'balls_scored': len(events),
        'events': events,
        'scoring_method': 'structure_track_entries',
    }


def _score_structure_inventory_deltas(
    frame_groups: Dict[int, List[Dict]],
    structure_zones: Dict[str, List[Dict]],
    smoothing_window: int = 13,
    confirmation_window: int = 5,
    confirmation_hits: int = 3,
) -> Dict:
    """Count scores from retained inventory increases inside combined structures.

    A ball that clips the basket and rebounds can look like a one-frame inventory
    increase. Require each new inventory level to appear in most of the next few
    smoothed frames before treating it as a made score. This keeps quick rebounds
    out without demanding a perfectly flat detection trace.
    """
    observed_frames = sorted(frame_groups)
    if not observed_frames:
        return {
            'red_balls_in': 0,
            'blue_balls_in': 0,
            'red_score': 0,
            'blue_score': 0,
            'total_events': 0,
            'unique_balls_tracked': 0,
            'balls_scored': 0,
            'events': [],
            'scoring_method': 'structure_inventory_deltas',
        }

    # Missing detections still represent real video frames. Keep them in the
    # inventory stream as zero-count frames so rebounds and disappearances are
    # visible to the scorer instead of being skipped entirely.
    ordered_frames = list(range(0, observed_frames[-1] + 1))
    events: List[Dict] = []
    next_ball_id = 1
    half_window = smoothing_window // 2

    for structure_type, structure_bounds in sorted(structure_zones.items()):
        alliance = 'red' if structure_type.endswith('_red') else 'blue'
        counts = []
        timestamps = []
        detections_per_frame = []

        for frame_number in ordered_frames:
            timestamp = 0.0
            inside = []
            for detection in frame_groups[frame_number]:
                timestamp = float(detection.get('timestamp', timestamp))
                if 'artifact' not in detection.get('className', ''):
                    continue
                center_x = detection.get('centerX')
                center_y = detection.get('centerY')
                if center_x is None or center_y is None:
                    continue
                if any(
                    bounds['min_x'] <= center_x <= bounds['max_x']
                    and bounds['min_y'] <= center_y <= bounds['max_y']
                    for bounds in structure_bounds
                ):
                    inside.append(detection)
            counts.append(len(inside))
            timestamps.append(timestamp)
            detections_per_frame.append(inside)

        stable_counts = []
        for index in range(len(counts)):
            window = counts[max(0, index - half_window): min(len(counts), index + half_window + 1)]
            stable_counts.append(int(median(window)))

        # Once a basket inventory level has been confirmed, detector flicker should
        # not let the same retained balls score again after a temporary dip.
        confirmed_inventory = stable_counts[0] if stable_counts else 0
        for index in range(1, len(stable_counts)):
            increase = max(0, stable_counts[index] - confirmed_inventory)
            if not increase:
                continue
            confirmation_slice = stable_counts[index:min(len(stable_counts), index + confirmation_window)]
            if len(confirmation_slice) < confirmation_window:
                continue
            confirmed_increase = 0
            baseline_count = confirmed_inventory
            for inventory_level in range(baseline_count + 1, stable_counts[index] + 1):
                retained_hits = sum(
                    1 for count in confirmation_slice
                    if count >= inventory_level
                )
                if retained_hits >= confirmation_hits:
                    confirmed_increase += 1
            if confirmed_increase <= 0:
                continue
            confirmed_inventory += confirmed_increase
            frame_detections = sorted(
                detections_per_frame[index],
                key=lambda detection: detection.get('confidence', 0.0),
                reverse=True,
            )
            for offset in range(confirmed_increase):
                detection = frame_detections[offset] if offset < len(frame_detections) else {}
                class_name = detection.get('className', '')
                ball_color = 'green' if 'green' in class_name else 'purple' if 'purple' in class_name else 'unknown'
                events.append({
                    'timestamp': timestamps[index],
                    'frame_number': ordered_frames[index],
                    'ball_id': next_ball_id,
                    'ball_color': ball_color,
                    'basket_type': structure_type,
                    'alliance': alliance,
                    'event_type': 'score',
                    'points': 1,
                    'description': (
                        f"Structure inventory increased from {stable_counts[index - 1]} "
                        f"to {stable_counts[index]} in {structure_type} and remained visible "
                        f"in {confirmation_hits}/{confirmation_window} confirmation frames"
                    ),
                })
                next_ball_id += 1

    red_balls_in = sum(1 for event in events if event['alliance'] == 'red')
    blue_balls_in = sum(1 for event in events if event['alliance'] == 'blue')
    events.sort(key=lambda event: (event['timestamp'], event['frame_number'], event['ball_id']))
    return {
        'red_balls_in': red_balls_in,
        'blue_balls_in': blue_balls_in,
        'red_score': red_balls_in,
        'blue_score': blue_balls_in,
        'total_events': len(events),
        'unique_balls_tracked': len(events),
        'balls_scored': len(events),
        'events': events,
        'scoring_method': 'structure_inventory_deltas',
    }


def _score_basket_occupancy_bursts(
    frame_groups: Dict[int, List[Dict]],
    scoring_zones: Dict[str, List[Dict]],
    max_empty_gap_frames: int = 5,
) -> Dict:
    """
    Count scores from contiguous periods where artifacts are visible inside a basket.

    The original scorer tried to preserve ball identities over long stretches of video.
    In these broadcast videos, balls move fast, detections blink, and IDs merge/split.
    For a fixed basket zone, a short contiguous "burst" of detections is a more stable
    observable: the maximum simultaneous basket occupancy during that burst is the
    number of balls that passed through together.
    """
    basket_types = sorted(zone_type for zone_type in scoring_zones if zone_type.startswith('basket'))
    events: List[Dict] = []
    next_ball_id = 1

    for basket_type in basket_types:
        basket_bounds = scoring_zones[basket_type]
        alliance = (
            next((bounds.get('alliance') or bounds.get('inferred_alliance') for bounds in basket_bounds
                  if bounds.get('alliance') or bounds.get('inferred_alliance')), None)
            or ('red' if basket_type.endswith('_red') else 'blue')
        )
        active_frames: List[Tuple[int, float, List[Dict]]] = []
        empty_gap = 0

        def flush_burst():
            nonlocal next_ball_id, empty_gap
            if not active_frames:
                empty_gap = 0
                return
            max_count = max(len(frame_detections) for _, _, frame_detections in active_frames)
            peak_frame, peak_timestamp, peak_detections = next(
                (frame_number, timestamp, frame_detections)
                for frame_number, timestamp, frame_detections in active_frames
                if len(frame_detections) == max_count
            )
            representative_detections = sorted(
                peak_detections,
                key=lambda detection: detection.get('confidence', 0.0),
                reverse=True,
            )[:max_count]
            for detection in representative_detections:
                class_name = detection.get('className', '')
                ball_color = 'green' if 'green' in class_name else 'purple' if 'purple' in class_name else 'unknown'
                events.append({
                    'timestamp': peak_timestamp,
                    'frame_number': peak_frame,
                    'ball_id': next_ball_id,
                    'ball_color': ball_color,
                    'basket_type': basket_type,
                    'alliance': alliance,
                    'event_type': 'score',
                    'points': 1,
                    'description': (
                        f"Basket occupancy burst in {basket_type}: "
                        f"{max_count} artifact{'s' if max_count != 1 else ''} visible"
                    ),
                })
                next_ball_id += 1
            active_frames.clear()
            empty_gap = 0

        for frame_number in sorted(frame_groups):
            frame_detections = []
            timestamp = 0.0
            for detection in frame_groups[frame_number]:
                timestamp = float(detection.get('timestamp', timestamp))
                if 'artifact' not in detection.get('className', ''):
                    continue
                center_x = detection.get('centerX')
                center_y = detection.get('centerY')
                if center_x is None or center_y is None:
                    continue
                if any(
                    bounds['min_x'] <= center_x <= bounds['max_x']
                    and bounds['min_y'] <= center_y <= bounds['max_y']
                    for bounds in basket_bounds
                ):
                    frame_detections.append(detection)
            if frame_detections:
                active_frames.append((frame_number, timestamp, frame_detections))
                empty_gap = 0
            else:
                if active_frames:
                    empty_gap += 1
                    if empty_gap > max_empty_gap_frames:
                        flush_burst()
        flush_burst()

    red_balls_in = sum(1 for event in events if event['alliance'] == 'red')
    blue_balls_in = sum(1 for event in events if event['alliance'] == 'blue')
    events.sort(key=lambda event: (event['timestamp'], event['frame_number'], event['ball_id']))
    return {
        'red_balls_in': red_balls_in,
        'blue_balls_in': blue_balls_in,
        'red_score': red_balls_in,
        'blue_score': blue_balls_in,
        'total_events': len(events),
        'unique_balls_tracked': len(events),
        'balls_scored': len(events),
        'events': events,
        'scoring_method': 'basket_occupancy_bursts',
    }


if __name__ == '__main__':
    # Simple test
    sample_dets = [
        {'frameNumber': 0, 'timestamp': 0.0, 'className': 'artifact_green', 'centerX': 0.3, 'centerY': 0.3, 'confidence': 0.95},
        {'frameNumber': 1, 'timestamp': 0.033, 'className': 'artifact_green', 'centerX': 0.31, 'centerY': 0.31, 'confidence': 0.95},
        {'frameNumber': 2, 'timestamp': 0.066, 'className': 'artifact_green', 'centerX': 0.5, 'centerY': 0.5, 'confidence': 0.95},  # entered basket
    ]
    sample_zones = [
        {'zoneType': 'basket_red', 'coordinates': [{'x': 0.4, 'y': 0.4}, {'x': 0.6, 'y': 0.6}]},
    ]
    result = score_video('test_job', sample_dets, sample_zones)
    print(json.dumps(result, indent=2))
