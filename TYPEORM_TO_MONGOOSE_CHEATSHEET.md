# Quick Reference: TypeORM → Mongoose Queries

Copy & paste this for instant migration help!

## Finding Records

### Find by ID
```typescript
// TypeORM
const team = await Team.findOne({ where: { number: 123 } });
const event = await Event.findOne({ where: { season: 2024, code: "ABC" } });

// Mongoose
const team = await Team.findOne({ number: 123 });
const event = await Event.findOne({ season: 2024, code: "ABC" });
```

### Find Multiple Records
```typescript
// TypeORM
const teams = await Team.find({ where: { number: In([1,2,3]) } });

// Mongoose
const teams = await Team.find({ number: { $in: [1,2,3] } });
```

### Find with Conditions
```typescript
// TypeORM
const teams = await Team.find({ 
  where: { 
    rookieYear: MoreThan(2020), 
    state: "California" 
  } 
});

// Mongoose
const teams = await Team.find({ 
  rookieYear: { $gt: 2020 },
  state: "California"
});
```

### Select Specific Fields
```typescript
// TypeORM
const teams = await Team.find({ select: { number: true, name: true } });

// Mongoose
const teams = await Team.find({}, { number: 1, name: 1 });
```

## Counting

```typescript
// TypeORM
const count = await Team.count();
const count = await Team.count({ where: { state: "California" } });

// Mongoose
const count = await Team.countDocuments();
const count = await Team.countDocuments({ state: "California" });
```

## Saving Data

### Insert One
```typescript
// TypeORM
const team = Team.create({ number: 123, name: "Team Name" });
await team.save();

// Mongoose
const team = await Team.create({ number: 123, name: "Team Name" });
// or
const team = new Team({ number: 123, name: "Team Name" });
await team.save();
```

### Bulk Insert/Upsert
```typescript
// TypeORM
await em.save(teams, { chunk: 100 });

// Mongoose
const bulkOps = teams.map(team => ({
  updateOne: {
    filter: { number: team.number },
    update: { $set: team },
    upsert: true
  }
}));
await Team.bulkWrite(bulkOps);
```

## Updating

### Update One
```typescript
// TypeORM
await Team.update({ number: 123 }, { name: "New Name" });

// Mongoose
await Team.findOneAndUpdate({ number: 123 }, { name: "New Name" });
// or
const team = await Team.findOne({ number: 123 });
team.name = "New Name";
await team.save();
```

### Update Multiple
```typescript
// TypeORM
await Team.update({ state: "California" }, { updated: new Date() });

// Mongoose
await Team.updateMany({ state: "California" }, { updated: new Date() });
```

## Deleting

```typescript
// TypeORM
await Team.remove(team);
await Team.delete({ number: 123 });

// Mongoose
await Team.deleteOne({ number: 123 });
await Team.deleteMany({ state: "California" });
```

## Complex Queries

### Aggregation / GroupBy
```typescript
// TypeORM
const results = await DATA_SOURCE.createQueryBuilder("team", "t")
  .select("state")
  .addSelect("count(*)", "count")
  .groupBy("state")
  .getRawMany();

// Mongoose
const results = await Team.aggregate([
  {
    $group: {
      _id: "$state",
      count: { $sum: 1 }
    }
  }
]);
```

### Sorting & Pagination
```typescript
// TypeORM
const teams = await Team.find({
  where: { state: "California" },
  order: { number: "ASC" },
  skip: 10,
  take: 20
});

// Mongoose
const teams = await Team
  .find({ state: "California" })
  .sort({ number: 1 })
  .skip(10)
  .limit(20);
```

## Common Operators

| TypeORM | Mongoose | Meaning |
|---------|----------|---------|
| `In([1,2,3])` | `{ $in: [1,2,3] }` | In array |
| `MoreThan(5)` | `{ $gt: 5 }` | Greater than |
| `LessThan(5)` | `{ $lt: 5 }` | Less than |
| `MoreThanOrEqual(5)` | `{ $gte: 5 }` | Greater than or equal |
| `LessThanOrEqual(5)` | `{ $lte: 5 }` | Less than or equal |
| `Not(x)` | `{ $ne: x }` | Not equal |
| `Like("%text%")` | `{ $regex: "text" }` | Contains |
| `Between(1,10)` | `{ $gte: 1, $lte: 10 }` | Between |
| `IsNull()` | `{ $eq: null }` | Is null |
| `IsNotNull()` | `{ $ne: null }` | Is not null |

## Imports to Replace

```typescript
// Remove these TypeORM imports:
import { In, MoreThan, LessThan, ... } from "typeorm";
import { DATA_SOURCE } from "../../db/data-source";

// Use these Mongoose imports instead:
import { Team } from "../../db/schemas/Team";
import { Event } from "../../db/schemas/Event";
// etc.
```

## DATA_SOURCE Pattern Migration

### Old (TypeORM QueryBuilder)
```typescript
const result = await DATA_SOURCE.createQueryBuilder("team", "t")
  .leftJoin("award", "a", "a.team_number = t.number")
  .select("t.number")
  .addSelect("count(a.id)", "award_count")
  .where("t.state = :state", { state: "California" })
  .groupBy("t.number")
  .getRawMany();
```

### New (Mongoose Aggregation)
```typescript
const result = await Team.aggregate([
  {
    $match: { state: "California" }
  },
  {
    $lookup: {
      from: "awards",
      localField: "number",
      foreignField: "teamNumber",
      as: "awards"
    }
  },
  {
    $group: {
      _id: "$number",
      awardCount: { $sum: { $size: "$awards" } }
    }
  },
  {
    $project: {
      number: "$_id",
      awardCount: 1,
      _id: 0
    }
  }
]);
```

## Field Names

**Important:** Check if field names changed due to MongoDB naming conventions:
- `team_number` → `teamNumber`
- `event_code` → `eventCode`
- `created_at` → `createdAt`

Always verify with the schema files in `/packages/server/src/db/schemas/`

---

**🎯 Pro Tip:** Use the `DBAdapter` helper functions in `/packages/server/src/db/adapter.ts` for common queries - they're already written!
