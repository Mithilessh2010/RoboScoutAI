#!/usr/bin/env python3
"""Local zone-drawing server.

Run with:
  source .venv/bin/activate
  python scripts/local/zone_server.py --mongo mongodb://localhost:27017 --db test --videos-dir decode-training/raw-videos/unsorted --port 9000

Open http://localhost:9000 in your browser. Select a job and a video, draw zones (polygon or rectangle), set zoneType/alliance/index/frameTimestamp, and click Save to insert into MongoDB collection `autoscorecalibrationzones` for the selected job.
"""
import argparse
import json
import os
from datetime import datetime
from pathlib import Path

from bson import ObjectId
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pymongo import MongoClient
import uvicorn


INDEX_HTML = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Local Zone Drawer</title>
  <style>
    body{font-family:system-ui,Segoe UI,Helvetica,Arial;margin:0;padding:0}
    header{padding:12px;background:#0b63ff;color:#fff}
    .container{padding:12px}
    .row{display:flex;gap:12px;align-items:center;margin-bottom:8px}
    #video-wrap{position:relative;border:1px solid #ccc;display:inline-block}
    #overlay{position:absolute;left:0;top:0}
    button{padding:8px 12px}
    label{font-size:14px}
    select,input{padding:6px}
    .hint{color:#666;font-size:13px}
  </style>
</head>
<body>
  <header><h3 style="margin:0">Local Zone Drawer</h3></header>
  <div class="container">
    <div class="row">
      <label>Job:</label>
      <select id="job"></select>
      <label>Video:</label>
      <select id="video"></select>
      <label>Mode:</label>
      <select id="mode"><option value="polygon">Polygon</option><option value="rect">Rectangle</option></select>
      <button id="load">Load Video</button>
    </div>

    <div class="row">
      <label>Zone Type:</label>
      <select id="zoneType">
        <option>field_boundary</option>
        <option>basket_red</option>
        <option>basket_blue</option>
        <option>ramp_red</option>
        <option>ramp_blue</option>
        <option>depot_red</option>
        <option>depot_blue</option>
      </select>
      <label>Alliance:</label>
      <select id="alliance"><option value="">none</option><option value="red">red</option><option value="blue">blue</option></select>
      <label>Index:</label>
      <input id="index" type="number" style="width:80px" />
      <label>FrameTS:</label>
      <input id="frameTs" type="number" step="0.1" value="1.0" style="width:100px" />
      <button id="clear">Clear</button>
      <button id="save">Save Zones</button>
    </div>

    <div id="video-wrap">
      <video id="videoEl" width="960" controls crossorigin="anonymous" style="display:block;background:#000"></video>
      <canvas id="overlay"></canvas>
    </div>

    <p class="hint">Draw polygon by clicking points (double-click to close). Rectangle: click-drag. After drawing shapes, click Save.</p>
    <pre id="log" style="background:#f6f8fa;padding:8px;height:120px;overflow:auto"></pre>
  </div>
  <script>
    let jobs = [];
    let videos = [];
    let shapes = [];
    let current = null;
    const canvas = document.getElementById('overlay');
    const videoEl = document.getElementById('videoEl');
    const ctx = canvas.getContext('2d');

    function log(...args){document.getElementById('log').textContent += args.join(' ') + '\n';}

    async function loadJobs(){
      let res = await fetch('/jobs'); jobs = await res.json();
      const sel = document.getElementById('job'); sel.innerHTML = '';
      for(let j of jobs){ let opt=document.createElement('option'); opt.value=j._id; opt.textContent=(j._id+' - '+(j.videoName||j.videoUrl||'')); sel.appendChild(opt);} }

    async function loadVideos(){
      let res = await fetch('/videos'); videos = await res.json();
      const sel = document.getElementById('video'); sel.innerHTML=''; for(let v of videos){ let opt=document.createElement('option'); opt.value=v; opt.textContent=v; sel.appendChild(opt); }
    }

    function resizeCanvas(){ canvas.width = videoEl.clientWidth; canvas.height = videoEl.clientHeight; canvas.style.left = videoEl.offsetLeft + 'px'; canvas.style.top = videoEl.offsetTop + 'px'; draw(); }
    window.addEventListener('resize', resizeCanvas);

    document.getElementById('load').addEventListener('click', ()=>{
      const v = document.getElementById('video').value; if(!v) return; videoEl.src = '/videos/'+encodeURIComponent(v); videoEl.play(); setTimeout(resizeCanvas,300);
    });

    let mode='polygon'; document.getElementById('mode').addEventListener('change', (e)=>{mode=e.target.value; current=null;});
    document.getElementById('clear').addEventListener('click', ()=>{shapes=[]; current=null; draw();});

    canvas.addEventListener('mousedown', (ev)=>{
      const rect = canvas.getBoundingClientRect(); const x = (ev.clientX-rect.left)/canvas.width; const y = (ev.clientY-rect.top)/canvas.height;
      if(mode==='rect'){
        current = {type:'rect', startX:x, startY:y, x:x, y:y}; shapes.push(current);
      } else {
        if(!current || current.type!=='poly') { current={type:'poly', points:[]}; shapes.push(current); }
        current.points.push({x,y});
      }
      draw();
    });
    canvas.addEventListener('mousemove', (ev)=>{ if(!current) return; const rect = canvas.getBoundingClientRect(); const x=(ev.clientX-rect.left)/canvas.width; const y=(ev.clientY-rect.top)/canvas.height; if(current.type==='rect'){ current.x = x; current.y = y; } draw(); });
    canvas.addEventListener('dblclick', ()=>{ if(current && current.type==='poly'){ current=null; } draw(); });

    function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.lineWidth=2; ctx.strokeStyle='lime'; ctx.fillStyle='rgba(0,255,0,0.15)'; for(let s of shapes){ if(s.type==='rect'){ const x=Math.min(s.startX,s.x)*canvas.width; const y=Math.min(s.startY,s.y)*canvas.height; const w=Math.abs(s.x-s.startX)*canvas.width; const h=Math.abs(s.y-s.startY)*canvas.height; ctx.strokeRect(x,y,w,h); ctx.fillRect(x,y,w,h);} else if(s.type==='poly'){ if(s.points.length){ ctx.beginPath(); ctx.moveTo(s.points[0].x*canvas.width,s.points[0].y*canvas.height); for(let p of s.points.slice(1)){ ctx.lineTo(p.x*canvas.width,p.y*canvas.height); } ctx.closePath(); ctx.fill(); ctx.stroke(); } } } }

    document.getElementById('save').addEventListener('click', async ()=>{
      const selJob = document.getElementById('job').value; if(!selJob){ alert('Select job'); return; }
      const zoneType = document.getElementById('zoneType').value; const alliance=document.getElementById('alliance').value||null; const index=document.getElementById('index').value?Number(document.getElementById('index').value):null; const frameTs=Number(document.getElementById('frameTs').value)||0;
      const payload = { jobId: selJob, zones: shapes.map(s=>{ if(s.type==='rect'){ const x1=Math.min(s.startX,s.x); const y1=Math.min(s.startY,s.y); const x2=Math.max(s.startX,s.x); const y2=Math.max(s.startY,s.y); return { zoneType, alliance, shapeType:'rectangle', coordinates:[{x:x1,y:y1},{x:x2,y:y2}], index, frameTimestamp:frameTs }; } else { return { zoneType, alliance, shapeType:'polygon', coordinates: s.points, index, frameTimestamp: frameTs }; } }) };
      const res = await fetch('/zones', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload)});
      const j = await res.json(); if(res.ok){ log('Saved', j.insertedCount||j.message); shapes=[]; draw(); } else { log('Error', j); }
    });

    async function init(){ await loadJobs(); await loadVideos(); }
    init();
  </script>
</body>
</html>
"""


def make_app(mongo_uri: str, db_name: str, videos_dir: str):
    app = FastAPI()
    client = MongoClient(mongo_uri)
    db = client[db_name]

    # Serve videos directory at /videos
    app.mount('/videos', StaticFiles(directory=videos_dir), name='videos')

    @app.get('/', response_class=HTMLResponse)
    def index():
        return HTMLResponse(INDEX_HTML)

    @app.get('/jobs')
    def list_jobs():
        docs = list(db.autoscorejobs.find({}, {'videoName':1, 'videoUrl':1}).sort('createdAt', -1).limit(50))
        for d in docs:
            d['_id'] = str(d['_id'])
        return JSONResponse(docs)

    @app.get('/videos')
    def list_videos():
        p = Path(videos_dir)
        files = [f.name for f in p.iterdir() if f.is_file()]
        return JSONResponse(files)

    @app.post('/zones')
    async def save_zones(req: Request):
        body = await req.json()
        jobId = body.get('jobId')
        zones = body.get('zones', [])
        if not jobId or not zones:
            raise HTTPException(status_code=400, detail='jobId and zones required')
        try:
            job_obj = ObjectId(jobId)
        except Exception:
            raise HTTPException(status_code=400, detail='invalid jobId')
        now = datetime.utcnow()
        inserted = 0
        for z in zones:
            rec = {
                'jobId': job_obj,
                'zoneType': z.get('zoneType'),
                'alliance': z.get('alliance'),
                'shapeType': z.get('shapeType', 'polygon'),
                'coordinates': z.get('coordinates', []),
                'frameTimestamp': float(z.get('frameTimestamp', 0)),
                'color': None,
                'index': z.get('index'),
                'rampDirection': None,
                'createdAt': now,
                'updatedAt': now,
            }
            db.autoscorecalibrationzones.insert_one(rec)
            inserted += 1
        return JSONResponse({'message': f'Inserted {inserted} zones', 'insertedCount': inserted})

    return app


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--mongo', default=os.environ.get('DATABASE_URL', 'mongodb://localhost:27017'))
    p.add_argument('--db', default=os.environ.get('MONGODB_DB_NAME', 'test'))
    p.add_argument('--videos-dir', default='decode-training/raw-videos/unsorted')
    p.add_argument('--host', default='0.0.0.0')
    p.add_argument('--port', type=int, default=9000)
    args = p.parse_args()

    if not os.path.exists(args.videos_dir):
        raise SystemExit(f'Videos dir not found: {args.videos_dir}')

    app = make_app(args.mongo, args.db, args.videos_dir)
    print(f'Serving zone-drawer on http://{args.host}:{args.port} (videos from {args.videos_dir})')
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
