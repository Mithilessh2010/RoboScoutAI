# RoboScoutAI

RoboScoutAI is a working Next.js MVP for FTC scouting: season/team/event browsing, rankings, OPR/stat utilities, watch rooms, manual scouting, uploaded video timeline tagging, AI assistant wiring, picklists, dashboard, settings, and a future autoscore scaffold.

## Run Locally

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

Open http://localhost:3000.

## Environment Variables

- `OPENROUTER_API_KEY`: Enables `/api/ai/chat`.
- `DATABASE_URL`: Defaults to SQLite for the MVP, for example `file:./dev.db`.
- `NEXTAUTH_SECRET`: Placeholder for future auth.
- `FTC_EVENTS_API_BASE_URL`: Defaults to `https://ftc-api.firstinspires.org/v2.0`.
- `FTC_EVENTS_USERNAME`: Server-only FTC Events API username.
- `FTC_EVENTS_AUTH_KEY`: Server-only FTC Events API authorization key. Never expose this in browser code or commit it.

The app calls its own `/api/ftc/...` proxy routes. Browser/client code never calls the FTC Events API directly.

## PostgreSQL Later

Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL` to your Postgres connection string, then run `npx prisma migrate dev`.

## Current Status

The app uses typed mock data for a realistic local-first MVP. Prisma schema and seed are included for database migration, but the pages read from the mock data module so the app works immediately.

When FTC Events credentials are set, the app prefers live FTC data and keeps mock data as a fallback.
