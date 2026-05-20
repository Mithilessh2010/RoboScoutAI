#!/usr/bin/env python3
"""PyQt6-based Zone Drawer & Local Scorer popup.

Usage:
  source .venv/bin/activate
  python scripts/local/gui_zone_and_run_qt.py --mongo mongodb://localhost:27017 --db test

This is a replacement for the Tkinter GUI; PyQt6 generally renders reliably on macOS.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import traceback
from datetime import datetime
from pathlib import Path

import cv2
from bson import ObjectId
from pymongo import MongoClient

from PyQt6 import QtCore, QtGui, QtWidgets

# Add parent directories to path for local imports
sys.path.insert(0, str(Path(__file__).resolve().parent))
from autoscore_algorithm import score_video


class VideoCanvas(QtWidgets.QLabel):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.pix = None
        self.shapes = []
        self.current = None
        self.mode = 'polygon'
        self.zone_type = 'field_boundary'
        self.alliance = None
        self.index = None

    def set_image(self, qpixmap):
        self.pix = qpixmap
        self.setPixmap(self.pix)

    def mousePressEvent(self, ev: QtGui.QMouseEvent):
        x = ev.position().x()
        y = ev.position().y()
        if self.mode == 'rect':
            self.current = {
                'type': 'rect',
                'start': (x, y),
                'end': (x, y),
                'zoneType': self.zone_type,
                'alliance': self.alliance,
                'index': self.index,
            }
            self.shapes.append(self.current)
        else:
            if not self.current or self.current.get('type') != 'poly':
                self.current = {
                    'type': 'poly',
                    'points': [],
                    'zoneType': self.zone_type,
                    'alliance': self.alliance,
                    'index': self.index,
                }
                self.shapes.append(self.current)
            self.current['points'].append((x, y))
        self.update()

    def mouseMoveEvent(self, ev: QtGui.QMouseEvent):
        if not self.current:
            return
        if self.current['type'] == 'rect':
            self.current['end'] = (ev.position().x(), ev.position().y())
        self.update()

    def mouseDoubleClickEvent(self, ev: QtGui.QMouseEvent):
        self.current = None
        self.update()

    def paintEvent(self, ev: QtGui.QPaintEvent):
        super().paintEvent(ev)
        if not self.pix:
            return
        painter = QtGui.QPainter(self)
        for s in self.shapes:
            zone_type = s.get('zoneType', '')
            alliance = s.get('alliance', '') or ''
            color = self._zone_color(zone_type, alliance)
            pen = QtGui.QPen(color)
            pen.setWidth(3)
            painter.setPen(pen)
            brush = QtGui.QBrush(QtGui.QColor(color.red(), color.green(), color.blue(), 50))
            painter.setBrush(brush)
            if s['type'] == 'rect':
                x1, y1 = s['start']; x2, y2 = s['end']
                rect = QtCore.QRectF(QtCore.QPointF(x1, y1), QtCore.QPointF(x2, y2))
                painter.drawRect(rect)
                self._draw_label(painter, rect.topLeft(), zone_type)
            else:
                pts = [QtCore.QPointF(x, y) for (x, y) in s['points']]
                if pts:
                    poly = QtGui.QPolygonF(pts)
                    painter.drawPolygon(poly)
                    self._draw_label(painter, poly.boundingRect().topLeft(), zone_type)

    def _zone_color(self, zone_type: str, alliance: str) -> QtGui.QColor:
        if 'depot' in zone_type:
            return QtGui.QColor('#b86bff')
        if 'ramp' in zone_type:
            return QtGui.QColor('#f59e0b')
        if 'tunnel' in zone_type:
            return QtGui.QColor('#eab308')
        if 'base' in zone_type:
            return QtGui.QColor('#a78bfa')
        if 'basket' in zone_type or 'goal' in zone_type or 'structure' in zone_type:
            return QtGui.QColor('#22c55e') if alliance not in {'red', 'blue'} else QtGui.QColor('#ef4444' if alliance == 'red' else '#3b82f6')
        if 'field_boundary' in zone_type:
            return QtGui.QColor('#eab308')
        return QtGui.QColor('lime')

    def _draw_label(self, painter: QtGui.QPainter, point: QtCore.QPointF, label: str):
        if not label:
            return
        label = {
            'basket_red': 'Red Basket',
            'basket_blue': 'Blue Basket',
            'tunnel_red': 'Red Secret Tunnel',
            'tunnel_blue': 'Blue Secret Tunnel',
            'ramp_red': 'Red Ramp',
            'ramp_blue': 'Blue Ramp',
            'base_red': 'Red Base',
            'base_blue': 'Blue Base',
            'field_boundary': 'Field Boundary',
        }.get(label, label)
        painter.save()
        painter.setPen(QtGui.QPen(QtGui.QColor('white')))
        painter.setBrush(QtGui.QBrush(QtGui.QColor(0, 0, 0, 180)))
        metrics = painter.fontMetrics()
        rect = QtCore.QRectF(metrics.boundingRect(label))
        rect.adjust(-4, -2, 4, 2)
        rect.moveTo(point.x() + 4, point.y() + 4)
        painter.drawRoundedRect(rect, 4, 4)
        painter.drawText(rect.adjusted(4, 2, -4, -2), label)
        painter.restore()


class ZoneDrawerWindow(QtWidgets.QWidget):
    def __init__(self, mongo_uri, db_name):
        super().__init__()
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client[self.db_name]
        self.scoring_in_progress = False

        self.setWindowTitle('Zone Drawer & Local Scorer (PyQt)')
        self.resize(1100, 800)

        layout = QtWidgets.QVBoxLayout(self)

        top = QtWidgets.QHBoxLayout()
        self.job_cb = QtWidgets.QComboBox(); top.addWidget(self.job_cb)
        refresh_btn = QtWidgets.QPushButton('Refresh Jobs'); refresh_btn.clicked.connect(self.load_jobs); top.addWidget(refresh_btn)
        new_btn = QtWidgets.QPushButton('New Job'); new_btn.clicked.connect(self.create_job); top.addWidget(new_btn)
        layout.addLayout(top)

        mid = QtWidgets.QHBoxLayout()
        self.video_edit = QtWidgets.QLineEdit(); mid.addWidget(self.video_edit)
        browse = QtWidgets.QPushButton('Browse'); browse.clicked.connect(self.browse_video); mid.addWidget(browse)
        mid.addWidget(QtWidgets.QLabel('Frame (s):'))
        self.frame_edit = QtWidgets.QLineEdit('1.0'); self.frame_edit.setFixedWidth(80); mid.addWidget(self.frame_edit)
        loadf = QtWidgets.QPushButton('Load Frame'); loadf.clicked.connect(self.load_frame); mid.addWidget(loadf)
        mid.addWidget(QtWidgets.QLabel('Detect FPS:'))
        self.detect_fps_edit = QtWidgets.QLineEdit('native / every frame')
        self.detect_fps_edit.setReadOnly(True)
        self.detect_fps_edit.setFixedWidth(130)
        mid.addWidget(self.detect_fps_edit)
        layout.addLayout(mid)

        opts = QtWidgets.QHBoxLayout()
        self.mode_group = QtWidgets.QButtonGroup(self)
        r1 = QtWidgets.QRadioButton('Polygon'); r1.setChecked(True); r2 = QtWidgets.QRadioButton('Rectangle')
        self.mode_group.addButton(r1); self.mode_group.addButton(r2)
        opts.addWidget(r1); opts.addWidget(r2)
        self.mode_group.buttonClicked.connect(self.on_mode_change)
        opts.addWidget(QtWidgets.QLabel('ZoneType:'))
        self.zone_type = QtWidgets.QComboBox()
        self.zone_type.addItems([
            'field_boundary',
            'basket_red', 'basket_blue',
            'tunnel_red', 'tunnel_blue',
            'ramp_red', 'ramp_blue',
            'base_red', 'base_blue',
            'depot_red', 'depot_blue',
        ])
        opts.addWidget(self.zone_type)
        opts.addWidget(QtWidgets.QLabel('Alliance:'))
        self.alliance = QtWidgets.QComboBox(); self.alliance.addItems(['', 'red', 'blue']); opts.addWidget(self.alliance)
        opts.addWidget(QtWidgets.QLabel('Index:'))
        self.index_edit = QtWidgets.QLineEdit('0'); self.index_edit.setFixedWidth(60); opts.addWidget(self.index_edit)
        layout.addLayout(opts)

        self.canvas = VideoCanvas()
        self.canvas.setFixedSize(960, 540)
        self.canvas.zone_type = self.zone_type.currentText()
        self.canvas.alliance = self.alliance.currentText() or None
        self.canvas.index = int(self.index_edit.text()) if self.index_edit.text() else None
        layout.addWidget(self.canvas)

        bottom = QtWidgets.QHBoxLayout()
        clear = QtWidgets.QPushButton('Clear Shapes'); clear.clicked.connect(self.clear_shapes); bottom.addWidget(clear)
        load_saved = QtWidgets.QPushButton('Load Saved Zones'); load_saved.clicked.connect(self.load_saved_zones); bottom.addWidget(load_saved)
        auto_structures = QtWidgets.QPushButton('Suggest Basket Areas'); auto_structures.clicked.connect(self.auto_detect_structures); bottom.addWidget(auto_structures)
        save = QtWidgets.QPushButton('Save Zones'); save.clicked.connect(self.save_zones); bottom.addWidget(save)
        self.run_btn = QtWidgets.QPushButton('Run Local Scoring'); self.run_btn.clicked.connect(self.run_scoring); bottom.addWidget(self.run_btn)
        clear_all = QtWidgets.QPushButton('Clear All Data'); clear_all.clicked.connect(self.clear_all_data); bottom.addWidget(clear_all)
        layout.addLayout(bottom)

        self.load_jobs()

        self.zone_type.currentTextChanged.connect(self._sync_canvas_metadata)
        self.alliance.currentTextChanged.connect(self._sync_canvas_metadata)
        self.index_edit.textChanged.connect(self._sync_canvas_metadata)

    def on_mode_change(self, btn):
        text = btn.text().lower()
        self.canvas.mode = 'rect' if 'rect' in text else 'polygon'

    def _sync_canvas_metadata(self, *args):
        self.canvas.zone_type = self.zone_type.currentText()
        self.canvas.alliance = self.alliance.currentText() or None
        try:
            self.canvas.index = int(self.index_edit.text()) if self.index_edit.text().strip() else None
        except ValueError:
            self.canvas.index = None

    def load_jobs(self):
        self.job_cb.clear()
        docs = list(self.db.autoscorejobs.find({}, {'videoName':1}).sort('createdAt', -1).limit(50))
        for d in docs:
            self.job_cb.addItem(f"{d['_id']} - {d.get('videoName') or ''}")

    def create_job(self, name=None):
        if name is None:
            text, ok = QtWidgets.QInputDialog.getText(self, 'New Job', 'Job name:')
            if not ok or not text.strip():
                return
            name = text.strip()
        now = datetime.utcnow()
        self.db.autoscorejobs.insert_one({'status': 'pending', 'videoName': name, 'createdAt': now, 'updatedAt': now})
        self.load_jobs()
        if self.job_cb.count():
            self.job_cb.setCurrentIndex(0)

    def clear_all_data(self):
        reply = QtWidgets.QMessageBox.question(self, 'Confirm', 'Clear jobs/detections/events but keep saved local detection areas?', QtWidgets.QMessageBox.StandardButton.Yes | QtWidgets.QMessageBox.StandardButton.No)
        if reply == QtWidgets.QMessageBox.StandardButton.Yes:
            for collection in [
                'autoscorejobs',
                'autoscoredetections',
                'autoscoreevents',
                'autoscoretimelineevents',
                'autoscoresummaries',
                'autoscorepenalties',
                'autoscoregateevents',
                'autoscorerampcountstates',
                'autoscoremanualscorings',
                'autoscoretrackedartifacts',
            ]:
                self.db[collection].delete_many({})
            self.load_jobs()
            QtWidgets.QMessageBox.information(self, 'Done', 'Cleared old scoring data. Local saved areas were kept.')

    def browse_video(self):
        path, _ = QtWidgets.QFileDialog.getOpenFileName(self, 'Select video')
        if path:
            self.video_edit.setText(path)

    def load_frame(self):
        path = self.video_edit.text().strip()
        if not path or not os.path.exists(path):
            QtWidgets.QMessageBox.critical(self, 'Error', 'Video not found')
            return
        
        ts = float(self.frame_edit.text())
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            QtWidgets.QMessageBox.critical(self, 'Error', 'Could not open video')
            return
        cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000)
        ok, frame = cap.read()
        cap.release()
        if not ok:
            QtWidgets.QMessageBox.critical(self, 'Error', 'Could not read frame')
            return
        h, w = frame.shape[:2]
        scale = min(self.canvas.width() / w, self.canvas.height() / h)
        nw, nh = int(w*scale), int(h*scale)
        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (nw, nh))
        qimg = QtGui.QImage(img.data, nw, nh, img.strides[0], QtGui.QImage.Format.Format_RGB888)
        pix = QtGui.QPixmap.fromImage(qimg)
        self.canvas.set_image(pix)
        self.load_saved_zones(silent=True)

    def clear_shapes(self):
        self.canvas.shapes = []
        self.canvas.current = None
        self.canvas.update()

    def load_saved_zones(self, silent=False):
        if self._load_zones_from_local_cache(silent=silent):
            return True

        job_sel = self.job_cb.currentText()
        pixmap = self.canvas.pix
        if not job_sel or not pixmap:
            if not silent:
                QtWidgets.QMessageBox.information(self, 'Load zones', 'No local saved areas found for this video.')
            return False
        try:
            job_obj = ObjectId(job_sel.split(' - ', 1)[0])
        except Exception:
            if not silent:
                QtWidgets.QMessageBox.critical(self, 'Load zones', 'Invalid job id')
            return False

        pw = pixmap.width()
        ph = pixmap.height()
        lx = (self.canvas.width() - pw) // 2
        ly = (self.canvas.height() - ph) // 2
        shapes = []
        for zone in self.db.autoscorecalibrationzones.find({'jobId': job_obj}):
            coords = zone.get('coordinates') or []
            if len(coords) < 2:
                continue
            points = [
                (lx + float(coord.get('x', 0)) * pw, ly + float(coord.get('y', 0)) * ph)
                for coord in coords
            ]
            base_shape = {
                'zoneType': zone.get('zoneType'),
                'alliance': zone.get('alliance'),
                'index': zone.get('index'),
                'scoringMode': zone.get('scoringMode'),
            }
            if zone.get('shapeType') == 'rectangle' and len(points) >= 2:
                shapes.append({
                    **base_shape,
                    'type': 'rect',
                    'start': points[0],
                    'end': points[1],
                })
            else:
                shapes.append({
                    **base_shape,
                    'type': 'poly',
                    'points': points,
                })
        self.canvas.shapes = shapes
        self.canvas.current = None
        self.canvas.update()
        if not silent:
            QtWidgets.QMessageBox.information(self, 'Loaded', f'Loaded {len(shapes)} saved zones')
        return bool(shapes)

    def auto_generate_zones(self, frame):
        """
        Create first-pass zones automatically for overhead DECODE views.

        The gray field floor is the largest low-saturation component in the frame.
        Once found, DECODE field structures have stable proportions relative to that
        boundary, which is far less brittle than asking the user to hand-draw every
        basket from scratch.
        """
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, (0, 0, 60), (180, 120, 230))
        count, _labels, stats, _centroids = cv2.connectedComponentsWithStats(mask)
        if count <= 1:
            return False
        x, y, width, height, area = max(stats[1:], key=lambda row: row[4])
        frame_h, frame_w = frame.shape[:2]
        if area < frame_w * frame_h * 0.08:
            return False

        fx1 = x / frame_w
        fy1 = y / frame_h
        fx2 = (x + width) / frame_w
        fy2 = (y + height) / frame_h
        fw = fx2 - fx1
        fh = fy2 - fy1

        normalized_zones = [
            ('field_boundary', None, fx1, fy1, fx2, fy2),
            ('basket_blue', 'blue', fx1 - 0.01 * fw, fy1, fx1 + 0.24 * fw, fy1 + 0.20 * fh),
            ('basket_red', 'red', fx2 - 0.25 * fw, fy1, fx2 + 0.03 * fw, fy1 + 0.20 * fh),
            ('ramp_blue', 'blue', fx1 + 0.02 * fw, fy1 + 0.22 * fh, fx1 + 0.09 * fw, fy1 + 0.57 * fh),
            ('ramp_red', 'red', fx2 - 0.10 * fw, fy1 + 0.22 * fh, fx2 - 0.03 * fw, fy1 + 0.57 * fh),
            ('depot_blue', 'blue', fx1 + 0.09 * fw, fy1 + 0.13 * fh, fx1 + 0.22 * fw, fy1 + 0.28 * fh),
            ('depot_red', 'red', fx2 - 0.22 * fw, fy1 + 0.13 * fh, fx2 - 0.09 * fw, fy1 + 0.28 * fh),
        ]
        self._set_shapes_from_normalized_zones(normalized_zones)
        self.save_zones(show_message=False)
        QtWidgets.QMessageBox.information(
            self,
            'Auto zones created',
            'The app detected the field and created zones automatically. Review them, then run scoring.',
        )
        return True

    def auto_detect_structures(self):
        path = self.video_edit.text().strip()
        if not path or not os.path.exists(path):
            QtWidgets.QMessageBox.critical(self, 'Video', 'Select a valid video first')
            return
        try:
            ts = float(self.frame_edit.text())
        except ValueError:
            QtWidgets.QMessageBox.critical(self, 'Frame', 'Enter a valid frame time')
            return
        root = Path(__file__).resolve().parents[2]
        model_path = root / 'services' / 'video-processing' / 'models' / 'decode' / 'scoring-structure-best.pt'
        if not model_path.exists():
            QtWidgets.QMessageBox.information(
                self,
                'Basket model missing',
                f'Train the basket model first:\n{model_path}',
            )
            return

        cap = cv2.VideoCapture(path)
        cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000)
        ok, frame = cap.read()
        cap.release()
        if not ok:
            QtWidgets.QMessageBox.critical(self, 'Frame', 'Could not read the selected frame')
            return
        try:
            from ultralytics import YOLO
        except Exception as exc:
            QtWidgets.QMessageBox.critical(self, 'Ultralytics', f'Could not import Ultralytics:\n{exc}')
            return

        minimum_basket_confidence = 0.50
        result = YOLO(str(model_path)).predict(frame, conf=0.20, verbose=False)[0]
        raw_detections_by_class = {}
        for box in result.boxes.data.tolist():
            cls_id = int(box[5])
            class_name = result.names.get(cls_id, str(cls_id))
            if class_name not in {'scoring_basket_red', 'scoring_basket_blue'}:
                continue
            confidence = float(box[4])
            raw_detections_by_class.setdefault(class_name, []).append((confidence, [float(v) for v in box[:4]]))
        detections_by_class = {}
        low_confidence_classes = []
        for class_name, class_detections in raw_detections_by_class.items():
            best_confidence = max(confidence for confidence, _bbox in class_detections)
            candidates = [
                (confidence, bbox)
                for confidence, bbox in class_detections
                if confidence >= max(minimum_basket_confidence, best_confidence * 0.75)
            ]
            if not candidates:
                low_confidence_classes.append(class_name)
                continue
            best_confidence = max(confidence for confidence, _bbox in candidates)
            near_best = [
                (confidence, bbox)
                for confidence, bbox in candidates
                if confidence >= max(minimum_basket_confidence, best_confidence * 0.92, best_confidence - 0.07)
            ]
            # The basket model can emit nested boxes. Use the tightest high-confidence
            # box so the scoring zone covers the basket mouth, not the ramp/wall.
            confidence, bbox = min(
                near_best,
                key=lambda item: ((item[1][2] - item[1][0]) * (item[1][3] - item[1][1]), -item[0]),
            )
            detections_by_class[class_name] = (confidence, bbox)
        detections = [
            (class_name, confidence, bbox)
            for class_name, (confidence, bbox) in detections_by_class.items()
        ]
        if not detections:
            QtWidgets.QMessageBox.information(self, 'Auto detect', 'No basket areas were detected on this frame.')
            return

        frame_h, frame_w = frame.shape[:2]
        normalized_zones = []
        for class_name, _confidence, (x1, y1, x2, y2) in detections:
            alliance = 'red' if class_name.endswith('_red') else 'blue'
            normalized_zones.append((
                f'basket_{alliance}',
                alliance,
                x1 / frame_w,
                y1 / frame_h,
                x2 / frame_w,
                y2 / frame_h,
                'inventory',
            ))
        existing = [
            shape for shape in self.canvas.shapes
            if shape.get('zoneType') not in {'basket_red', 'basket_blue', 'structure_red', 'structure_blue'}
        ]
        self.canvas.shapes = existing
        self._append_shapes_from_normalized_zones(normalized_zones)
        low_confidence_note = ""
        if low_confidence_classes:
            low_confidence_note = (
                "\nSkipped low-confidence suggestion for: "
                + ", ".join(sorted(low_confidence_classes))
                + ". Draw that basket manually or try a clearer frame."
            )
        QtWidgets.QMessageBox.information(
            self,
            'Auto detect',
            f'Detected {len(normalized_zones)} editable basket zones. Review them, then save zones.'
            f'{low_confidence_note}',
        )

    def _set_shapes_from_normalized_zones(self, normalized_zones):
        self.canvas.shapes = []
        self._append_shapes_from_normalized_zones(normalized_zones)

    def _append_shapes_from_normalized_zones(self, normalized_zones):
        pixmap = self.canvas.pix
        if not pixmap:
            QtWidgets.QMessageBox.information(self, 'Auto detect', 'Load a frame before suggesting basket areas.')
            return
        pw = pixmap.width()
        ph = pixmap.height()
        lx = (self.canvas.width() - pw) // 2
        ly = (self.canvas.height() - ph) // 2
        for zone in normalized_zones:
            zone_type, alliance, x1, y1, x2, y2, *rest = zone
            self.canvas.shapes.append({
                'type': 'rect',
                'start': (lx + max(0, min(1, x1)) * pw, ly + max(0, min(1, y1)) * ph),
                'end': (lx + max(0, min(1, x2)) * pw, ly + max(0, min(1, y2)) * ph),
                'zoneType': zone_type,
                'alliance': alliance,
                'index': None,
                'scoringMode': rest[0] if rest else None,
            })
        self.canvas.current = None
        self.canvas.update()

    def _safe_video_cache_name(self):
        path = self.video_edit.text().strip()
        stem = Path(path).stem if path else 'untitled_video'
        return re.sub(r'[^A-Za-z0-9._-]+', '_', stem).strip('_') or 'untitled_video'

    def _local_zone_path(self):
        root = Path(__file__).resolve().parents[2]
        directory = root / 'runs' / 'local_zone_cache'
        directory.mkdir(parents=True, exist_ok=True)
        return directory / f'{self._safe_video_cache_name()}.zones.json'

    def _set_shapes_from_zone_records(self, zones):
        pixmap = self.canvas.pix
        if not pixmap:
            return False
        pw = pixmap.width()
        ph = pixmap.height()
        lx = (self.canvas.width() - pw) // 2
        ly = (self.canvas.height() - ph) // 2
        shapes = []
        for zone in zones:
            coords = zone.get('coordinates') or []
            if len(coords) < 2:
                continue
            points = [
                (lx + max(0, min(1, float(coord.get('x', 0)))) * pw,
                 ly + max(0, min(1, float(coord.get('y', 0)))) * ph)
                for coord in coords
            ]
            base_shape = {
                'zoneType': zone.get('zoneType'),
                'alliance': zone.get('alliance'),
                'index': zone.get('index'),
                'scoringMode': zone.get('scoringMode'),
            }
            if zone.get('shapeType') == 'rectangle' and len(points) >= 2:
                shapes.append({**base_shape, 'type': 'rect', 'start': points[0], 'end': points[1]})
            else:
                shapes.append({**base_shape, 'type': 'poly', 'points': points})
        self.canvas.shapes = shapes
        self.canvas.current = None
        self.canvas.update()
        return bool(shapes)

    def _save_zones_to_local_cache(self, zones):
        zone_path = self._local_zone_path()
        payload = {
            'videoPath': self.video_edit.text().strip(),
            'frameTimestamp': float(self.frame_edit.text() or 0),
            'savedAt': datetime.utcnow().isoformat() + 'Z',
            'zones': zones,
        }
        zone_path.write_text(json.dumps(payload, indent=2))
        return zone_path

    def _load_zones_from_local_cache(self, silent=False):
        zone_path = self._local_zone_path()
        pixmap = self.canvas.pix
        if not pixmap or not zone_path.exists():
            return False
        try:
            payload = json.loads(zone_path.read_text())
            zones = payload.get('zones', [])
            loaded = self._set_shapes_from_zone_records(zones)
        except Exception as exc:
            if not silent:
                QtWidgets.QMessageBox.critical(self, 'Load zones', f'Could not load local saved areas:\n{exc}')
            return False
        if loaded and not silent:
            QtWidgets.QMessageBox.information(self, 'Loaded', f'Loaded {len(zones)} local saved areas from:\n{zone_path}')
        return loaded

    def save_zones(self, show_message=True):
        zones = self._current_canvas_zones()
        if not zones:
            QtWidgets.QMessageBox.information(self, 'Save zones', 'Load a frame and draw/suggest areas first.')
            return
        zone_path = self._save_zones_to_local_cache(zones)

        job_obj = None
        job_sel = self.job_cb.currentText()
        if job_sel:
            try:
                job_obj = ObjectId(job_sel.split(' - ', 1)[0])
            except Exception:
                job_obj = None

        now = datetime.utcnow()
        inserted = 0
        if job_obj is not None:
            try:
                self.db.autoscorecalibrationzones.delete_many({'jobId': job_obj})
                for zone in zones:
                    self.db.autoscorecalibrationzones.insert_one({
                        **zone,
                        'jobId': job_obj,
                        'color': None,
                        'rampDirection': None,
                        'createdAt': now,
                        'updatedAt': now,
                    })
                    inserted += 1
            except Exception as exc:
                print(f'[UI] Mongo zone save skipped after local save: {exc}')
        if show_message:
            extra = f'\nAlso wrote {inserted} Mongo zones.' if inserted else ''
            QtWidgets.QMessageBox.information(self, 'Saved', f'Saved {len(zones)} local detection areas:\n{zone_path}{extra}')

    def _current_canvas_zones(self):
        """Return currently drawn zones without touching MongoDB."""
        pixmap = self.canvas.pix
        if not pixmap:
            return []
        pw = pixmap.width()
        ph = pixmap.height()
        lx = (self.canvas.width() - pw) // 2
        ly = (self.canvas.height() - ph) // 2
        zones = []
        for s in self.canvas.shapes:
            shape_zone_type = s.get('zoneType') or self.zone_type.currentText()
            shape_alliance = s.get('alliance') if s.get('alliance') is not None else (self.alliance.currentText() or None)
            if shape_alliance is None:
                if shape_zone_type.endswith('_red'):
                    shape_alliance = 'red'
                elif shape_zone_type.endswith('_blue'):
                    shape_alliance = 'blue'
            shape_index = s.get('index')
            if s['type'] == 'rect':
                (x1, y1) = s['start']
                (x2, y2) = s['end']
                coords = [
                    {'x': max(0, min(1, (x1 - lx) / pw)), 'y': max(0, min(1, (y1 - ly) / ph))},
                    {'x': max(0, min(1, (x2 - lx) / pw)), 'y': max(0, min(1, (y2 - ly) / ph))},
                ]
                shape = 'rectangle'
            else:
                coords = [
                    {'x': max(0, min(1, (x - lx) / pw)), 'y': max(0, min(1, (y - ly) / ph))}
                    for (x, y) in s['points']
                ]
                shape = 'polygon'
            zones.append({
                'zoneType': shape_zone_type,
                'alliance': shape_alliance,
                'shapeType': shape,
                'coordinates': coords,
                'frameTimestamp': float(self.frame_edit.text() or 0),
                'index': int(shape_index) if shape_index is not None else None,
                'scoringMode': s.get('scoringMode'),
            })
        return zones

    def run_scoring(self):
        if self.scoring_in_progress:
            QtWidgets.QMessageBox.information(self, 'Busy', 'Scoring is already running.')
            return

        path = self.video_edit.text().strip()
        if not path or not os.path.exists(path):
            QtWidgets.QMessageBox.critical(self, 'Video', 'Select a valid video')
            return
        active_zones = self._current_canvas_zones()
        if not active_zones:
            QtWidgets.QMessageBox.critical(self, 'Zones', 'Draw or suggest basket zones before scoring.')
            return

        self.scoring_in_progress = True
        self.run_btn.setEnabled(False)

        root = Path(__file__).resolve().parents[2]
        predict_script = root / 'scripts' / 'decode' / 'predict_video_decode.py'
        model_path = root / 'services' / 'video-processing' / 'models' / 'decode' / 'best.pt'
        if not predict_script.exists():
            QtWidgets.QMessageBox.critical(self, 'Predict', f'Missing script: {predict_script}')
            self.scoring_in_progress = False
            self.run_btn.setEnabled(True)
            return
        temp_prediction_dir = tempfile.TemporaryDirectory(prefix='roboscoutai-autoscore-')
        predictions_dir = Path(temp_prediction_dir.name)
        video_fps = self._video_fps(path)
        # Accuracy mode: always run the artifact model on every video frame.
        # This preserves ball IDs through fast shots/rebounds and avoids missed
        # ramp/basket transitions from low-FPS sampling.
        stride = 1
        actual_detect_fps = video_fps if video_fps > 0 else 30.0
        print(
            f"[UI] Detection sampling: video_fps={video_fps:.2f}, "
            f"hardcoded=every-frame, stride={stride}, actual≈{actual_detect_fps:.2f} fps"
        )
        cmd = [sys.executable, str(predict_script), path, '--model', str(model_path), '--detector-mode', 'artifact', '--stride', str(stride), '--conf', '0.25', '--out', str(predictions_dir)]
        dlg = QtWidgets.QProgressDialog('Running prediction...', None, 0, 0, self)
        dlg.setWindowModality(QtCore.Qt.WindowModality.WindowModal)
        dlg.show()
        try:
            proc = subprocess.Popen(cmd, cwd=str(root), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            for line in proc.stdout:
                print(line, end='')
            ret = proc.wait()
            dlg.close()
            if ret != 0:
                QtWidgets.QMessageBox.critical(self, 'Predict', f'Predict exited {ret}')
                return
            prediction_json = predictions_dir / f"{Path(path).stem}.json"
            if not prediction_json.exists():
                QtWidgets.QMessageBox.critical(self, 'Predict', 'Missing prediction output')
                return
            prediction = json.loads(prediction_json.read_text())
            rows = []
            dw = float(prediction.get('width', 0) or 0)
            dh = float(prediction.get('height', 0) or 0)
            for frame in prediction.get('detections', []):
                ts = float(frame.get('timestamp', 0))
                fw = float(frame.get('width', dw) or dw)
                fh = float(frame.get('height', dh) or dh)
                phase = 'AUTO' if ts <= 30 else 'ENDGAME' if ts >= 150 else 'TELEOP'
                rows.append({'frameNumber': int(frame.get('frame', 0)), 'timestamp': ts, 'phase': phase, 'className': '__frame_marker__', 'confidence': 0.0, 'centerX': None, 'centerY': None, 'frameWidth': fw, 'frameHeight': fh})
                for d in frame.get('detections', []):
                    x1, y1, x2, y2 = d.get('bbox_xyxy', [0,0,0,0])
                    cn = d.get('class_name')
                    rows.append({'frameNumber': int(frame.get('frame', 0)), 'timestamp': ts, 'phase': phase, 'className': cn, 'classId': int(d.get('class_id',0)), 'detectorType': d.get('detector_type','artifact'), 'artifactColor': 'green' if cn=='artifact_green' else 'purple' if cn=='artifact_purple' else None, 'confidence': float(d.get('confidence',0.0)), 'x': float(x1), 'y': float(y1), 'width': float(x2-x1), 'height': float(y2-y1), 'centerX': (float(x1+x2)/2/fw) if fw else None, 'centerY': (float(y1+y2)/2/fh) if fh else None, 'frameWidth': fw, 'frameHeight': fh})
            artifact_rows = [row for row in rows if 'artifact' in str(row.get('className', ''))]
            print(
                f"[UI] Loaded {len(rows)} fresh rows from prediction JSON "
                f"({len(artifact_rows)} artifact detections). Running raw canvas scoring..."
            )
            scoring_result = score_video(
                Path(path).stem,
                rows,
                active_zones,
                persistence_frames=2,
                confidence_threshold=0.25,
                max_distance=0.15,
            )
            red_score = scoring_result.get('red_score', 0)
            blue_score = scoring_result.get('blue_score', 0)
            events = scoring_result.get('events', [])
            debug_payload = {
                'scoreBreakdown': scoring_result.get('scoreBreakdown'),
                'warnings': scoring_result.get('warnings', []),
                'debug': scoring_result.get('debug', {}),
                'rampCounts': scoring_result.get('rampCounts', []),
                'events': events,
            }
            print(f"[UI] Raw scoring complete: Red={red_score} Blue={blue_score} Events={len(events)}")
            print(f"[UI] Decode debug summary (not saved): {json.dumps(debug_payload.get('debug', {}), indent=2)}")
            self._show_scoring_results(red_score, blue_score, events, scoring_result, None)
        except Exception as exc:
            try:
                dlg.close()
            except Exception:
                pass
            details = traceback.format_exc()
            print(details)
            QtWidgets.QMessageBox.critical(
                self,
                'Scoring crashed',
                f'{exc}\n\nThe full traceback was printed in Terminal.',
            )
        finally:
            try:
                temp_prediction_dir.cleanup()
            except Exception:
                pass
            self.scoring_in_progress = False
            self.run_btn.setEnabled(True)
    
    def _show_scoring_results(self, red_score, blue_score, events, scoring_result=None, debug_path=None):
        """Display scoring results in a popup dialog."""
        dlg = QtWidgets.QDialog(self)
        dlg.setWindowTitle('Scoring Results')
        dlg.resize(700, 600)
        
        layout = QtWidgets.QVBoxLayout(dlg)
        
        # Summary header
        summary_text = f"<h2 style='text-align:center;'>SCORING SUMMARY</h2>"
        summary_text += f"<p style='text-align:center; font-size:20px;'>"
        summary_text += f"<span style='color:red;'><b>Red: {red_score}</b></span> | "
        summary_text += f"<span style='color:blue;'><b>Blue: {blue_score}</b></span>"
        summary_text += f"</p>"
        summary_text += f"<p style='text-align:center;'>Total Events: {len(events)}</p>"
        if scoring_result:
            debug = scoring_result.get('debug', {})
            warnings = scoring_result.get('warnings', [])
            summary_text += (
                f"<p style='text-align:center;'>Tracks: {debug.get('trackCount', 0)} | "
                f"Ramp changes: {debug.get('rampCountChanges', 0)} | "
                f"Duplicates removed: {debug.get('duplicateEventsRemoved', 0)}</p>"
            )
            if warnings:
                summary_text += f"<p style='color:#f59e0b;'>Warnings: {'; '.join(warnings[:5])}</p>"
            if debug_path:
                summary_text += f"<p>Debug JSON: {debug_path}</p>"
        
        summary_label = QtWidgets.QLabel(summary_text)
        summary_label.setOpenExternalLinks(True)
        layout.addWidget(summary_label)
        
        # Events table
        layout.addWidget(QtWidgets.QLabel('Scoring Events: double-click any row to jump to that video frame.'))
        table = QtWidgets.QTableWidget()
        table.setColumnCount(7)
        table.setHorizontalHeaderLabels(['Frame', 'Time (s)', 'Track ID', 'Color', 'Event', 'Alliance', 'Reason'])
        table.setRowCount(len(events))
        table.horizontalHeader().setStretchLastSection(True)
        
        for row, event in enumerate(events):
            table.setItem(row, 0, QtWidgets.QTableWidgetItem(str(event.get('frame_number', ''))))
            table.setItem(row, 1, QtWidgets.QTableWidgetItem(f"{event.get('timestamp', 0):.2f}"))
            table.setItem(row, 2, QtWidgets.QTableWidgetItem(str(event.get('ball_id', ''))))
            table.setItem(row, 3, QtWidgets.QTableWidgetItem(str(event.get('ball_color', ''))))
            table.setItem(row, 4, QtWidgets.QTableWidgetItem(str(event.get('eventType') or event.get('basket_type', ''))))
            alliance = event.get('alliance', '')
            item = QtWidgets.QTableWidgetItem(alliance)
            if alliance == 'red':
                item.setBackground(QtGui.QColor(255, 200, 200))
            elif alliance == 'blue':
                item.setBackground(QtGui.QColor(200, 200, 255))
            table.setItem(row, 5, item)
            table.setItem(row, 6, QtWidgets.QTableWidgetItem(str(event.get('reason') or event.get('description', ''))))

        table.cellDoubleClicked.connect(lambda row, _column: self._jump_to_event_frame(events[row], dlg))
        
        layout.addWidget(table)
        
        # Close button
        close_btn = QtWidgets.QPushButton('Close')
        close_btn.clicked.connect(dlg.accept)
        layout.addWidget(close_btn)
        
        dlg.exec()

    def _video_fps(self, path: str) -> float:
        cap = cv2.VideoCapture(path)
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0)
        cap.release()
        return fps if fps > 0 else 30.0

    def _jump_to_event_frame(self, event, dialog=None):
        """Load the selected event frame in the main canvas for quick review."""
        timestamp = event.get('timestamp')
        if timestamp is None:
            return
        self.frame_edit.setText(f"{float(timestamp):.3f}")
        self.load_frame()
        if dialog is not None:
            dialog.accept()

    def _generate_highlight_clips(self, root: Path, job_obj: ObjectId, video_path: str, events=None):
        """Generate short clips around score events so the user can review detections."""
        events = events or []
        if job_obj is None:
            ffmpeg = shutil.which('ffmpeg')
            if not ffmpeg:
                print('[UI] ffmpeg not found; skipping raw event clips.')
                return
            run_name = Path(video_path).stem.replace(' ', '_')
            highlights_dir = root / 'runs' / f'raw_highlights_{run_name}'
            highlights_dir.mkdir(parents=True, exist_ok=True)
            for index, event in enumerate(events[:30], start=1):
                timestamp = max(0.0, float(event.get('timestamp') or 0.0) - 1.5)
                out = highlights_dir / f"event_{index:03d}_{event.get('alliance','unknown')}_{event.get('ball_id','')}.mp4"
                cmd = [
                    ffmpeg, '-y',
                    '-ss', f'{timestamp:.3f}',
                    '-i', video_path,
                    '-t', '3.0',
                    '-c', 'copy',
                    str(out),
                ]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"[UI] Raw highlight clips saved to {highlights_dir}")
            return
        annotate_script = root / 'scripts' / 'local' / 'score_and_annotate.py'
        highlights_dir = root / 'runs' / f'highlights_{job_obj}'
        if not annotate_script.exists():
            print(f"[UI] Highlight script missing: {annotate_script}")
            return
        cmd = [
            sys.executable,
            str(annotate_script),
            '--job',
            str(job_obj),
            '--video',
            video_path,
            '--output',
            str(root / 'runs' / f'annotated_{job_obj}.mp4'),
            '--highlights-dir',
            str(highlights_dir),
        ]
        print('[UI] Generating annotated video and highlight clips...')
        proc = subprocess.run(cmd, cwd=str(root), capture_output=True, text=True)
        if proc.stdout:
            print(proc.stdout)
        if proc.stderr:
            print(proc.stderr)
        if proc.returncode != 0:
            print(f"[UI] Highlight generation failed with exit code {proc.returncode}")
            return
        self.db.autoscorejobs.update_one({'_id': job_obj}, {'$set': {
            'highlightClipsPath': str(highlights_dir),
            'annotatedVideoPath': str(root / 'runs' / f'annotated_{job_obj}.mp4'),
            'updatedAt': datetime.utcnow(),
        }})


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--mongo', default=os.environ.get('DATABASE_URL','mongodb://localhost:27017'))
    p.add_argument('--db', default=os.environ.get('MONGODB_DB_NAME','test'))
    args = p.parse_args()
    app = QtWidgets.QApplication(sys.argv)
    w = ZoneDrawerWindow(args.mongo, args.db)
    w.show()
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
