# Deployment Notes

RoboScoutAI should deploy as one Vercel project from this repository.

## Vercel Settings

- Root Directory: repository root
- Install Command: `npm install`
- Build Command: `npm run web:vercel-build`
- Output Directory: leave empty/default. The build command copies `packages/web/.vercel/output` to `.vercel/output`.

## Environment Variables

Required in production and preview:

```sh
DATABASE_URL=
FTC_EVENTS_USERNAME=
FTC_EVENTS_AUTH_KEY=
FTC_EVENTS_API_BASE_URL=https://ftc-api.firstinspires.org/v2.0
```

Do not set FTC credentials with `PUBLIC_`, `NEXT_PUBLIC_`, or `VITE_` prefixes.

Remove old split-backend variables from Vercel:

```sh
vercel env rm PUBLIC_SERVER_ORIGIN production
vercel env rm PUBLIC_FRONTEND_CODE production
vercel env rm FRONTEND_CODE production
vercel env rm BACKEND_ORIGIN production
vercel env rm API_BASE_URL production
vercel env rm SERVER_URL production
```

Run the same removals for `preview` and `development` if those environments contain stale values.

## Local Development

Use local Postgres or a development Postgres URL in `packages/web/.env.local`:

```sh
DATABASE_URL=postgres://ftcscoutuser:ftcscoutpassword@localhost:5432/ftcscoutdb
FTC_EVENTS_USERNAME=your_username_here
FTC_EVENTS_AUTH_KEY=your_authorization_key_here
FTC_EVENTS_API_BASE_URL=https://ftc-api.firstinspires.org/v2.0
```

Start the app with:

```sh
npm run web:dev
```

The SvelteKit dev server owns the frontend and backend routes.

## API Routes

- GraphQL: `/graphql`
- FTC Events proxy: `/api/ftc/...`
- Watch placeholders: `/api/watch/...`
- Autoscore placeholders: `/api/autoscore/...`
- Analytics: `/analytics`
- Sitemap: `/sitemap.xml`

No separate backend URL or second deployment is required.
