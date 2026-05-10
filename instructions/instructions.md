# RoboScoutAI Instructions

RoboScoutAI now uses a one-project Vercel architecture. Do not configure a separate backend origin.

Use:

- `DATABASE_URL` for Postgres
- `FTC_EVENTS_USERNAME`
- `FTC_EVENTS_AUTH_KEY`
- `FTC_EVENTS_API_BASE_URL`

The SvelteKit app owns `/graphql`, `/api/ftc/...`, `/analytics`, `/sitemap.xml`, `/api/watch/...`, and `/api/autoscore/...`.
