#!/usr/bin/env python3
"""Local GUI to draw calibration zones and run local scoring.

Features:
- Connect to MongoDB and list recent `autoscorejobs` (or create a new job)
- Pick a local video file (from repo or filesystem)
- Seek to a frame timestamp and display that frame
- Draw polygon or rectangle zones on the frame
- Save zones to `autoscorecalibrationzones` in MongoDB for the selected job
- Optionally run the full local scoring pipeline (prediction -> flatten -> insert detections)

Usage:
  source .venv/bin/activate
  python scripts/local/gui_zone_and_run.py --mongo mongodb://localhost:27017 --db test

Dependencies: Pillow, opencv-python, pymongo (installed in the repo venv)
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

import cv2
from bson import ObjectId
from PIL import Image, ImageTk
from pymongo import MongoClient
import tkinter as tk
from tkinter import ttk, filedialog, messagebox


class ZoneDrawerApp:
    def __init__(self, mongo_uri, db_name):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client[self.db_name]

        self.root = tk.Tk()
        self.root.title('Local Zone Drawer & Scorer')

        self.jobs = []
        self.selected_job = tk.StringVar()
        self.video_path = tk.StringVar()
        self.frame_ts = tk.DoubleVar(value=1.0)
        self.mode = tk.StringVar(value='polygon')
        self.zone_type = tk.StringVar(value='field_boundary')
        self.alliance = tk.StringVar(value='')
        self.index = tk.IntVar(value=0)

        self.canvas_width = 960
        self.canvas_height = 540
        self.image_tk = None
        self.current_frame = None

        self.shapes = []  # list of shape dicts
        self.current = None

        self.build_ui()
        self.load_jobs()

    def build_ui(self):
        frm = ttk.Frame(self.root, padding=8)
        frm.pack(fill=tk.BOTH, expand=True)

        top = ttk.Frame(frm)
        top.pack(fill=tk.X)
        ttk.Label(top, text='Job:').pack(side=tk.LEFT)
        self.job_cb = ttk.Combobox(top, textvariable=self.selected_job, width=40)
        self.job_cb.pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text='Refresh Jobs', command=self.load_jobs).pack(side=tk.LEFT, padx=4)
        ttk.Button(top, text='New Job', command=self.create_job_dialog).pack(side=tk.LEFT, padx=4)

        mid = ttk.Frame(frm)
        mid.pack(fill=tk.X, pady=6)
        ttk.Label(mid, text='Video:').pack(side=tk.LEFT)
        ttk.Entry(mid, textvariable=self.video_path, width=60).pack(side=tk.LEFT, padx=6)
        ttk.Button(mid, text='Browse', command=self.browse_video).pack(side=tk.LEFT)
        ttk.Label(mid, text='Frame (s):').pack(side=tk.LEFT, padx=(12, 0))
        ttk.Entry(mid, textvariable=self.frame_ts, width=8).pack(side=tk.LEFT)
        ttk.Button(mid, text='Load Frame', command=self.load_frame).pack(side=tk.LEFT, padx=6)

        opts = ttk.Frame(frm)
        opts.pack(fill=tk.X)
        ttk.Label(opts, text='Mode:').pack(side=tk.LEFT)
        ttk.Radiobutton(opts, text='Polygon', variable=self.mode, value='polygon').pack(side=tk.LEFT)
        ttk.Radiobutton(opts, text='Rectangle', variable=self.mode, value='rect').pack(side=tk.LEFT)
        ttk.Label(opts, text=' ZoneType:').pack(side=tk.LEFT, padx=(8, 0))
        ttk.Combobox(opts, textvariable=self.zone_type, values=self.default_zone_types(), width=20).pack(side=tk.LEFT)
        ttk.Label(opts, text=' Alliance:').pack(side=tk.LEFT, padx=(8, 0))
        ttk.Combobox(opts, textvariable=self.alliance, values=['', 'red', 'blue'], width=8).pack(side=tk.LEFT)
        ttk.Label(opts, text=' Index:').pack(side=tk.LEFT, padx=(8, 0))
        ttk.Entry(opts, textvariable=self.index, width=6).pack(side=tk.LEFT)

        canvas_wrap = ttk.Frame(frm)
        canvas_wrap.pack(fill=tk.BOTH, expand=True, pady=6)
        self.canvas = tk.Canvas(canvas_wrap, width=self.canvas_width, height=self.canvas_height, bg='black')
        self.canvas.pack()
        self.canvas.bind('<Button-1>', self.on_mouse_down)
        self.canvas.bind('<B1-Motion>', self.on_mouse_move)
        self.canvas.bind('<ButtonRelease-1>', self.on_mouse_up)
        self.canvas.bind('<Double-Button-1>', self.on_double_click)

        bottom = ttk.Frame(frm)
        bottom.pack(fill=tk.X, pady=(6, 0))
        ttk.Button(bottom, text='Clear Shapes', command=self.clear_shapes).pack(side=tk.LEFT)
        ttk.Button(bottom, text='Save Zones', command=self.save_zones).pack(side=tk.LEFT, padx=6)
        ttk.Button(bottom, text='Run Full Local Scoring', command=self.run_local_scoring).pack(side=tk.RIGHT)

    def default_zone_types(self):
        return [
            'basket_red', 'basket_blue', 'tunnel_red', 'tunnel_blue', 'goal_red', 'goal_blue', 'field_boundary', 'ramp_red', 'ramp_blue', 'depot_red', 'depot_blue'
        ]

    def load_jobs(self):
        docs = list(self.db.autoscorejobs.find({}, {'videoName': 1, 'videoUrl': 1}).sort('createdAt', -1).limit(50))
        items = []
        for d in docs:
            items.append(f"{d['_id']} - {d.get('videoName') or d.get('videoUrl') or ''}")
        self.job_cb['values'] = items

    def create_job_dialog(self):
        def do_create():
            name = name_var.get().strip()
            if not name:
                messagebox.showerror('Uh', 'Enter a name')
                return
            now = datetime.utcnow()
            res = self.db.autoscorejobs.insert_one({'status': 'pending', 'videoName': name, 'createdAt': now, 'updatedAt': now})
            popup.destroy()
            self.load_jobs()

        popup = tk.Toplevel(self.root)
        popup.title('Create job')
        ttk.Label(popup, text='Job name').pack(padx=8, pady=6)
        name_var = tk.StringVar()
        ttk.Entry(popup, textvariable=name_var, width=60).pack(padx=8)
        ttk.Button(popup, text='Create', command=do_create).pack(pady=8)

    def browse_video(self):
        p = filedialog.askopenfilename(title='Select video file', filetypes=[('Video', '*.mp4 *.mov *.MOV *.MP4 *.mkv *.avi'), ('All files', '*.*')])
        if p:
            self.video_path.set(p)

    def load_frame(self):
        path = self.video_path.get().strip()
        if not path or not os.path.exists(path):
            messagebox.showerror('Video', 'Video file not found')
            return
        ts = float(self.frame_ts.get())
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            messagebox.showerror('Video', 'Could not open video')
            return
        cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000)
        ok, frame = cap.read()
        cap.release()
        if not ok:
            messagebox.showerror('Video', 'Could not read frame at timestamp')
            return
        self.current_frame = frame
        self.show_frame(frame)

    def show_frame(self, frame):
        # Resize to canvas keeping aspect
        h, w = frame.shape[:2]
        scale = min(self.canvas_width / w, self.canvas_height / h)
        nw, nh = int(w * scale), int(h * scale)
        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (nw, nh))
        pil = Image.fromarray(img)
        self.image_tk = ImageTk.PhotoImage(pil)
        self.canvas.delete('all')
        self.canvas.create_image((self.canvas_width - nw) // 2, (self.canvas_height - nh) // 2, anchor=tk.NW, image=self.image_tk, tags='bg')
        self.draw_shapes()

    def canvas_to_norm(self, x, y):
        # Convert canvas coords to normalized 0..1 relative to displayed image
        bg = self.canvas.bbox('bg')
        if not bg:
            return x / self.canvas_width, y / self.canvas_height
        img_x, img_y = bg[0], bg[1]
        img_w = self.image_tk.width()
        img_h = self.image_tk.height()
        nx = (x - img_x) / img_w
        ny = (y - img_y) / img_h
        nx = max(0.0, min(1.0, nx))
        ny = max(0.0, min(1.0, ny))
        return nx, ny

    def on_mouse_down(self, event):
        x, y = event.x, event.y
        if self.mode.get() == 'rect':
            self.current = {'type': 'rect', 'start': (x, y), 'end': (x, y)}
            self.shapes.append(self.current)
        else:
            if not self.current or self.current.get('type') != 'poly':
                self.current = {'type': 'poly', 'points': []}
                self.shapes.append(self.current)
            self.current['points'].append((x, y))
        self.draw_shapes()

    def on_mouse_move(self, event):
        if not self.current:
            return
        if self.current['type'] == 'rect':
            self.current['end'] = (event.x, event.y)
        else:
            pass
        self.draw_shapes()

    def on_mouse_up(self, event):
        pass

    def on_double_click(self, event):
        # finish polygon
        self.current = None
        self.draw_shapes()

    def draw_shapes(self):
        self.canvas.delete('shape')
        for s in self.shapes:
            if s['type'] == 'rect':
                (x1, y1) = s['start']; (x2, y2) = s['end']
                self.canvas.create_rectangle(x1, y1, x2, y2, outline='lime', width=2, tags='shape')
            else:
                pts = []
                for (x, y) in s['points']:
                    pts.extend([x, y])
                if pts:
                    self.canvas.create_polygon(pts, outline='lime', fill='green', stipple='gray25', tags='shape')

    def clear_shapes(self):
        self.shapes = []
        self.current = None
        self.draw_shapes()

    def save_zones(self):
        job_sel = self.selected_job.get().strip()
        if not job_sel:
            messagebox.showerror('Job', 'Select a job from the dropdown')
            return
        job_id = job_sel.split(' - ', 1)[0]
        try:
            job_obj = ObjectId(job_id)
        except Exception:
            messagebox.showerror('Job', 'Invalid job id')
            return

        now = datetime.utcnow()
        inserted = 0
        for s in self.shapes:
            if s['type'] == 'rect':
                (x1, y1) = s['start']; (x2, y2) = s['end']
                nx1, ny1 = self.canvas_to_norm(x1, y1)
                nx2, ny2 = self.canvas_to_norm(x2, y2)
                coords = [{'x': nx1, 'y': ny1}, {'x': nx2, 'y': ny2}]
                shape_type = 'rectangle'
            else:
                coords = []
                for (x, y) in s['points']:
                    nx, ny = self.canvas_to_norm(x, y)
                    coords.append({'x': nx, 'y': ny})
                shape_type = 'polygon'
            rec = {
                'jobId': job_obj,
                'zoneType': self.zone_type.get(),
                'alliance': self.alliance.get() or None,
                'shapeType': shape_type,
                'coordinates': coords,
                'frameTimestamp': float(self.frame_ts.get()),
                'color': None,
                'index': int(self.index.get()) if self.index.get() else None,
                'rampDirection': None,
                'createdAt': now,
                'updatedAt': now,
            }
            self.db.autoscorecalibrationzones.insert_one(rec)
            inserted += 1
        messagebox.showinfo('Saved', f'Inserted {inserted} zones')

    def run_local_scoring(self):
        # Run the predict script then flatten and insert detections similar to helper
        path = self.video_path.get().strip()
        if not path or not os.path.exists(path):
            messagebox.showerror('Video', 'Select a valid video file')
            return
        job_sel = self.selected_job.get().strip()
        if not job_sel:
            messagebox.showerror('Job', 'Select job')
            return
        job_id = job_sel.split(' - ', 1)[0]
        try:
            job_obj = ObjectId(job_id)
        except Exception:
            messagebox.showerror('Job', 'Invalid job id')
            return

        root = Path(__file__).resolve().parents[2]
        predict_script = root / 'scripts' / 'decode' / 'predict_video_decode.py'
        model_path = root / 'services' / 'video-processing' / 'models' / 'decode' / 'best.pt'
        predictions_dir = root / 'decode-training' / 'predictions'
        predictions_dir.mkdir(parents=True, exist_ok=True)

        cmd = [
            sys.executable, str(predict_script), path,
            '--model', str(model_path), '--detector-mode', 'artifact', '--stride', '30', '--conf', '0.25', '--out', str(predictions_dir)
        ]
        if not predict_script.exists():
            messagebox.showerror('Predict', f'Predict script missing: {predict_script}')
            return
        if not model_path.exists():
            if not messagebox.askyesno('Model missing', f'Model not found at {model_path}. Continue anyway?'):
                return

        # Run prediction (blocking) - show progress in a popup
        proc_win = tk.Toplevel(self.root)
        proc_win.title('Running prediction...')
        txt = tk.Text(proc_win, width=80, height=20)
        txt.pack()

        proc = subprocess.Popen(cmd, cwd=str(root), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in proc.stdout:
            txt.insert(tk.END, line); txt.see(tk.END); proc_win.update()
        ret = proc.wait()
        if ret != 0:
            messagebox.showerror('Predict', f'Prediction exited {ret}')
            proc_win.destroy()
            return

        prediction_json = predictions_dir / f"{Path(path).stem}.json"
        if not prediction_json.exists():
            messagebox.showerror('Predict', f'Prediction output missing: {prediction_json}')
            proc_win.destroy()
            return

        prediction = json.loads(prediction_json.read_text())

        # Flatten and insert detections
        now = datetime.utcnow()
        rows = []
        default_w = float(prediction.get('width', 0) or 0)
        default_h = float(prediction.get('height', 0) or 0)
        for frame in prediction.get('detections', []):
            ts = float(frame.get('timestamp', 0))
            fw = float(frame.get('width', default_w) or default_w)
            fh = float(frame.get('height', default_h) or default_h)
            phase = 'AUTO' if ts <= 30 else 'ENDGAME' if ts >= 150 else 'TELEOP'
            for d in frame.get('detections', []):
                x1, y1, x2, y2 = d.get('bbox_xyxy', [0, 0, 0, 0])
                cn = d.get('class_name')
                rows.append({
                    'jobId': job_obj,
                    'frameNumber': int(frame.get('frame', 0)),
                    'timestamp': ts,
                    'phase': phase,
                    'className': cn,
                    'classId': int(d.get('class_id', 0)),
                    'detectorType': d.get('detector_type', 'robot' if cn == 'robot' else 'artifact'),
                    'artifactColor': 'green' if cn == 'artifact_green' else 'purple' if cn == 'artifact_purple' else None,
                    'confidence': float(d.get('confidence', 0.0)),
                    'x': float(x1), 'y': float(y1), 'width': float(x2 - x1), 'height': float(y2 - y1),
                    'centerX': (float(x1 + x2) / 2 / fw) if fw else None,
                    'centerY': (float(y1 + y2) / 2 / fh) if fh else None,
                    'frameWidth': fw, 'frameHeight': fh,
                    'createdAt': now, 'updatedAt': now,
                })

        # Insert rows
        self.db.autoscoredetections.delete_many({'jobId': job_obj})
        if rows:
            self.db.autoscoredetections.insert_many(rows)

        # summary
        all_rows = list(self.db.autoscoredetections.find({'jobId': job_obj}))
        confidences = [r.get('confidence', 0) for r in all_rows]
        total = len(all_rows)
        ag = sum(1 for r in all_rows if r.get('className') == 'artifact_green')
        ap = sum(1 for r in all_rows if r.get('className') == 'artifact_purple')
        rc = sum(1 for r in all_rows if r.get('className') == 'robot')
        avg = sum(confidences) / len(confidences) if confidences else 0
        mx = max(confidences) if confidences else 0

        self.db.autoscoresummaries.update_one({'jobId': job_obj}, {'$set': {
            'jobId': job_obj, 'totalDetections': total, 'artifactGreenCount': ag, 'artifactPurpleCount': ap, 'robotDetectionCount': rc, 'averageConfidence': avg, 'maxConfidence': mx, 'updatedAt': now
        }, '$setOnInsert': {'createdAt': now}}, upsert=True)

        annotated_frames_path = str(prediction_json.parent / (Path(path).stem) / 'annotated-frames')
        self.db.autoscorejobs.update_one({'_id': job_obj}, {'$set': {'status': 'detection_complete', 'predictionJsonPath': str(prediction_json), 'annotatedFramesPath': annotated_frames_path, 'updatedAt': now, 'progress': 100}})

        proc_win.destroy()
        messagebox.showinfo('Done', f'Inserted {len(rows)} detections and updated job')

    def run(self):
        self.root.mainloop()


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--mongo', default=os.environ.get('DATABASE_URL', 'mongodb://localhost:27017'))
    p.add_argument('--db', default=os.environ.get('MONGODB_DB_NAME', 'test'))
    args = p.parse_args()

    app = ZoneDrawerApp(args.mongo, args.db)
    app.run()


if __name__ == '__main__':
    main()
