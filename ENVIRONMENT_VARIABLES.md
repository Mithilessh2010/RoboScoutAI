# Environment Variables

RoboScoutAI now deploys as one Vercel project. The frontend, GraphQL route, FTC Events proxy routes, analytics route, Watch backend placeholders, and autoscore route scaffolds all live in `packages/web`.

## Required

| Variable | Used by | Required in Vercel | Secret | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Same-project GraphQL/API routes via TypeORM | yes | yes | Postgres connection string. Do not use local SQLite or Vercel filesystem for persistent data. |
| `FTC_EVENTS_USERNAME` | `/api/ftc/...` routes | yes | yes | FTC Events API username. Never expose with `PUBLIC_`/`NEXT_PUBLIC_`. |
| `FTC_EVENTS_AUTH_KEY` | `/api/ftc/...` routes | yes | yes | FTC Events API authorization key. Never expose with `PUBLIC_`/`NEXT_PUBLIC_`. |
| `FTC_EVENTS_API_BASE_URL` | `/api/ftc/...` routes | recommended | no | Default: `https://ftc-api.firstinspires.org/v2.0`. |

## Optional

| Variable | Used by | Secret | Notes |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | Future AI/autoscore work | yes | Not used by the current app unless a route is added later. |
| `NEXTAUTH_SECRET` | Future auth work | yes | Not used by the current SvelteKit app unless auth is added later. |
| `LOGGING` | TypeORM | no | Set to `1` only when debugging SQL. |
| `SYNC_DB` | TypeORM | no | Set to `1` only for intentional local schema sync. Avoid in production unless you knowingly accept TypeORM sync behavior. |

## Delete From Vercel

These are no longer used and should be removed from Vercel if present:

- `PUBLIC_SERVER_ORIGIN`
- `PUBLIC_FRONTEND_CODE`
- `FRONTEND_CODE`
- `BACKEND_ORIGIN`
- `API_BASE_URL`
- `SERVER_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Vercel CLI

```sh
vercel env ls
vercel env pull .env.local
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development
vercel env rm VARIABLE_NAME production
```

Unused random Vercel env vars should be removed manually in the dashboard or with `vercel env rm`.
