# Vercel Backend Migration

## Old Architecture

- `packages/web` was the SvelteKit frontend deployed to Vercel.
- `packages/server` was a separate Express/Apollo/TypeORM backend with GraphQL, REST, analytics, sitemap, FTC sync, and WebSocket watch-room code.
- The frontend used `PUBLIC_SERVER_ORIGIN` to call the separate backend for `/graphql`, `/analytics`, sitemap XML, and Watch room APIs.
- Separate Fly/Docker deployment files existed for web and server.

## What Was Found

- No Supabase, Firebase, Pusher, Ably, or Supabase Realtime app code was found.
- External backend assumptions were found in frontend GraphQL, analytics, sitemap, Watch room code, env docs, Fly config, Dockerfiles, and codegen config.
- The existing database layer is TypeORM with Postgres through `DATABASE_URL`.
- FTC Events API proxy routes already existed in `packages/web/src/routes/api/ftc`.

## What Changed

- Added same-project SvelteKit `/graphql` route that executes the existing GraphQL schema against the existing TypeORM/Postgres database.
- Added same-project `/analytics` route.
- Replaced frontend GraphQL and analytics clients with relative same-origin paths.
- Replaced sitemap proxying with a same-project sitemap route backed by the database.
- Removed Fly configs, Dockerfiles, and the standalone Express/WebSocket server entry.
- Removed Watch room/party/chat route entry points and old Watch backend UI code. `/watch` remains the simple local multi-stream page.
- Added Vercel-owned autoscore route scaffolds:
  - `POST /api/autoscore/jobs`
  - `GET /api/autoscore/jobs/[jobId]`
  - `POST /api/autoscore/jobs/[jobId]/analyze`
  - `GET /api/autoscore/jobs/[jobId]/result`

## Backend Now Inside Vercel

The deployed Vercel project owns:

- SvelteKit frontend routes
- `/graphql`
- `/analytics`
- `/sitemap.xml`
- `/api/ftc/...`
- `/api/watch/...` disabled placeholders documenting the local-only Watch decision
- `/api/autoscore/...` placeholders for future job ownership

## Database

The app uses the existing TypeORM entities and Postgres through `DATABASE_URL`.

Production should use a normal Postgres connection string from the provider you choose. Do not use Supabase Postgres for this migration. Vercel itself is not a persistent database, and persistent data must not be stored in the Vercel filesystem.

## Autoscore Plan

Autoscore is scaffolded as app-owned API routes only. The current responses are explicit `501 not_implemented` placeholders.

Long video processing should not be built directly into Vercel serverless functions because of timeout and resource limits. A future implementation should create a job record, store video metadata, and call a processing module or worker boundary when approved.

Production video storage is not implemented. Vercel Blob or another app-owned object storage option can be added later, but Supabase Storage is not used.

## Known Limitations

- GraphQL subscriptions and Watch WebSockets were removed from the deployed architecture.
- `/watch` is local/browser-only and uses local state.
- Autoscore job persistence, video upload, and CV processing are intentionally not implemented yet.
- FTC sync utilities still exist as local/server-side library code, but there is no separate backend deployment target.
