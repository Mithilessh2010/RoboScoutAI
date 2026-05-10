# RoboScoutAI

RoboScoutAI is a SvelteKit monorepo app for FTC scouting data.

Live site: https://roboscoutai.vercel.app

## Architecture

The app deploys as one Vercel project:

- Frontend: `packages/web`
- Same-project GraphQL route: `/graphql`
- FTC Events proxy routes: `/api/ftc/...`
- Analytics route: `/analytics`
- Sitemap route: `/sitemap.xml`
- Watch page: `/watch`, local/browser state only
- Autoscore placeholders: `/api/autoscore/...`

The shared backend/data code lives in `packages/server`, but it is no longer a separate deployed backend app.

## Local Development

```sh
npm install
npm run web:dev
```

Use `packages/web/.env.local` for local app env:

```sh
DATABASE_URL="postgres://ftcscoutuser:ftcscoutpassword@localhost:5432/ftcscoutdb"
FTC_EVENTS_USERNAME="your_ftc_events_username"
FTC_EVENTS_AUTH_KEY="your_ftc_events_authorization_key"
FTC_EVENTS_API_BASE_URL="https://ftc-api.firstinspires.org/v2.0"
```

## Vercel

Use one Vercel project with:

- Root Directory: repository root
- Install Command: `npm install`
- Build Command: `npm run web:vercel-build`
- Output Directory: default/empty

Required Vercel env vars:

```sh
DATABASE_URL=
FTC_EVENTS_USERNAME=
FTC_EVENTS_AUTH_KEY=
FTC_EVENTS_API_BASE_URL=https://ftc-api.firstinspires.org/v2.0
```

See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md), [DEPLOYMENT_NOTES.md](DEPLOYMENT_NOTES.md), and [VERCEL_BACKEND_MIGRATION.md](VERCEL_BACKEND_MIGRATION.md).
