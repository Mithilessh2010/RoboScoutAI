# GraphQL Resolver Migration Guide

## Overview
All resolvers need to be updated to use Mongoose instead of TypeORM. The main changes are:
- Replace `Team` entity imports with `Team` model from `/packages/server/src/db/schemas/Team.ts`
- Replace `DATA_SOURCE.createQueryBuilder()` with Mongoose query methods
- Remove all TypeORM-specific imports (`In`, `Brackets`, `MoreThan`, etc.)

## Quick Reference

### Single Record Lookups

**Before (TypeORM):**
```typescript
import { Team } from "../../db/entities/Team";
const team = await Team.findOne({ where: { number: 123 } });
```

**After (Mongoose):**
```typescript
import { Team } from "../../db/schemas/Team";
const team = await Team.findOne({ number: 123 });
```

### Multiple Records with IN clause

**Before (TypeORM):**
```typescript
import { In } from "typeorm";
const teams = await Team.find({ where: { number: In([123, 456, 789]) } });
```

**After (Mongoose):**
```typescript
const teams = await Team.find({ number: { $in: [123, 456, 789] } });
```

### COUNT queries

**Before (TypeORM):**
```typescript
const count = await Team.count({ where: { rookieYear: MoreThan(2020) } });
```

**After (Mongoose):**
```typescript
const count = await Team.countDocuments({ rookieYear: { $gt: 2020 } });
```

### Complex Queries with QueryBuilder

**Before (TypeORM):**
```typescript
const results = await DATA_SOURCE.createQueryBuilder("team", "t")
    .where("t.state = :state", { state: "California" })
    .andWhere("t.rookieYear > :year", { year: 2020 })
    .select(["t.number", "t.name"])
    .getMany();
```

**After (Mongoose):**
```typescript
const results = await Team.find(
    { state: "California", rookieYear: { $gt: 2020 } },
    { number: 1, name: 1 }
);
```

### Aggregations / Grouping

**Before (TypeORM):**
```typescript
const raw = await DATA_SOURCE.createQueryBuilder("tep", "t")
    .select("team_number")
    .addSelect("max(opr_total_points)", "max_opr")
    .groupBy("team_number")
    .getRawMany();
```

**After (Mongoose):**
```typescript
const results = await TeamEventParticipation.aggregate([
    {
        $group: {
            _id: "$teamNumber",
            maxOpr: { $max: "$oprTotalPoints" }
        }
    },
    {
        $project: {
            teamNumber: "$_id",
            maxOpr: 1,
            _id: 0
        }
    }
]);
```

## Files to Update (Priority Order)

### 1. **Loaders** (Highest Priority - Used by All Resolvers)
Location: `packages/server/src/db/loaders/*`

Loaders handle batch queries. Need to update:
- Replace `.find({ where: {...} })` with `.find({...})`
- Replace TypeORM imports with Mongoose

### 2. **Core Resolvers**
- `Team.ts` - findTeamByNumber, findTeamsByNumbers, etc.
- `Event.ts` - findEventByCode, findEventsBySeason, etc.
- `Match.ts` - findMatchesByEvent
- `Award.ts` - findAwardsByEvent, findAwardsByTeam

### 3. **Supporting Resolvers**
- `TeamMatchParticipation.ts`
- `TeamEventParticipation.ts`
- `Home.ts`
- `Records.ts`

### 4. **Utility/Helper Files**
- `records/filter-gql.ts` - Contains complex filtering logic
- `BestName.ts`

## Database Adapter Helper

Use the `DBAdapter` utility (from `packages/server/src/db/adapter.ts`) for common queries:

```typescript
import { DBAdapter } from "../../db/adapter";

// Instead of writing custom queries:
const team = await DBAdapter.findTeamByNumber(123);
const teams = await DBAdapter.findTeamsByNumbers([123, 456]);
const event = await DBAdapter.findEventBySeasonAndCode(2024, "CODE");
```

## Special Cases

### Dynamic Collections (Season-specific tables in TypeORM)

TypeORM had dynamic entity schemas for each season (e.g., `tep_2024`, `tep_2023`).
Mongoose handles this with a `season` field and indexes:

**Before:**
```typescript
const queryBuilder = DATA_SOURCE.createQueryBuilder(`tep_${season}`, "t");
```

**After:**
```typescript
const results = TeamEventParticipation.find({ season });
```

### Subscriptions/PubSub

TypeORM used `pubsub` for GraphQL subscriptions. Vercel serverless doesn't support persistent WebSockets.

**Solution:** Use polling or webhooks instead. Update `resolvers/pubsub.ts` accordingly.

## Testing

After updating resolvers:

```bash
# Build all packages
npm run build

# Start local dev server
vercel dev

# Query GraphQL at http://localhost:3000/api/graphql
```

## Common Migration Patterns

| Operation | TypeORM | Mongoose |
|-----------|---------|----------|
| Find one | `.findOne({ where: {...} })` | `.findOne({...})` |
| Find many | `.find({ where: {...} })` | `.find({...})` |
| Count | `.count({ where: {...} })` | `.countDocuments({...})` |
| Update | `.update({...}, data)` | `.findOneAndUpdate({...}, data)` |
| Delete | `.remove(entity)` | `.deleteOne({...})` |
| Upsert | `createQueryBuilder().upsert()` | `.findOneAndUpdate({...}, data, {upsert: true})` |
| Sum/Max/etc | `getRepository().query(sql)` | `.aggregate([{$group}])` |

## Import Changes

**Remove these imports:**
```typescript
import { In, Brackets, MoreThan, ... } from "typeorm";
import { DATA_SOURCE } from "../../db/data-source";
```

**Add these imports:**
```typescript
import { Team } from "../../db/schemas/Team";
import { Event } from "../../db/schemas/Event";
// etc.
```

## Need Help?

For complex migration of a specific resolver:
1. Save the old TypeORM version
2. Write equivalent Mongoose query
3. Test with sample data
4. Update resolvers
5. Run tests

Example: See `packages/server/src/db/adapter.ts` for pre-built common queries
