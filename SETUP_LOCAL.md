# Local Setup

## Requirements

- Node.js compatible with the repo `engines` field
- npm
- Postgres

## Database

Create a local Postgres database, then set:

```sh
DATABASE_URL="postgres://ftcscoutuser:ftcscoutpassword@localhost:5432/ftcscoutdb"
```

The app uses TypeORM and Postgres. Do not use local SQLite for production-like testing.

## Web App

Create `packages/web/.env.local`:

```sh
DATABASE_URL="postgres://ftcscoutuser:ftcscoutpassword@localhost:5432/ftcscoutdb"
FTC_EVENTS_USERNAME="your_username_here"
FTC_EVENTS_AUTH_KEY="your_authorization_key_here"
FTC_EVENTS_API_BASE_URL="https://ftc-api.firstinspires.org/v2.0"
```

Install and run:

```sh
npm install
npm run web:dev
```

The SvelteKit dev server owns both frontend and backend routes, including `/graphql` and `/api/ftc/...`.

## Data Sync Utilities

Legacy FTC data sync code remains in `packages/server` as local/server-side library code. It is not deployed as a second backend app. Use it only for intentional local data maintenance.
