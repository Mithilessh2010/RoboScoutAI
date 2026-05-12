# MongoDB + Vercel Migration Guide

## ✅ Completed

1. **MongoDB Setup**
   - Created MongoDB connection utility (`packages/server/src/db/mongodb.ts`)
   - Connection pooling optimized for serverless

2. **Mongoose Schemas** (replacing TypeORM entities)
   - `Team` - `/packages/server/src/db/schemas/Team.ts`
   - `Event` - `/packages/server/src/db/schemas/Event.ts`
   - `Match` - `/packages/server/src/db/schemas/Match.ts`
   - `Award` - `/packages/server/src/db/schemas/Award.ts`
   - `TeamMatchParticipation` - `/packages/server/src/db/schemas/TeamMatchParticipation.ts`
   - `Analytics` & `ApiReq` - `/packages/server/src/db/schemas/Analytics.ts`

3. **Vercel Serverless Setup**
   - GraphQL API endpoint: `/api/graphql.ts`
   - Health check: `/api/health.ts`
   - Updated `vercel.json` with MongoDB env variable

4. **Environment Configuration**
   - Created `.env.local` with MongoDB Atlas credentials
   - Updated `constants.ts` to use MongoDB URL

5. **Package Dependencies**
   - Updated `packages/server/package.json` with Mongoose and Next.js integrations
   - Removed TypeORM, pg, WebSocket dependencies (not supported on Vercel serverless)

## ⚠️ Still TODO

### Critical Tasks
1. **Update GraphQL Resolvers**
   - Replace TypeORM queries with Mongoose queries in resolvers
   - Update loaders to use MongoDB
   - All resolvers need MongoDB-specific query syntax

2. **Update REST Endpoints**
   - Create Vercel API routes for REST endpoints
   - Migrate from Express middleware to Next.js API handlers

3. **Update FTC API Sync**
   - Modify `watchApi()` to use Mongoose models instead of TypeORM
   - Use upsert operations for creating/updating teams, events, matches

4. **Analytics Endpoint**
   - Create `/api/analytics.ts` endpoint replacing the Express POST handler

5. **Database Loaders**
   - Update/recreate loaders in `packages/server/src/db/loaders/` for MongoDB
   - Ensure batch loading still works with Mongoose

### Nice-to-Have
- WebSocket subscriptions (GraphQL subscriptions not easily supported on Vercel serverless - consider polling)
- Sitemap generation (may need adjustment)
- Watch room realtime updates (requires different architecture)

## 🚀 Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Update GraphQL Resolvers**
   - Find all `getRepository()` calls and replace with Mongoose model queries
   - Example:
     ```typescript
     // Old: await Team.find()
     // New: await Team.find()
     ```

3. **Test Locally**
   ```bash
   npm run build
   vercel dev
   ```

4. **Deploy to Vercel**
   ```bash
   vercel env add DATABASE_URL
   # Enter your MongoDB Atlas connection string
   vercel
   ```

## 📝 Connection String Format

```
mongodb+srv://mithilesshb_db_user:L38MlBTExnQQNoAW@roboscout.z2u1tyy.mongodb.net/?appName=roboscout
```

**Store securely in Vercel environment variables, not in code!**

## 🔍 Key Differences: TypeORM → Mongoose

| TypeORM | Mongoose |
|---------|----------|
| `await Team.find()` | `await Team.find()` |
| `await Team.findOne({ number: 123 })` | `await Team.findOne({ number: 123 })` |
| `await Team.save(team)` | `await team.save()` or `await Team.create(team)` |
| `await Team.update(...)` | `await Team.findByIdAndUpdate(...)` |
| `@Entity()` decorator | Mongoose Schema |
| TypeORM QueryBuilder | Mongoose Query API |

## ⚡ Vercel Serverless Constraints

- Function timeout: 30 seconds (set in `vercel.json`)
- Cold start can take 3-5 seconds
- No persistent server state
- WebSockets limited (use polling instead)
- Environment variables loaded from Vercel dashboard

## 🔗 Resources

- [Mongoose Documentation](https://mongoosejs.com/)
- [Apollo Server with Next.js](https://www.apollographql.com/docs/apollo-server/deployment/vercel/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
