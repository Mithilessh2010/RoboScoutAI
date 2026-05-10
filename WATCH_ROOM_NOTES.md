# Watch Page Notes

The Watch page is intentionally simple in the one-project Vercel architecture.

Current behavior:

- `/watch` lets users add and view multiple YouTube/Twitch streams in one browser.
- Saved stream state can remain browser-local.
- No party rooms.
- No chat.
- No realtime provider.
- No WebSocket server.
- No Supabase, Firebase, Pusher, Ably, or other backend service.

The older shared-room/watch-party backend was removed from the deployed app path. Placeholder `/api/watch/...` routes return explicit disabled responses so stale clients fail clearly instead of silently depending on a second backend.
