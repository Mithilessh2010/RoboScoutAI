# Watch Room Notes

## Overview

Watch Room is a real shared livestream room built on the RoboScoutAI backend.

Supported routes:

- /watch
- /watch/create
- /watch/room/[roomId]

Core capabilities:

- shared room creation
- invite links
- multi-stream YouTube wall
- room chat
- synced playback controls
- control mode: Host Only or Everyone Can Control

Not included:

- voice call
- video call
- camera or mic controls
- WebRTC call system
- Jitsi or any external call embed

## Room Creation

Users create rooms from /watch/create.

Fields:

- room name
- optional season
- optional event code
- playback control mode: HOST_ONLY or EVERYONE
- optional initial YouTube stream(s)

After creation, the app redirects to /watch/room/[roomId].

## Invite Links

Each room has a shareable URL:

- /watch/room/[roomId]

The room page includes:

- room ID display
- invite link display
- copy invite link button

Anyone with the link can join for MVP.

## Display Names

Users can set a display name from the room screen.

If no saved display name exists, the room prompts for one on entry with an option to continue as Guest.

## Control Modes

Watch Room supports two persisted control modes:

- HOST_ONLY
- EVERYONE

### HOST_ONLY

- Only host can control shared playback (play/pause/seek/active stream).
- Viewers can watch and chat.
- Viewers can use Follow Host and Sync to room for alignment.

### EVERYONE

- Any participant can control shared playback.
- Last controller is tracked in playback state.

## Stream Layout Behavior

Layout auto-adjusts by stream count:

- 1 stream: single full-width view
- 2 streams: split view
- 3 streams: 3-up grid
- 4 streams: 2x2 grid
- >4 streams: responsive scrolling grid

Room controls include:

- add stream
- remove stream
- edit title
- set main stream
- focus stream
- return to grid

## YouTube URL Support

Supported input forms:

- https://www.youtube.com/watch?v=VIDEO_ID
- https://youtu.be/VIDEO_ID
- https://www.youtube.com/embed/VIDEO_ID
- https://www.youtube.com/live/VIDEO_ID
- https://www.youtube.com/shorts/VIDEO_ID

The helper normalizes to embed URLs. Unsupported links show a clear validation error and do not break room state.

## Chat

Chat is room-shared and persisted.

- users send messages with display name
- timestamps shown per message
- room history is loaded on join
- realtime updates are broadcast through backend websocket

## Playback Sync

Playback sync is implemented as best-effort shared sync.

Available controls:

- Play for room
- Pause for room
- Sync to room
- Follow host toggle (HOST_ONLY mode)

Synced state includes:

- active stream ID
- playing/paused state
- current timestamp
- last controller participant ID
- updated timestamp

The room uses YouTube IFrame Player API where available. Exact frame-level sync is not guaranteed due to browser autoplay policy, network jitter, and player buffering.

## Realtime Events

Current room websocket supports events such as:

- room:join
- room:leave
- participant:update
- stream:add
- stream:update
- stream:remove
- stream:main
- layout:update
- playback:play
- playback:pause
- playback:seek
- playback:sync
- chat:message

## Persistence

Room state is persisted in backend database and includes:

- room metadata
- control mode
- streams
- playback state
- participants
- chat messages

## Vercel Deployment Notes

Frontend can be deployed on Vercel if it connects to a stable backend origin that hosts REST + websocket routes.

Required frontend env:


The shared backend must provide:


## Known Limitations


## Future Improvements

## Simplified Watch Flow (2026-05)

- `/watch`: Simple watching page — paste streams and press "Start Party". No large form.
- `/watch/party/[roomId]`: Party page loaded from server; includes streams, simple chat (polling), invite copy, and basic playback controls.

Supported providers (initial): YouTube and Twitch channels/videos.

Party creation:
- Click `Start Party` on `/watch` — frontend calls `POST /rest/v1/watch/rooms` to create a room and PATCH to save streams.
- Invite link: `/watch/party/[roomId]`.

Chat & realtime:
- Current implementation uses polling (server REST) to remain Vercel friendly; upgrade to a managed realtime provider recommended.

Playback controls:
- Host Only (default) or Everyone. Host Only restricts control to the creator; Everyone allows everyone.

Notes:
- This simplified flow is intentionally minimal: paste stream, watch, and invite. It avoids complex dashboards and large forms.
- richer moderation controls and room permissions
