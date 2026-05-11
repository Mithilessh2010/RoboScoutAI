# RoboScoutAI

RoboScoutAI is a modern FTC scouting, statistics, and strategy platform built for teams that need fast access to competition data. It combines team search, event discovery, rankings, match data, OPR-style stats, and detailed event/team views in a polished robotics-focused interface.

Live site: https://roboscoutai.vercel.app

## Highlights

- Team search and team detail pages
- Event search, event detail pages, rankings, matches, awards, and insights
- Compact scouting/statistics tables designed for competition use
- FTC Events API proxy routes for live official data
- GraphQL-powered historical scouting data
- 3D and visual match/stat views where supported
- Light and dark mode UI
- Collaborative Watch Room for multi-stream event viewing
- RoboScoutAI visual theme, logo, favicon, and Vercel deployment support

## Project Structure

```text
packages/
  common/   Shared FTC constants, types, and utilities
  server/   GraphQL/API server and database-backed scouting data
  web/      SvelteKit frontend deployed to Vercel
```

## Requirements

- Node.js 24 for the Vercel web deployment path
- npm
- PostgreSQL if running the local backend database
- FTC Events API credentials for live official FTC data

## Install

```bash
npm install
```

## Environment Variables

Do not commit real secrets. Local env files are intentionally ignored.

Full env reference: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

### Web

Create or update `packages/web/.env.local`:

```env
PUBLIC_SERVER_ORIGIN="localhost:4000"
FTC_EVENTS_USERNAME="your_ftc_events_username"
FTC_EVENTS_AUTH_KEY="your_ftc_events_authorization_key"
FTC_EVENTS_API_BASE_URL="https://ftc-api.firstinspires.org/v2.0"
```

For Vercel production, `PUBLIC_SERVER_ORIGIN` should not be `localhost:4000`. Use the production GraphQL origin:

```env
PUBLIC_SERVER_ORIGIN="api.ftcscout.org"
```

### Server

Create or update `packages/server/.env`:

```env
FTC_API_KEY="base64_username_colon_authorization_key"
DATABASE_URL="postgres://user:password@localhost:5432/database"
PORT=4000
LOGGING=0
SYNC_DB=1
SYNC_API=1
CACHE_REQ=1
RESPONSE_CACHE_SECONDS=0
DB_TIMEOUT=5000
```

## Local Development

Run these from the repo root.

Build shared code:

```bash
npm run common:build
```

Start the backend:

```bash
npm run server:dev
```

Start the frontend:

```bash
npm run web:dev
```

The frontend usually runs at `http://localhost:5173`.

## Useful Commands

```bash
npm run web:check
npm run web:build
npm run web:vercel-build
npm run server:build
npm run common:build
```

Run the full workspace check:

```bash
npm run check
```

## Deploying to Vercel

The web app is configured for Vercel with:

- `vercel.json`
- `@sveltejs/adapter-vercel`
- `npm run web:vercel-build`

Deploy production:

```bash
npx vercel deploy --prod
```

Before deploying, make sure the Vercel project has the required production environment variables:

```text
PUBLIC_SERVER_ORIGIN
FTC_EVENTS_USERNAME
FTC_EVENTS_AUTH_KEY
FTC_EVENTS_API_BASE_URL
```

If the deployed site shows an internal error, first check that `PUBLIC_SERVER_ORIGIN` is not set to `localhost:4000` in Vercel.

## Watch Room

Watch Room lets teams create a shared stream wall for FTC events.

- Create a room at `/watch/create`
- Share the invite link from `/watch/room/[roomId]`
- Add YouTube livestreams
- Switch between 1, 2, and 4 stream layouts
- Save timestamped room notes
- Optionally attach the room to a season and event code for schedule context

Watch Room uses browser `localStorage` for the MVP, so room edits and notes are local to each browser. Invite links can include the initial stream setup, but real-time shared editing is a future improvement.

More details: [WATCH_ROOM_NOTES.md](./WATCH_ROOM_NOTES.md)

## Notes

- `PUBLIC_*` variables are visible in the browser. Never put secrets in `PUBLIC_*` values.
- FTC Events credentials should stay server-side.
- The frontend deployment can use the production GraphQL origin while the local dev app can use `localhost:4000`.
- For fresher reload data on the backend, keep `RESPONSE_CACHE_SECONDS=0`.
- Build warnings about large chunks may appear because some visualization/stat bundles are large; they do not necessarily mean deployment failed.
