FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY services/autoscore-worker/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY scripts/decode/predict_video_decode.py scripts/decode/predict_video_decode.py
COPY services/video-processing/models/decode/best.pt services/video-processing/models/decode/best.pt
COPY services/autoscore-worker/app.py services/autoscore-worker/app.py

EXPOSE 8080

CMD ["uvicorn", "app:app", "--app-dir", "services/autoscore-worker", "--host", "0.0.0.0", "--port", "8080"]
