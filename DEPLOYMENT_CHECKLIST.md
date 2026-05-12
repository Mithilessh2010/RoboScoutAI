# Vercel + MongoDB Deployment Checklist

## ✅ Completed Tasks

### Database & Connection
- [x] MongoDB Atlas cluster created
- [x] MongoDB credentials configured
- [x] Mongoose schemas created for all entities
- [x] MongoDB connection handler with serverless pooling
- [x] Database adapter layer created

### Vercel Setup
- [x] API route handlers created (`/api/graphql.ts`, `/api/health.ts`)
- [x] `vercel.json` updated with MongoDB env variable support
- [x] Root `package.json` scripts updated for Vercel build
- [x] `.env.local` created with MongoDB connection string
- [x] Apollo Server configured for Vercel serverless

### Documentation
- [x] Migration guide created (`MONGODB_MIGRATION.md`)
- [x] Resolver migration guide created (`RESOLVER_MIGRATION_GUIDE.md`)
- [x] Database adapter helper functions provided
- [x] Example MongoDB loader provided

## 🚨 CRITICAL - Must Do Next

### 1. **Update All GraphQL Resolvers**
**Location:** `packages/server/src/graphql/resolvers/*`

Replace all TypeORM queries with Mongoose. Key resolvers:
- [ ] `Team.ts` - Update team queries
- [ ] `Event.ts` - Update event queries  
- [ ] `Match.ts` - Update match queries
- [ ] `Award.ts` - Update award queries
- [ ] `TeamMatchParticipation.ts` - Update participation queries
- [ ] `TeamEventParticipation.ts` - Update TEP queries
- [ ] `Home.ts` - Update home page resolver
- [ ] `Records.ts` - Update records resolver
- [ ] `BestName.ts` - Update best name resolver
- [ ] `records/filter-gql.ts` - Update filter logic

**Reference:** Use `RESOLVER_MIGRATION_GUIDE.md` for patterns

### 2. **Update All Loaders**
**Location:** `packages/server/src/db/loaders/*`

Replace with MongoDB versions:
- [ ] `load-all-teams.ts` → Use `Team.bulkWrite()`
- [ ] `load-all-events.ts` → Use `Event.bulkWrite()`
- [ ] `load-all-matches.ts` → Use `Match.bulkWrite()`
- [ ] `load-all-awards.ts` → Use `Award.bulkWrite()`
- [ ] `load-all-standings.ts` → Update aggregation
- [ ] `load-future-events.ts` → Update queries

**Template:** See `loaders-mongodb/load-all-teams.ts` for pattern

### 3. **Create Missing MongoDB Schemas**
- [ ] `FtcApiReq` - API request tracking
- [ ] `BestName` - Best team name caching
- [ ] `WatchRoom` - Watch room collections
- [ ] `WatchRoomMessage` - Watch room messages
- [ ] Any dynamic season-specific schemas

### 4. **Update FTC API Sync**
**File:** `packages/server/src/ftc-api/watch.ts`

Already imports updated loaders, just ensure loaders are migrated

### 5. **Create REST API Endpoints**
**Location:** Create `/api/*.ts` files for each endpoint

- [ ] `/api/analytics.ts` - POST analytics events
- [ ] `/api/banner.ts` - Banner routes
- [ ] `/api/sitemap.xml.ts` - Sitemap generation
- [ ] Any other REST endpoints

### 6. **Remove Old Code**
- [ ] Delete `packages/server/src/db/data-source.ts` (TypeORM)
- [ ] Delete `packages/server/src/db/entities/` directory
- [ ] Delete `packages/server/src/index.ts` (old Express server)
- [ ] Delete `fly.*.toml` files (no longer needed)
- [ ] Remove `pg`, `typeorm`, `typeorm-naming-strategies` from dependencies

## 📋 Testing Checklist

Before deploying to production:

```bash
# 1. Install dependencies
npm install

# 2. Build all packages
npm run build

# 3. Test locally
vercel dev

# 4. Test GraphQL
# Open browser to http://localhost:3000/api/graphql
# Try sample queries

# 5. Check environment
# Verify .env.local has correct MongoDB URL

# 6. Test health endpoint
# curl http://localhost:3000/api/health
```

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: migrate to MongoDB and Vercel serverless"
git push origin main
```

### Step 2: Configure Vercel Project
```bash
# Login to Vercel or use CLI
vercel login

# Link your project
vercel link
```

### Step 3: Set Environment Variables
```bash
vercel env add DATABASE_URL
# Paste: mongodb+srv://mithilesshb_db_user:L38MlBTExnQQNoAW@roboscout.z2u1tyy.mongodb.net/?appName=roboscout
```

### Step 4: Deploy
```bash
vercel deploy --prod
```

### Step 5: Verify Deployment
- Check Vercel dashboard for build success
- Test GraphQL endpoint: `https://your-domain/api/graphql`
- Test health endpoint: `https://your-domain/api/health`

## 🐛 Troubleshooting

### MongoDB Connection Timeout
- Verify network access is set to "Allow from anywhere" (0.0.0.0/0)
- Check DATABASE_URL environment variable is set
- Ensure Vercel has internet access

### GraphQL Query Fails
- Check resolver migration - ensure all TypeORM calls are updated
- Check browser DevTools console for error details
- Review Vercel Function logs for server errors

### Build Fails
- Verify `npm run build` works locally
- Check all imports are correct (especially from schemas)
- Ensure `tsconfig.json` includes `api/` directory

## 📊 Performance Tuning

After deployment:
1. Check Vercel dashboard for function execution times
2. Monitor MongoDB connection pool status
3. Consider enabling caching in GraphQL responses
4. Set up performance monitoring/alerting

## 🎯 Final Verification

- [ ] GraphQL endpoint responds to queries
- [ ] Health endpoint returns `{ status: "ok", db: "connected" }`
- [ ] Teams are fetched from MongoDB
- [ ] Events appear in query results
- [ ] Analytics endpoint logs events
- [ ] No TypeORM errors in function logs

## Need Help?

1. **Resolver queries:** See `RESOLVER_MIGRATION_GUIDE.md`
2. **Database patterns:** See `MONGODB_MIGRATION.md`
3. **API routes:** Check `/api/` directory for examples
4. **Mongoose docs:** https://mongoosejs.com/

---

**Estimated Time to Complete:** 4-6 hours for full migration

**Key Principle:** Migrate incrementally, test each component, then deploy
