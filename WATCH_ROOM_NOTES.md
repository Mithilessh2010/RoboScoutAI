# Watch Room Notes

## What Was Added

RoboScoutAI Watch Room adds a competition-focused stream wall for FTC teams.

Routes:

- `/watch`
- `/watch/create`
- `/watch/room/[roomId]`
- `/events/[season]/[code]/watch`

Components:

- `LayoutSelector.svelte`
- `StreamGrid.svelte`
- `StreamCard.svelte`
- `AddStreamForm.svelte`
- `InvitePanel.svelte`
- `RoomNotesPanel.svelte`
- `EventSchedulePanel.svelte`

Utilities:

- `youtubeEmbed.ts`
- `watchRoomStorage.ts`
- `roomId.ts`
- `types.ts`

## How Rooms Work

Rooms are created in the browser. A room includes:

- room name
- optional season
- optional event code
- selected stream layout
- stream list
- notes

## Persistence

Watch Room uses `localStorage` for the MVP. This avoids database migrations and keeps the existing FTCScout/RoboScoutAI data functionality untouched.

LocalStorage means:

- rooms are saved on the device that created/opened them
- notes are local to that browser
- invite links can carry initial room state
- changes after sharing are not real-time synced

## Invite Links

Invite links use `/watch/room/[roomId]`.

When possible, the link includes encoded initial room state in a `state` query parameter. This lets another browser open the same starting stream set without needing backend persistence.

## Supported Stream URL Formats

The MVP supports YouTube URLs:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/live/VIDEO_ID`

Unsupported links show helpful error text instead of breaking the room.

## Event Schedule

If a room has a season and event code, the schedule panel attempts to load:

```text
/api/ftc/schedule?season=SEASON&eventCode=EVENT_CODE
```

If the schedule request fails, streams and notes still work.

## Known Limitations

- No auth requirement for MVP.
- No real-time collaboration yet.
- Room edits are not synced across users after the invite is opened.
- Notes are stored per browser.
- QR codes are not included yet.

## Future Improvements

- Backend room persistence.
- Shared notes.
- Viewer presence.
- WebSocket or realtime room state sync.
- Match-linked notes.
- Team-linked notes.
- QR invite code.
