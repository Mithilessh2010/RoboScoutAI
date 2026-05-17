#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <worker_base_url> <path_to_video> [timeout_seconds]"
  exit 2
fi

WORKER_URL="$1"
VIDEO_PATH="$2"
TIMEOUT_SECONDS="${3:-900}"
POLL_INTERVAL=2

if [ ! -f "$VIDEO_PATH" ]; then
  echo "Video file not found: $VIDEO_PATH"
  exit 2
fi

echo "Uploading $VIDEO_PATH to $WORKER_URL..."
RESP=$(curl -sS -w "\n%{http_code}" -X POST -F "file=@${VIDEO_PATH}" "${WORKER_URL%/}/upload-video")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" -ge 300 ]; then
  echo "Upload failed (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 3
fi

UPLOAD_ID=$(echo "$BODY" | jq -r '.uploadId // empty')
if [ -z "$UPLOAD_ID" ]; then
  echo "Could not parse uploadId from response:"
  echo "$BODY"
  exit 4
fi

echo "Upload started: uploadId=$UPLOAD_ID"

END=$((SECONDS + TIMEOUT_SECONDS))
while [ $SECONDS -lt $END ]; do
  echo "Polling for status..."
  STATUS_RESP=$(curl -sS "${WORKER_URL%/}/uploads/${UPLOAD_ID}")
  echo "$STATUS_RESP" | jq .
  STATUS=$(echo "$STATUS_RESP" | jq -r '.status // empty')
  VIDEO_URL=$(echo "$STATUS_RESP" | jq -r '.videoUrl // empty')
  if [ "$STATUS" = "ready" ] && [ -n "$VIDEO_URL" ]; then
    echo "Upload is ready. videoUrl=$VIDEO_URL"
    echo "Verifying playback Range request..."
    HTTP_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" -I -H "Range: bytes=0-0" "$VIDEO_URL" || true)
    echo "Playback Range response HTTP status: $HTTP_STATUS"
    if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 500 ]; then
      echo "Playback verification succeeded"
      exit 0
    else
      echo "Playback verification failed (HTTP $HTTP_STATUS)"
      exit 5
    fi
  fi
  if [ "$STATUS" = "failed" ]; then
    echo "Upload processing failed: $(echo "$STATUS_RESP" | jq -r '.errorMessage // "(no message)"')"
    exit 6
  fi
  sleep $POLL_INTERVAL
done

echo "Timed out waiting for upload to become ready after ${TIMEOUT_SECONDS}s"
exit 7
