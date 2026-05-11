# FTCScout Local Setup

This keeps the original FTCScout app running locally with Postgres and the FTC Events API.
Do not put real secrets in `.env.example` files or frontend code.

## Node

Use Node 20. This repo depends on `canvas`, and the original setup notes recommend Node 20 if `canvas` install/build errors occur.

```bash
nvm use
npm install
```

## Postgres On Mac

```bash
brew install postgresql@16
brew services start postgresql@16
createuser ftcscoutuser
createdb ftcscoutdb
psql ftcscoutdb
```

Inside `psql`:

```sql
ALTER USER ftcscoutuser WITH PASSWORD 'ftcscoutpassword';
GRANT ALL PRIVILEGES ON DATABASE ftcscoutdb TO ftcscoutuser;
GRANT ALL PRIVILEGES ON SCHEMA public TO ftcscoutuser;
\quit
```

Local database URL:

```text
postgres://ftcscoutuser:ftcscoutpassword@localhost:5432/ftcscoutdb
```

FTCScout uses TypeORM with `SYNC_DB=1` to create/update the local schema. There are no separate migration commands in this repo.

## FTC API Key

FTCScout expects the FTC Events API credential in `FTC_API_KEY` as a Base64 encoded string:

```text
username:authorization-key
```

On Mac/Linux:

```bash
echo -n "YOUR_USERNAME:YOUR_API_KEY" | base64
```

Use the command output as `FTC_API_KEY` in `packages/server/.env`. The `-n` matters because a trailing newline changes the encoded value.

## Server Env

Create `packages/server/.env` from `packages/server/.env.example`.

Required variables:

```env
FTC_API_KEY="BASE64_ENCODED_FTC_EVENTS_USERNAME_COLON_AUTHORIZATION_KEY"
DATABASE_URL="postgres://ftcscoutuser:ftcscoutpassword@localhost:5432/ftcscoutdb"
PORT=4000
FRONTEND_CODE="local-dev-frontend-code"
LOGGING=0
SYNC_DB=1
SYNC_API=1
CACHE_REQ=1
DB_TIMEOUT=5000
```

`FRONTEND_CODE` is a shared header name used by the web app. It can be any non-secret string, but it must exactly match `PUBLIC_FRONTEND_CODE` in `packages/web/.env`.

## Web Env

Create `packages/web/.env.local` from `packages/web/.env.example`.

Required variables:

```env
PUBLIC_SERVER_ORIGIN="localhost:4000"
PUBLIC_FRONTEND_CODE="local-dev-frontend-code"
```

Optional - FTC Events API credentials (web package):

```env
FTC_EVENTS_USERNAME="your_username_here"
FTC_EVENTS_AUTH_KEY="your_authorization_key_here"
FTC_EVENTS_API_BASE_URL="https://ftc-api.firstinspires.org/v2.0"
```

`PUBLIC_*` variables are exposed to the browser. Do not put secrets in variables prefixed with `PUBLIC_`. The FTC API credentials (without PUBLIC_ prefix) are server-side only and never exposed to the browser.

If FTC_EVENTS_USERNAME and FTC_EVENTS_AUTH_KEY are not set, the app will use mock data as fallback.

After setting FTC credentials, restart the dev server to pick up the new environment variables.

## Run Commands

Run these from the repo root in separate terminals.

Terminal 1:

```bash
npm run common:watch
```

Terminal 2:

```bash
npm run server:watch
```

Terminal 3:

```bash
npm run server:dev
```

The server starts on `localhost:4000`. With `SYNC_API=1`, it will begin syncing FTC data. The first full data sync can take a long time.

After the server is running:

Terminal 4:

```bash
npm run web:gen
npm run web:dev
```

The web dev server prints the local browser URL, usually `http://localhost:5173/`.

## Common Errors

`unexpected end of JSON input` usually means the FTC API key is wrong or formatted incorrectly. Recheck that `FTC_API_KEY` is Base64 of `username:authorization-key` with no newline:

```bash
echo -n "YOUR_USERNAME:YOUR_API_KEY" | base64
```

`Connection Refused on port 5432` means Postgres is not reachable. Check that Postgres is running, `DATABASE_URL` uses the right database/user/password/port, and the database exists.

If `web:gen` fails, make sure the backend is already running at `http://localhost:4000/graphql`.

If `server:build` cannot find `@ftc-scout/common`, make sure `npm run common:watch` is running or run `npm run common:build` once before the server build.
