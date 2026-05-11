import { PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, BaseEntity, EntitySchema, PrimaryGeneratedColumn, Index, DataSource } from "typeorm";
import { T as Team, a as TeamMatchParticipation } from "./Team.js";
import { E as Event, h as Award, M as Match } from "./Event.js";
import { b as DESCRIPTORS_LIST, A as Alliance, D as DESCRIPTORS } from "./types.js";
import "async-mutex";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Analytics } from "./Analytics.js";
const IS_PROD = process.env.NODE_ENV === "production";
const IS_DEV = !IS_PROD;
const DATABASE_DRIVER = (process.env.DATABASE_DRIVER ?? (process.env.DATABASE_URL ? "postgres" : "sqljs")).toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL;
const SQLJS_LOCATION = process.env.SQLJS_LOCATION ?? (process.env.VERCEL ? "/tmp/roboscout.sqlite" : "./data/roboscout.sqlite");
process.env.FTC_API_KEY;
const LOGGING = process.env.LOGGING === "1";
const SYNC_DB = process.env.SYNC_DB === "1";
process.env.SYNC_API !== "0";
process.env.CACHE_REQ === "1" && IS_DEV;
process.env.DB_TIMEOUT;
var __defProp$5 = Object.defineProperty;
var __getOwnPropDesc$5 = Object.getOwnPropertyDescriptor;
var __decorateClass$5 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$5(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$5(target, key, result);
  return result;
};
let FtcApiReq = class extends BaseEntity {
};
__decorateClass$5([
  PrimaryColumn()
], FtcApiReq.prototype, "url", 2);
__decorateClass$5([
  Column("json")
], FtcApiReq.prototype, "resp", 2);
__decorateClass$5([
  CreateDateColumn({ type: "timestamptz" })
], FtcApiReq.prototype, "createdAt", 2);
__decorateClass$5([
  UpdateDateColumn({ type: "timestamptz" })
], FtcApiReq.prototype, "updatedAt", 2);
FtcApiReq = __decorateClass$5([
  Entity()
], FtcApiReq);
var __defProp$4 = Object.defineProperty;
var __getOwnPropDesc$4 = Object.getOwnPropertyDescriptor;
var __decorateClass$4 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$4(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$4(target, key, result);
  return result;
};
let DataHasBeenLoaded = class extends BaseEntity {
  static async teamsHaveBeenLoaded(season) {
    return (await DataHasBeenLoaded.findOneBy({ season }))?.teams ?? false;
  }
  static async eventsHaveBeenLoaded(season) {
    return (await DataHasBeenLoaded.findOneBy({ season }))?.events ?? false;
  }
  static async matchesHaveBeenLoaded(season) {
    return (await DataHasBeenLoaded.findOneBy({ season }))?.matches ?? false;
  }
  static async awardsHaveBeenLoaded(season) {
    return (await DataHasBeenLoaded.findOneBy({ season }))?.awards ?? false;
  }
};
__decorateClass$4([
  PrimaryColumn("int")
], DataHasBeenLoaded.prototype, "season", 2);
__decorateClass$4([
  Column({ default: false })
], DataHasBeenLoaded.prototype, "teams", 2);
__decorateClass$4([
  Column({ default: false })
], DataHasBeenLoaded.prototype, "events", 2);
__decorateClass$4([
  Column({ default: false })
], DataHasBeenLoaded.prototype, "matches", 2);
__decorateClass$4([
  Column({ default: false })
], DataHasBeenLoaded.prototype, "awards", 2);
__decorateClass$4([
  CreateDateColumn({ type: "timestamptz" })
], DataHasBeenLoaded.prototype, "createdAt", 2);
__decorateClass$4([
  UpdateDateColumn({ type: "timestamptz" })
], DataHasBeenLoaded.prototype, "updatedAt", 2);
DataHasBeenLoaded = __decorateClass$4([
  Entity()
], DataHasBeenLoaded);
function makeMatchScore(descriptor) {
  return new EntitySchema({
    tableName: `match_score_${descriptor.season}`,
    name: `match_score_${descriptor.season}`,
    columns: getMatchScoreColumns(descriptor)
  });
}
function getMatchScoreColumns(descriptor) {
  let baseColumns = {
    season: {
      type: "smallint",
      primary: true
    },
    eventCode: {
      type: "varchar",
      primary: true
    },
    matchId: {
      type: "int",
      primary: true
    },
    alliance: {
      type: "enum",
      enum: Alliance,
      enumName: "alliance_enum",
      primary: true
    },
    createdAt: {
      type: "timestamptz",
      createDate: true
    },
    updatedAt: {
      type: "timestamptz",
      updateDate: true
    }
  };
  let extraColumns = {};
  descriptor.msColumns().forEach((c) => {
    extraColumns[c.dbColName] = {
      ...c.dataTy.typeorm,
      nullable: c.tradOnly
    };
  });
  return { ...baseColumns, ...extraColumns };
}
let MatchScoreSchemas = {};
for (let d of DESCRIPTORS_LIST) {
  MatchScoreSchemas[d.season] = makeMatchScore(d);
}
let MatchScore = {};
function initMS() {
  for (let d of DESCRIPTORS_LIST) {
    MatchScore[d.season] = DATA_SOURCE.getRepository(MatchScoreSchemas[d.season]);
  }
  MatchScore.fromApi = (api, match, remote) => {
    let scores = "scores" in api ? [api.scores] : api.alliances;
    return scores.map((s, i) => {
      let other = scores.length == 2 ? scores[1 - i] : null;
      let dbScore = {
        season: match.eventSeason,
        eventCode: match.eventCode,
        matchId: match.id,
        alliance: "alliance" in s ? s.alliance : Alliance.Solo
      };
      let apiScore = {
        season: match.eventSeason,
        eventCode: match.eventCode,
        matchId: match.id,
        alliance: "alliance" in s ? s.alliance : Alliance.Solo
      };
      let descriptor = DESCRIPTORS[match.eventSeason];
      for (let column of descriptor.msColumns()) {
        column.addSelfFromApi(s, other, dbScore, apiScore, remote);
      }
      return MatchScore[match.eventSeason].create(dbScore);
    });
  };
}
const ns = new SnakeNamingStrategy();
function makeTep(descriptor) {
  let agg = getAggregateStatColumns(descriptor);
  return new EntitySchema({
    tableName: `tep_${descriptor.season}`,
    name: `tep_${descriptor.season}`,
    columns: {
      season: {
        type: "smallint",
        primary: true
      },
      eventCode: {
        type: "varchar",
        primary: true
      },
      teamNumber: {
        type: "int",
        primary: true
      },
      isRemote: { type: "bool" },
      rank: { type: "int" },
      rp: { type: "float" },
      tb1: { type: "float" },
      tb2: { type: "float" },
      wins: { type: "int" },
      losses: { type: "int" },
      ties: { type: "int" },
      dqs: { type: "int" },
      qualMatchesPlayed: { type: "int" },
      hasStats: { type: "bool" },
      createdAt: {
        type: "timestamptz",
        createDate: true
      },
      updatedAt: {
        type: "timestamptz",
        updateDate: true
      }
    },
    embeddeds: {
      tot: { schema: agg },
      avg: { schema: agg },
      min: { schema: agg },
      max: { schema: agg },
      dev: { schema: agg },
      opr: { schema: agg }
    },
    checks: [
      { expression: "rp <> 'NaN'" },
      { expression: "tb1 <> 'NaN'" },
      { expression: "tb2 <> 'NaN'" },
      ...descriptor.tepColumns().flatMap((c) => {
        return [
          { expression: `${ns.columnName(c.dbName, void 0, ["tot"])} <> 'NaN'` },
          { expression: `${ns.columnName(c.dbName, void 0, ["avg"])} <> 'NaN'` },
          { expression: `${ns.columnName(c.dbName, void 0, ["min"])} <> 'NaN'` },
          { expression: `${ns.columnName(c.dbName, void 0, ["max"])} <> 'NaN'` },
          { expression: `${ns.columnName(c.dbName, void 0, ["dev"])} <> 'NaN'` },
          { expression: `${ns.columnName(c.dbName, void 0, ["opr"])} <> 'NaN'` }
        ];
      })
    ]
  });
}
function getAggregateStatColumns(descriptor) {
  let columns = {};
  descriptor.tepColumns().forEach((c) => {
    columns[c.dbName] = { type: "float", nullable: true };
  });
  return new EntitySchema({
    name: `test${descriptor.season}`,
    columns
  });
}
let TeamEventParticipationSchemas = {};
for (let d of DESCRIPTORS_LIST) {
  TeamEventParticipationSchemas[d.season] = makeTep(d);
}
let TeamEventParticipation = {};
function initTep() {
  for (let d of DESCRIPTORS_LIST) {
    TeamEventParticipation[d.season] = DATA_SOURCE.getRepository(
      TeamEventParticipationSchemas[d.season]
    );
  }
}
var __defProp$3 = Object.defineProperty;
var __getOwnPropDesc$3 = Object.getOwnPropertyDescriptor;
var __decorateClass$3 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$3(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$3(target, key, result);
  return result;
};
let ApiReq = class extends BaseEntity {
};
__decorateClass$3([
  PrimaryGeneratedColumn()
], ApiReq.prototype, "id", 2);
__decorateClass$3([
  Column("json")
], ApiReq.prototype, "headers", 2);
__decorateClass$3([
  Column("json")
], ApiReq.prototype, "req", 2);
__decorateClass$3([
  CreateDateColumn({ type: "timestamptz" })
], ApiReq.prototype, "createdAt", 2);
ApiReq = __decorateClass$3([
  Entity()
], ApiReq);
var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$2(target, key, result);
  return result;
};
let BestName = class extends BaseEntity {
};
__decorateClass$2([
  PrimaryGeneratedColumn()
], BestName.prototype, "id", 2);
__decorateClass$2([
  Column()
], BestName.prototype, "team1", 2);
__decorateClass$2([
  Column()
], BestName.prototype, "team2", 2);
__decorateClass$2([
  Column({ default: -1 })
], BestName.prototype, "vote", 2);
__decorateClass$2([
  CreateDateColumn({ type: "timestamptz" })
], BestName.prototype, "createdAt", 2);
__decorateClass$2([
  UpdateDateColumn({ type: "timestamptz" })
], BestName.prototype, "updatedAt", 2);
BestName = __decorateClass$2([
  Entity()
], BestName);
var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp$1(target, key, result);
  return result;
};
let WatchRoom = class extends BaseEntity {
};
__decorateClass$1([
  PrimaryColumn()
], WatchRoom.prototype, "id", 2);
__decorateClass$1([
  Column()
], WatchRoom.prototype, "name", 2);
__decorateClass$1([
  Column({ type: "smallint", nullable: true })
], WatchRoom.prototype, "season", 2);
__decorateClass$1([
  Column({ type: "varchar", nullable: true })
], WatchRoom.prototype, "eventCode", 2);
__decorateClass$1([
  Column({ type: "varchar", nullable: true })
], WatchRoom.prototype, "hostParticipantId", 2);
__decorateClass$1([
  Column({ type: "varchar", default: "HOST_ONLY" })
], WatchRoom.prototype, "controlMode", 2);
__decorateClass$1([
  Column({ type: "varchar" })
], WatchRoom.prototype, "layoutPreference", 2);
__decorateClass$1([
  Column({ type: "varchar", nullable: true })
], WatchRoom.prototype, "focusStreamId", 2);
__decorateClass$1([
  Column("json")
], WatchRoom.prototype, "streams", 2);
__decorateClass$1([
  Column("json")
], WatchRoom.prototype, "playbackState", 2);
__decorateClass$1([
  Column("json")
], WatchRoom.prototype, "participants", 2);
__decorateClass$1([
  CreateDateColumn({ type: "timestamptz" })
], WatchRoom.prototype, "createdAt", 2);
__decorateClass$1([
  UpdateDateColumn({ type: "timestamptz" })
], WatchRoom.prototype, "updatedAt", 2);
WatchRoom = __decorateClass$1([
  Entity()
], WatchRoom);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
let WatchRoomMessage = class extends BaseEntity {
};
__decorateClass([
  PrimaryGeneratedColumn("uuid")
], WatchRoomMessage.prototype, "id", 2);
__decorateClass([
  Column()
], WatchRoomMessage.prototype, "roomId", 2);
__decorateClass([
  Column()
], WatchRoomMessage.prototype, "senderParticipantId", 2);
__decorateClass([
  Column()
], WatchRoomMessage.prototype, "senderName", 2);
__decorateClass([
  Column("text")
], WatchRoomMessage.prototype, "message", 2);
__decorateClass([
  CreateDateColumn({ type: "timestamptz" })
], WatchRoomMessage.prototype, "createdAt", 2);
WatchRoomMessage = __decorateClass([
  Entity(),
  Index(["roomId", "createdAt"])
], WatchRoomMessage);
const DEV_ENTITIES = [FtcApiReq];
const ENTITIES = [
  DataHasBeenLoaded,
  Team,
  Event,
  Award,
  Match,
  TeamMatchParticipation,
  ...Object.values(MatchScoreSchemas),
  ...Object.values(TeamEventParticipationSchemas),
  BestName,
  ApiReq,
  Analytics,
  WatchRoom,
  WatchRoomMessage,
  ...IS_DEV ? DEV_ENTITIES : []
];
const commonOptions = {
  synchronize: SYNC_DB,
  logging: LOGGING,
  entities: ENTITIES
};
const postgresSource = new DataSource({
  type: "postgres",
  url: DATABASE_URL,
  namingStrategy: new SnakeNamingStrategy(),
  ...commonOptions
  // extra: {
  //     connectionTimeoutMillis: DB_TIMEOUT,
  //     query_timeout: DB_TIMEOUT,
  //     statement_timeout: DB_TIMEOUT,
  // },
});
const sqljsSource = new DataSource({
  type: "sqljs",
  location: SQLJS_LOCATION,
  autoSave: true,
  ...commonOptions
});
const DATA_SOURCE = DATABASE_DRIVER === "sqljs" ? sqljsSource : postgresSource;
const dataSource = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DATA_SOURCE
}, Symbol.toStringTag, { value: "Module" }));
export {
  BestName as B,
  DATA_SOURCE as D,
  MatchScore as M,
  TeamEventParticipation as T,
  initTep as a,
  dataSource as d,
  initMS as i
};
