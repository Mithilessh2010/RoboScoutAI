# Environment Variables

This repo uses separate env files for the SvelteKit web app and the optional backend server. Do not commit real `.env` files or real credentials.

## Files

- `packages/web/.env.local` - local SvelteKit frontend and web API route settings.
- `packages/web/.env` - optional local fallback for the web package.
- `packages/server/.env` - local GraphQL/backend server settings.
- Root `.env.local` - not required by the current project.

## Web Variables

| Variable | Package | Local | Vercel | Secret | Example |
| --- | --- | --- | --- | --- | --- |
| `PUBLIC_SERVER_ORIGIN` | `packages/web` | yes | yes | no, public | Local: `localhost:4000`; Vercel: `api.ftcscout.org` |
| `PUBLIC_FRONTEND_CODE` | `packages/web` | yes | yes | no, public | `local-dev-frontend-code` |
| `FTC_EVENTS_USERNAME` | `packages/web` API routes | yes | yes | yes | `your_ftc_events_username` |
| `FTC_EVENTS_AUTH_KEY` | `packages/web` API routes | yes | yes | yes | `your_ftc_events_authorization_key` |
| `FTC_EVENTS_API_BASE_URL` | `packages/web` API routes | yes | yes | no | `https://ftc-api.firstinspires.org/v2.0` |

`PUBLIC_*` values are exposed to the browser. Never put secrets in `PUBLIC_*` variables.

For Vercel production, `PUBLIC_SERVER_ORIGIN` must not be `localhost:4000`. Use:

```env
PUBLIC_SERVER_ORIGIN="api.ftcscout.org"
```

## Server Variables

These are used by `packages/server` when running the database-backed GraphQL/API server.

| Variable | Package | Local | Vercel | Secret | Example |
| --- | --- | --- | --- | --- | --- |
| `FTC_API_KEY` | `packages/server` | yes | only if deploying server | yes | Base64 of `username:authorization-key` |
| `DATABASE_URL` | `packages/server` | yes | only if deploying server | yes | `postgres://user:password@localhost:5432/ftcscoutdb` |
| `PORT` | `packages/server` | yes | usually platform-provided | no | `4000` |
| `FRONTEND_CODE` | `packages/server` | yes | only if deploying server | yes-ish | `local-dev-frontend-code` |
| `LOGGING` | `packages/server` | yes | only if deploying server | no | `0` |
| `SYNC_DB` | `packages/server` | yes | only if deploying server | no | `1` |
| `SYNC_API` | `packages/server` | yes | only if deploying server | no | `1` |
| `CACHE_REQ` | `packages/server` | yes | only if deploying server | no | `1` |
| `DB_TIMEOUT` | `packages/server` | yes | only if deploying server | no | `5000` |

`FRONTEND_CODE` should match `PUBLIC_FRONTEND_CODE` when using the local backend.

### Render backend setup

For a Render deployment that keeps the database inside the backend service, use:

```env
DATABASE_URL="sqlite:/var/data/ftcscout.db"
PORT=10000
```

Add `FTC_API_KEY` as a secret env var in Render, and mount a persistent disk at `/var/data`.

## Local Setup

1. Copy `packages/web/.env.example` to `packages/web/.env.local`.
2. Copy `packages/server/.env.example` to `packages/server/.env` if running the backend locally.
3. Fill in real FTC Events credentials locally.
4. Keep `PUBLIC_SERVER_ORIGIN="localhost:4000"` locally if you run `packages/server`.
5. Use `PUBLIC_SERVER_ORIGIN="api.ftcscout.org"` when deploying only the web app to Vercel.

For Render, point `PUBLIC_SERVER_ORIGIN` at the Render service URL instead.

## Vercel Setup

The deployed web app needs these production variables:

```text
PUBLIC_SERVER_ORIGIN
PUBLIC_FRONTEND_CODE
FTC_EVENTS_USERNAME
FTC_EVENTS_AUTH_KEY
FTC_EVENTS_API_BASE_URL
```

Useful Vercel CLI commands:

```bash
vercel env ls
vercel env pull .env.local
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development
```

If Vercel has random, duplicate, or unused variables, clean them manually in the Vercel dashboard or with:

```bash
vercel env rm VARIABLE_NAME production
```

After changing Vercel env vars, redeploy production:

```bash
npx vercel deploy --prod
```

## Notes

- Vercel stores env vars per environment: Production, Preview, and Development.
- Pulling env vars with `vercel env pull .env.local` writes a local file. Review it before copying values into package-specific env files.
- Do not commit pulled `.env.local` files.
- The web FTC proxy routes use `FTC_EVENTS_*`; the backend server uses `FTC_API_KEY`.
