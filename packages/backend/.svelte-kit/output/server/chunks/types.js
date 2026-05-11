import { S as Season, A as ALL_SEASONS } from "./Season.js";
import { GraphQLEnumType, GraphQLNonNull, GraphQLInt, GraphQLString, GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLFloat } from "graphql";
import { GraphQLList as GraphQLList$1 } from "graphql/type/index.mjs";
import { GraphQLDateTime, GraphQLDate } from "graphql-scalars";
const Alliance = {
  Red: "Red",
  Blue: "Blue",
  Solo: "Solo"
};
function allianceFromApiStation(station) {
  switch (station) {
    case "Red1":
      return Alliance.Red;
    case "Red2":
      return Alliance.Red;
    case "Red3":
      return Alliance.Red;
    case "Blue1":
      return Alliance.Blue;
    case "Blue2":
      return Alliance.Blue;
    case "Blue3":
      return Alliance.Blue;
    case "1":
      return Alliance.Solo;
  }
}
const AllianceRole = {
  Captain: "Captain",
  FirstPick: "FirstPick",
  SecondPick: "SecondPick",
  Solo: "Solo"
};
function allianceRoleFromApiStation(station) {
  switch (station) {
    case "Red1":
      return AllianceRole.Captain;
    case "Red2":
      return AllianceRole.FirstPick;
    case "Red3":
      return AllianceRole.SecondPick;
    case "Blue1":
      return AllianceRole.Captain;
    case "Blue2":
      return AllianceRole.FirstPick;
    case "Blue3":
      return AllianceRole.SecondPick;
    case "1":
      return AllianceRole.Solo;
  }
}
function notEmpty(value) {
  return value !== null && value !== void 0;
}
function groupBy(arr, f) {
  let ret = {};
  for (let i of arr) {
    let k = f(i);
    ret[k] = ret[k] ?? [];
    ret[k].push(i);
  }
  return ret;
}
function groupBySingle(arr, f) {
  let ret = {};
  for (let i of arr) {
    let k = f(i);
    ret[k] = i;
  }
  return ret;
}
function titleCase(s) {
  return (s[0]?.toUpperCase() ?? "") + s.substring(1);
}
const SortDir = {
  Asc: "Asc",
  Desc: "Desc"
};
const StatType = {
  Int: "int",
  Float: "float",
  Rank: "rank",
  String: "string",
  Record: "record",
  Team: "team",
  Event: "event"
};
const Color = {
  White: "white",
  Red: "red",
  Blue: "blue",
  LightBlue: "light-blue",
  Green: "green",
  Purple: "purple"
};
class StatColumn {
  getValueDistilled(d) {
    return StatColumn.distill(this.getValue(d));
  }
  static distill(val) {
    if (val == null)
      return null;
    if (val.ty == "int" || val.ty == "float" || val.ty == "rank" || val.ty == "string") {
      return val.val;
    } else if (val.ty == "team") {
      return val.number;
    } else if (val.ty == "event") {
      return val.start;
    } else {
      let num = val.wins + val.ties / 2;
      let denom = val.wins + val.losses + val.ties;
      return num / denom;
    }
  }
  constructor(opts) {
    this.id = opts.id;
    this.columnName = opts.columnName;
    this.dialogName = opts.dialogName;
    this.titleName = opts.titleName;
    this.color = opts.color;
    this.ty = opts.ty;
    this.getValue = opts.getValue;
  }
  shouldExpand() {
    return this.ty == StatType.Team;
  }
}
class NonRankStatColumn extends StatColumn {
  constructor(opts) {
    super({ ...opts, getValue: (d) => opts.getNonRankValue(d.data) });
    this.getNonRankValue = opts.getNonRankValue;
    this.sqlExpr = opts.sqlExpr;
  }
  getNonRankValueDistilled(d) {
    return StatColumn.distill(this.getNonRankValue(d));
  }
}
const RankTy = {
  NoFilter: "NoFilter",
  Filter: "Filter",
  NoFilterSkip: "NoFilterSkip",
  FilterSkip: "FilterSkip"
};
({
  [RankTy.NoFilter]: new StatColumn({
    id: "noFilterRank",
    columnName: "Rank",
    dialogName: "Rank",
    titleName: "No Filter Rank",
    color: Color.White,
    ty: StatType.Rank,
    getValue: (d) => ({ ty: StatType.Rank, val: d.noFilterRank })
  }),
  [RankTy.Filter]: new StatColumn({
    id: "filterRank",
    columnName: "Rank",
    dialogName: "Rank",
    titleName: "Filter Rank",
    color: Color.White,
    ty: StatType.Rank,
    getValue: (d) => ({ ty: StatType.Rank, val: d.filterRank })
  }),
  [RankTy.NoFilterSkip]: new StatColumn({
    id: "noFilterSkipRank",
    columnName: "Rank",
    dialogName: "Rank",
    titleName: "No Filter Skipping Rank",
    color: Color.White,
    ty: StatType.Rank,
    getValue: (d) => ({ ty: StatType.Rank, val: d.noFilterSkipRank })
  }),
  [RankTy.FilterSkip]: new StatColumn({
    id: "filterSkipRank",
    columnName: "Rank",
    dialogName: "Rank",
    titleName: "Filter Skipping Rank",
    color: Color.White,
    ty: StatType.Rank,
    getValue: (d) => ({ ty: StatType.Rank, val: d.filterSkipRank })
  })
});
class StatSetSection {
  constructor(name, rows, columns) {
    this.name = name;
    this.rows = rows;
    this.columns = columns;
  }
  getId(rowId, columnId) {
    return rowId + titleCase(columnId);
  }
  getRowId(row) {
    return row + this.columns.map((c) => c.id);
  }
}
class StatSet {
  constructor(id, allStats, sections) {
    this.id = id;
    this.allStats = allStats;
    this.sections = sections;
    this.allStatsRecord = groupBySingle(allStats, (s) => s.id);
  }
  getStat(id) {
    return this.allStatsRecord[id];
  }
}
const TepStatGroup = {
  Tot: "tot",
  Avg: "avg",
  Opr: "opr",
  Min: "min",
  Max: "max",
  Dev: "dev"
};
const TEP_STAT_GROUPS = [
  TepStatGroup.Tot,
  TepStatGroup.Avg,
  TepStatGroup.Opr,
  TepStatGroup.Min,
  TepStatGroup.Max,
  TepStatGroup.Dev
];
const TEP_GROUP_COLORS = {
  [TepStatGroup.Tot]: Color.Red,
  [TepStatGroup.Avg]: Color.Purple,
  [TepStatGroup.Opr]: Color.Purple,
  [TepStatGroup.Min]: Color.LightBlue,
  [TepStatGroup.Max]: Color.Blue,
  [TepStatGroup.Dev]: Color.Green
};
const TEP_GROUP_DATA_TYS = {
  [TepStatGroup.Tot]: StatType.Int,
  [TepStatGroup.Avg]: StatType.Float,
  [TepStatGroup.Opr]: StatType.Float,
  [TepStatGroup.Min]: StatType.Int,
  [TepStatGroup.Max]: StatType.Int,
  [TepStatGroup.Dev]: StatType.Float
};
const TEP_GROUP_NAMES = {
  [TepStatGroup.Tot]: ["Total", ""],
  [TepStatGroup.Avg]: ["Average", ""],
  [TepStatGroup.Opr]: ["", "Opr"],
  [TepStatGroup.Min]: ["Minimum", ""],
  [TepStatGroup.Max]: ["Maximum", ""],
  [TepStatGroup.Dev]: ["", "Standard Deviation"]
};
const TEP_GROUP_DESC = {
  [TepStatGroup.Tot]: "The sum of all points scored in the category.",
  [TepStatGroup.Avg]: "The average number of points scored in the category.",
  [TepStatGroup.Opr]: "Offensive Power Rating.",
  [TepStatGroup.Min]: "The lowest number of points scored in the category.",
  [TepStatGroup.Max]: "The highest number of points scored in the category.",
  [TepStatGroup.Dev]: "The standard deviation of scores in the category."
};
let statSetCache$1 = {};
function getTepStatSet(season, remote) {
  let key = `${season}-${remote}`;
  let descriptor = DESCRIPTORS[season];
  if (!(season in statSetCache$1)) {
    let soloStats = [
      new NonRankStatColumn({
        color: Color.White,
        id: "team",
        columnName: "Team",
        dialogName: "Team",
        titleName: "Team",
        sqlExpr: "teamNumber",
        ty: StatType.Team,
        getNonRankValue: (d) => ({
          ty: "team",
          name: d.team.name,
          number: d.team.number
        })
      }),
      new NonRankStatColumn({
        color: Color.White,
        id: "eventRank",
        columnName: "Rank",
        dialogName: "Ranking",
        titleName: "Event Ranking",
        sqlExpr: "rank",
        ty: StatType.Rank,
        getNonRankValue: (d) => ({ ty: "rank", val: d.stats.rank })
      }),
      new NonRankStatColumn({
        color: Color.Red,
        id: "rankingScore",
        columnName: "RS",
        dialogName: "Ranking Score",
        titleName: "Ranking Score",
        sqlExpr: "rp",
        ty: StatType.Float,
        getNonRankValue: (d) => ({
          ty: StatType.Float,
          val: d.stats.rp
        })
      }),
      new NonRankStatColumn({
        color: Color.LightBlue,
        id: "tb1",
        columnName: "TBP",
        dialogName: "Tie Breaker Points",
        titleName: "Tie Breaker Points",
        sqlExpr: "tb1",
        ty: StatType.Float,
        getNonRankValue: (d) => ({ ty: "float", val: d.stats.tb1 })
      }),
      ...descriptor.rankings.tb == "LosingScore" ? [] : [
        new NonRankStatColumn({
          color: Color.Blue,
          id: "tb2",
          columnName: "TBP2",
          dialogName: "Tie Breaker Points 2",
          titleName: "Tie Breaker Points 2",
          sqlExpr: "tb2",
          ty: StatType.Float,
          getNonRankValue: (d) => ({ ty: "float", val: d.stats.tb2 })
        })
      ],
      new NonRankStatColumn({
        color: Color.Green,
        id: "played",
        columnName: "Played",
        dialogName: "Matches Played",
        titleName: "Matches Played",
        sqlExpr: "qualMatchesPlayed",
        ty: StatType.Int,
        getNonRankValue: (d) => ({ ty: "int", val: d.stats.qualMatchesPlayed })
      }),
      ...remote ? [] : [
        new NonRankStatColumn({
          color: Color.Green,
          id: "wins",
          columnName: "Wins",
          dialogName: "Wins",
          titleName: "Wins",
          sqlExpr: "wins",
          ty: StatType.Int,
          getNonRankValue: (d) => "wins" in d.stats ? { ty: "int", val: d.stats.wins } : null
        }),
        new NonRankStatColumn({
          color: Color.Green,
          id: "losses",
          columnName: "Losses",
          dialogName: "Losses",
          titleName: "Losses",
          sqlExpr: "losses",
          ty: StatType.Int,
          getNonRankValue: (d) => "losses" in d.stats ? { ty: "int", val: d.stats.losses } : null
        }),
        new NonRankStatColumn({
          color: Color.Green,
          id: "ties",
          columnName: "Ties",
          dialogName: "Ties",
          titleName: "Ties",
          sqlExpr: "ties",
          ty: StatType.Int,
          getNonRankValue: (d) => "ties" in d.stats ? { ty: "int", val: d.stats.ties } : null
        }),
        new NonRankStatColumn({
          color: Color.Green,
          id: "eventRecord",
          columnName: "Record",
          dialogName: "Record",
          titleName: "Record",
          sqlExpr: "(wins * 2 + ties / NULLIF(qual_matches_played, 0))",
          ty: StatType.Record,
          getNonRankValue: (d) => "wins" in d.stats ? {
            ty: "record",
            wins: d.stats.wins,
            losses: d.stats.losses,
            ties: d.stats.ties
          } : null
        })
      ]
    ];
    let eventStats = [
      new NonRankStatColumn({
        id: "event",
        columnName: "Event",
        titleName: "Event",
        dialogName: "Event",
        sqlExpr: "start",
        color: Color.White,
        ty: StatType.Event,
        getNonRankValue: (d) => "event" in d ? {
          ty: "event",
          season: d.event.season,
          code: d.event.code,
          name: d.event.name,
          start: d.event.start,
          end: d.event.end
        } : null
      })
    ];
    let soloSection = new StatSetSection(
      "Team's Event Performance",
      soloStats.map((s) => ({ val: { id: s.id, name: s.dialogName }, children: [] })),
      [{ id: "", name: "", color: Color.Purple, description: null }]
    );
    let eventSection = new StatSetSection(
      "Event",
      [{ val: { id: "event", name: "Event" }, children: [] }],
      [{ id: "", name: "", color: Color.Purple, description: null }]
    );
    let groupStats = descriptor.tepColumns().flatMap((t) => TEP_STAT_GROUPS.map((g) => t.getStatColumn(g)));
    let groupSection = new StatSetSection(
      "Match Scores",
      filterMapTreeList(descriptor.getTepTree(remote), (t) => ({
        id: t.id,
        name: t.dialogName
      })),
      TEP_STAT_GROUPS.map((g) => ({
        id: g,
        name: g.toUpperCase(),
        color: TEP_GROUP_COLORS[g],
        description: TEP_GROUP_DESC[g]
      }))
    );
    statSetCache$1[key] = new StatSet(
      `tep${season}${remote ? "Remote" : "Trad"}`,
      [...soloStats, ...groupStats, ...eventStats],
      [soloSection, groupSection, eventSection]
    );
  }
  return statSetCache$1[key];
}
function filterMapTree(t, mapper, f = void 0) {
  let val = mapper(t.val);
  return val && (t.for == void 0 || t.for == f) ? {
    val,
    children: t.children.map((e) => filterMapTree(e, mapper, f)).filter(notEmpty)
  } : void 0;
}
function filterMapTreeList(ts, mapper, f = void 0) {
  return ts.map((t) => filterMapTree(t, mapper, f)).filter(notEmpty);
}
class Descriptor {
  constructor(opts) {
    this.columns = [];
    this.columnsMap = {};
    this.scoreModalTree = [];
    this.scoreModalTreeRemote = [];
    this.tepTree = [];
    this.tepTreeRemote = [];
    this.matchInsightCols = [];
    this.matchInsightColsRemote = [];
    this.season = opts.season;
    this.seasonName = opts.seasonName;
    this.seasonNameWithYear = `${this.season} ${this.seasonName}`;
    this.hasRemote = opts.hasRemote;
    this.hasEndgame = opts.hasEndgame;
    this.pensSubtract = opts.pensSubtract;
    this.rankings = opts.rankings;
    if (!!opts.rankingPoints) {
      this.rankingPoints = opts.rankingPoints;
    }
    this.firstDate = opts.firstDate;
    this.lastDate = opts.lastDate;
    this.kickoff = opts.kickoff;
  }
  addColumn(col) {
    this.columns.push(col);
    this.columnsMap[col.id] = col;
    return this;
  }
  addTree(trad, remote = []) {
    this.scoreModalTree = filterMapTreeList(trad, (id) => this.columnsMap[id]?.scoreM, "sm");
    this.scoreModalTreeRemote = filterMapTreeList(
      remote,
      (id) => this.columnsMap[id]?.scoreM,
      "sm"
    );
    this.tepTree = filterMapTreeList(trad, (id) => this.columnsMap[id]?.tep, "tep");
    this.tepTreeRemote = filterMapTreeList(remote, (id) => this.columnsMap[id]?.tep, "tep");
    return this;
  }
  addMatchInsightCols(trad, remote) {
    this.matchInsightCols = trad;
    this.matchInsightColsRemote = remote;
    return this;
  }
  finish() {
    return this;
  }
  msColumns() {
    return this.columns.map((c) => c.ms).filter(notEmpty);
  }
  scoreModalColumns() {
    return this.columns.map((c) => c.scoreM).filter(notEmpty);
  }
  tepColumns() {
    return this.columns.map((c) => c.tep).filter(notEmpty);
  }
  typeSuffix(remote) {
    return remote ? "Remote" : this.hasRemote ? "Trad" : "";
  }
  getTepTree(remote) {
    return remote ? this.tepTreeRemote : this.tepTree;
  }
  getSCoreModalTree(remote) {
    return remote ? this.scoreModalTreeRemote : this.scoreModalTree;
  }
  getMatchInsightCols(remote) {
    return remote ? this.matchInsightColsRemote : this.matchInsightCols;
  }
}
class MatchScoreComponent {
  constructor(opts) {
    this.tradOnly = opts.tradOnly;
    this.dbColName = opts.dbColName;
    this.tradApiName = opts.apiName;
    this.remoteApiName = opts.remoteApiName;
    this.outer = opts.outer;
    this.create = opts.create;
    this.dataTy = opts.dataTy;
    this.apiMap = opts.apiMap;
  }
  addSelfFromApi(api, other, dbSelf, apiSelf, remote) {
    let val = "fromSelf" in this.create ? this.create.fromSelf(apiSelf) : this.create.fromApi(api, other);
    dbSelf[this.dbColName] = val;
    apiSelf[this.getApiName(remote)] = val;
  }
  getApiName(remote) {
    return remote ? this.remoteApiName ?? this.tradApiName : this.tradApiName;
  }
}
class TepComponent {
  constructor(opts) {
    this.tradOnly = opts.tradOnly;
    this.isIndividual = opts.isIndividual;
    this.id = opts.id;
    this.dbName = opts.dbName;
    this.apiName = opts.apiName;
    this.columnPrefix = opts.columnPrefix;
    this.dialogName = opts.dialogName;
    this.fullName = opts.fullName;
    this.make = opts.make;
  }
  getStatColumn(group) {
    return new NonRankStatColumn({
      color: TEP_GROUP_COLORS[group],
      id: this.id + titleCase(group),
      columnName: (this.columnPrefix + " " + group.toUpperCase()).trim(),
      dialogName: this.dialogName,
      titleName: `${TEP_GROUP_NAMES[group][0]} ${this.fullName} ${TEP_GROUP_NAMES[group][1]}`.trim(),
      sqlExpr: `${group}${titleCase(this.dbName)}`,
      ty: TEP_GROUP_DATA_TYS[group],
      getNonRankValue: this.tradOnly ? (d) => this.apiName in d.stats[group] ? {
        ty: TEP_GROUP_DATA_TYS[group],
        val: d.stats[group][this.apiName]
      } : null : (d) => ({
        ty: TEP_GROUP_DATA_TYS[group],
        val: d.stats[group][this.apiName]
      })
    });
  }
}
const MSStatSide = {
  This: "This",
  Opp: "Opp"
};
class ScoreModalComponent {
  constructor(opts) {
    this.id = opts.id;
    this.displayName = opts.displayName;
    this.remoteDisplayName = opts.remoteDisplayName;
    this.columnPrefix = opts.columnPrefix;
    this.fullName = opts.fullName;
    this.sql = opts.sql;
    this.getValue = opts.getValue;
    this.getTitle = opts.getTitle;
    this.children = opts.children;
  }
  getStatColumn(side) {
    let ms = side == MSStatSide.This ? "ms" : "msOpp";
    return new NonRankStatColumn({
      color: side == MSStatSide.This ? Color.Blue : Color.Red,
      id: this.id + side,
      columnName: (side == MSStatSide.Opp ? "Opp " : "") + this.columnPrefix,
      dialogName: this.displayName,
      titleName: (side == MSStatSide.Opp ? "Opponent " : "") + this.fullName,
      sqlExpr: this?.sql?.(ms) ?? ms + "." + this.id,
      ty: StatType.Int,
      getNonRankValue: side == MSStatSide.This ? (d) => {
        let val = this.getValue(d);
        if (val == void 0)
          return null;
        return { ty: "int", val };
      } : (d) => {
        if (!d.opponentsScore)
          return null;
        let val = this.getValue(d.opponentsScore);
        if (val == void 0)
          return null;
        return { ty: "int", val };
      }
    });
  }
}
class DescriptorColumn {
  constructor(opts) {
    this.id = opts.id ?? opts.name;
    this.baseName = opts.name;
    this.tradOnly = !!opts.tradOnly;
  }
  addMatchScore(opts) {
    this.ms = new MatchScoreComponent({
      tradOnly: this.tradOnly,
      dbColName: opts.dbColName ?? this.baseName,
      apiName: opts.apiName ?? this.baseName,
      remoteApiName: opts.remoteApiName ?? opts.apiName ?? this.baseName,
      outer: !!opts.outer,
      create: opts,
      dataTy: opts.dataTy,
      apiMap: opts.apiMap ?? null
    });
    return this;
  }
  addTep(opts) {
    let msName = this.ms?.tradApiName ?? this.baseName;
    this.tep = new TepComponent({
      tradOnly: !!this.tradOnly,
      isIndividual: !!opts.isIndividual,
      id: this.id,
      dbName: opts.dbName ?? this.baseName,
      apiName: opts.apiName ?? this.baseName,
      columnPrefix: opts.columnPrefix,
      dialogName: opts.dialogName ?? this.scoreM?.displayName ?? "<ERROR>",
      fullName: opts.fullName,
      make: opts.make ?? ((ms) => ms[msName])
    });
    return this;
  }
  addScoreModal(opts) {
    let tradMsName = this.ms?.getApiName(false) ?? this.baseName;
    let remoteMsName = this.ms?.getApiName(true) ?? this.baseName;
    this.scoreM = new ScoreModalComponent({
      id: this.id,
      displayName: opts.displayName,
      remoteDisplayName: opts.remoteDisplayName ?? opts.displayName,
      columnPrefix: opts.columnPrefix,
      fullName: opts.fullName,
      sql: opts.sql,
      getValue: opts.getValue ?? ((ms) => remoteMsName in ms ? ms[remoteMsName] : ms[tradMsName]),
      getTitle: opts.getTitle ?? (() => ""),
      children: opts.children ?? []
    });
    return this;
  }
  finish() {
    return this;
  }
}
function makeGQLEnum(e, name) {
  let values = {};
  for (let [k, v] of Object.entries(e)) {
    values[k] = { value: v };
  }
  return new GraphQLEnumType({
    name,
    values
  });
}
function wr$1(t) {
  return { type: t };
}
function nn$1(ty) {
  return new GraphQLNonNull(ty);
}
function list$1(ty) {
  return nn$1(new GraphQLList(ty));
}
const IntTy$1 = wr$1(nn$1(GraphQLInt));
wr$1(nn$1(GraphQLString));
wr$1(nn$1(GraphQLBoolean));
function listTy$1(ty) {
  return wr$1(list$1(ty.type));
}
const Int16DTy = {
  typeorm: { type: "smallint" },
  gql: GraphQLInt
};
const BoolDTy = {
  typeorm: { type: "bool" },
  gql: GraphQLBoolean
};
function EnumDTy(obj, name, dbName) {
  return {
    typeorm: {
      type: "enum",
      enum: obj,
      enumName: dbName
    },
    gql: makeGQLEnum(obj, name)
  };
}
function AnyDTy(gql) {
  return {
    typeorm: { type: "json" },
    gql
  };
}
const Station = {
  One: "One",
  Two: "Two",
  NotOnField: "NotOnField",
  Solo: "Solo"
};
function nOf(count, name, pluralName = name + "s") {
  return `${count} ${count == 1 ? name : pluralName}`;
}
function cappingPoints(level) {
  return level == -1 ? 0 : level + 5;
}
function formatCapLevel(level) {
  return level == -1 ? "No Cap" : nOf(level, "Level");
}
const Descriptor2019 = new Descriptor({
  season: Season.Skystone,
  seasonName: "Skystone",
  hasRemote: false,
  hasEndgame: true,
  pensSubtract: false,
  rankings: {
    rp: "Record",
    tb: "LosingScore"
  },
  firstDate: /* @__PURE__ */ new Date("2019-05-10"),
  lastDate: /* @__PURE__ */ new Date("2020-05-02"),
  kickoff: /* @__PURE__ */ new Date("2019-09-07")
}).addColumn(
  new DescriptorColumn({ name: "autoNav1" }).addMatchScore({
    apiName: "autoNav2019_1",
    fromApi: (api) => api.robot1Navigated,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2019_1 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "autoNav2" }).addMatchScore({
    apiName: "autoNav2019_2",
    fromApi: (api) => api.robot2Navigated,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2019_2 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "repositioned" }).addMatchScore({ fromApi: (api) => api.foundationRepositioned, dataTy: BoolDTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoDelivered" }).addMatchScore({ fromApi: (api) => api.autoDelivered, dataTy: Int16DTy }).addScoreModal({
    displayName: "Regular Stones",
    columnPrefix: "Auto Regular",
    fullName: "Auto Regular Stone Delivery Points",
    getValue: (ms) => (ms.autoDelivered - ms.autoSkystonesDeliveredFirst) * 2,
    getTitle: (ms) => nOf(ms.autoDelivered - ms.autoSkystonesDeliveredFirst, "Stone")
  })
).addColumn(
  new DescriptorColumn({ name: "autoSkystonesDeliveredFirst" }).addMatchScore({
    fromApi: (api) => api.autoStones ? +(api.autoStones[0] == "SKYSTONE") + +(api.autoStones[1] == "SKYSTONE") : 0,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Skystones",
    columnPrefix: "Auto Skystones",
    fullName: "Auto Skystone Delivery Points",
    getValue: (ms) => ms.autoSkystonesDeliveredFirst * 10,
    getTitle: (ms) => nOf(ms.autoSkystonesDeliveredFirst, "Skystone")
  })
).addColumn(
  new DescriptorColumn({ name: "autoReturned" }).addMatchScore({ fromApi: (api) => api.autoReturned, dataTy: Int16DTy }).addScoreModal({
    displayName: "Returned",
    columnPrefix: "Auto Returned",
    fullName: "Auto Stone Return Points",
    getValue: (ms) => ms.autoReturned * -2 + ms.autoFirstReturnedSkystone * -8,
    getTitle: (ms) => ms.autoFirstReturnedSkystone ? `${nOf(ms.autoReturned, "Stone")} and 1 Skystone` : nOf(ms.autoReturned, "Stone")
  })
).addColumn(
  new DescriptorColumn({ name: "autoFirstReturnedSkystone" }).addMatchScore({ fromApi: (api) => api.firstReturnedIsSkystone, dataTy: BoolDTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoPlaced" }).addMatchScore({ fromApi: (api) => api.autoPlaced, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcDelivered" }).addMatchScore({
    fromApi: (api) => api.driverControlledDelivered,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Delivered",
    columnPrefix: "DC Delivered",
    fullName: "Teleop Delivery Points",
    getTitle: (ms) => nOf(ms.dcDelivered, "Stone")
  })
).addColumn(
  new DescriptorColumn({ name: "dcReturned" }).addMatchScore({
    fromApi: (api) => api.driverControlledReturned,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Returned",
    columnPrefix: "DC Returned",
    fullName: "Teleop Stone Return Points",
    getValue: (ms) => -ms.dcReturned,
    getTitle: (ms) => nOf(ms.dcReturned, "Stone")
  })
).addColumn(
  new DescriptorColumn({ name: "dcPlaced" }).addMatchScore({ fromApi: (api) => api.driverControlledPlaced, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "skyscraperHeight" }).addMatchScore({ fromApi: (api) => api.tallestSkyscraper, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "capLevel1" }).addMatchScore({ fromApi: (api) => api.robot1CapstoneLevel, dataTy: Int16DTy }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Cap 1",
    fullName: "Robot 1 Capping Points",
    getValue: (ms) => cappingPoints(ms.capLevel1),
    getTitle: (ms) => formatCapLevel(ms.capLevel1)
  })
).addColumn(
  new DescriptorColumn({ name: "capLevel2" }).addMatchScore({ fromApi: (api) => api.robot2CapstoneLevel, dataTy: Int16DTy }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Cap 2",
    fullName: "Robot 2 Capping Points",
    getValue: (ms) => cappingPoints(ms.capLevel2),
    getTitle: (ms) => formatCapLevel(ms.capLevel2)
  })
).addColumn(
  new DescriptorColumn({ name: "egFoundationMoved" }).addMatchScore({ fromApi: (api) => api.foundationMoved, dataTy: BoolDTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "egParked1" }).addMatchScore({ fromApi: (api) => api.robot1Parked, dataTy: BoolDTy }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Endgame Park 1",
    fullName: "Robot 1 Endgame Parking Points",
    getValue: (ms) => ms.egParked1 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "egParked2" }).addMatchScore({ fromApi: (api) => api.robot2Parked, dataTy: BoolDTy }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Endgame Park 2",
    fullName: "Robot 2 Endgame Parking Points",
    getValue: (ms) => ms.egParked2 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommitted" }).addMatchScore({ fromApi: (api) => api.minorPenalties, dataTy: Int16DTy }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points",
    getValue: (ms) => ms.minorsCommitted * 5,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed")
  })
).addColumn(
  new DescriptorColumn({ name: "majorsCommitted" }).addMatchScore({ fromApi: (api) => api.majorPenalties, dataTy: Int16DTy }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points",
    getValue: (ms) => ms.majorsCommitted * 20,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed")
  })
).addColumn(
  new DescriptorColumn({ name: "majorsCommittedPoints" }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalties Committed Points",
    sql: (ms) => `(${ms}.majorsCommitted * 20)`,
    getValue: (ms) => ms.majorsCommitted * 20,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed")
  }).addTep({
    make: (ms) => ms.majorsCommitted * 20,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalties Committed Points"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommittedPoints" }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalties Committed Points",
    sql: (ms) => `(${ms}.minorsCommitted * 5)`,
    getValue: (ms) => ms.minorsCommitted * 5,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed")
  }).addTep({
    make: (ms) => ms.minorsCommitted * 5,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalties Committed Points"
  })
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsCommitted" }).addMatchScore({
    fromSelf: (self) => self.minorsCommitted * 5 + self.majorsCommitted * 20,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsByOpp" }).addMatchScore({ fromApi: (_, oth) => oth.minorPenalties, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsByOpp" }).addMatchScore({ fromApi: (_, oth) => oth.majorPenalties, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsByOppPoints" }).addTep({
    make: (ms) => ms.majorsByOpp * 20,
    columnPrefix: "Opp Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOppPoints" }).addTep({
    make: (ms) => ms.minorsByOpp * 5,
    columnPrefix: "Opp Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsByOpp" }).addMatchScore({
    fromSelf: (self) => self.minorsByOpp * 5 + self.majorsByOpp * 20,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points by Opponent"
  }).addTep({
    columnPrefix: "Opp Penalties Committed",
    dialogName: "Opp Penalty Points",
    fullName: "Penalty Points by Opponent"
  })
).addColumn(
  new DescriptorColumn({ name: "autoNavPoints" }).addMatchScore({
    fromSelf: (self) => self.autoNav2019_1 * 5 + self.autoNav2019_2 * 5,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Auto Nav",
    fullName: "Auto Navigation Points"
  }).addTep({ columnPrefix: "Auto Nav", fullName: "Auto Navigation Points" })
).addColumn(
  new DescriptorColumn({ name: "autoNavPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? ms.autoNav2019_1 * 5 : ms.autoNav2019_2 * 5,
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoRepositioningPoints" }).addMatchScore({ fromSelf: (self) => self.repositioned * 10, dataTy: Int16DTy }).addScoreModal({
    displayName: "Repositioning Points",
    columnPrefix: "Auto Reposition",
    fullName: "Auto Repositioning Points"
  }).addTep({ columnPrefix: "Auto Reposition", fullName: "Auto Repositioning Points" })
).addColumn(
  new DescriptorColumn({ name: "autoDeliveryPoints" }).addMatchScore({
    fromSelf: (self) => self.autoDelivered * 2 + self.autoSkystonesDeliveredFirst * 8 - self.autoReturned * 2 - self.autoFirstReturnedSkystone * 8,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Delivery Points",
    columnPrefix: "Auto Delivery",
    fullName: "Auto Delivery Points"
  }).addTep({ columnPrefix: "Auto Delivery", fullName: "Auto Delivery Points" })
).addColumn(
  new DescriptorColumn({ name: "autoPlacementPoints" }).addMatchScore({ fromSelf: (self) => self.autoPlaced * 4, dataTy: Int16DTy }).addScoreModal({
    displayName: "Placement Points",
    columnPrefix: "Auto Placement",
    fullName: "Auto Placement Points",
    getTitle: (ms) => nOf(ms.autoPlaced, "Stone")
  }).addTep({ columnPrefix: "Auto Placement", fullName: "Auto Placement Points" })
).addColumn(
  new DescriptorColumn({ name: "dcDeliveryPoints" }).addMatchScore({
    fromSelf: (self) => self.dcDelivered - self.dcReturned,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Delivery Points",
    columnPrefix: "Delivery",
    fullName: "Teleop Delivery Points"
  }).addTep({ columnPrefix: "Delivery", fullName: "Teleop Delivery Points" })
).addColumn(
  new DescriptorColumn({ name: "dcPlacementPoints" }).addMatchScore({ fromSelf: (self) => self.dcPlaced, dataTy: Int16DTy }).addScoreModal({
    displayName: "Placement Points",
    columnPrefix: "Placement",
    fullName: "Teleop Placement Points",
    getTitle: (ms) => nOf(ms.dcPlaced, "Stone")
  }).addTep({ columnPrefix: "Placement", fullName: "Teleop Placement Points" })
).addColumn(
  new DescriptorColumn({ name: "skyscraperBonusPoints" }).addMatchScore({ fromSelf: (self) => self.skyscraperHeight * 2, dataTy: Int16DTy }).addScoreModal({
    displayName: "Skyscraper Points",
    columnPrefix: "Skyscraper",
    fullName: "Skyscraper Bonus Points",
    getTitle: (ms) => nOf(ms.skyscraperHeight, "Level")
  }).addTep({ columnPrefix: "Skyscraper", fullName: "Skyscraper Bonus Points" })
).addColumn(
  new DescriptorColumn({ name: "cappingPoints" }).addMatchScore({
    fromSelf: (self) => cappingPoints(self.capLevel1) + cappingPoints(self.capLevel2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Capping Points",
    columnPrefix: "Capping",
    fullName: "Capping Points"
  }).addTep({ columnPrefix: "Capping", fullName: "Capping Points" })
).addColumn(
  new DescriptorColumn({ name: "cappingPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => cappingPoints(station == Station.One ? ms.capLevel1 : ms.capLevel2),
    columnPrefix: "Capping Individual",
    dialogName: "Individual",
    fullName: "Capping Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "egParkPoints" }).addMatchScore({
    fromSelf: (self) => self.egParked1 * 5 + self.egParked2 * 5,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Parking Points",
    columnPrefix: "Parking",
    fullName: "Parking Points"
  }).addTep({ columnPrefix: "Parking", fullName: "Parking Points" })
).addColumn(
  new DescriptorColumn({ name: "egParkPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? ms.egParked1 * 5 : ms.egParked2 * 5,
    columnPrefix: "Parking Individual",
    dialogName: "Individual",
    fullName: "Parking Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "egFoundationMovedPoints" }).addMatchScore({ fromSelf: (self) => self.egFoundationMoved * 15, dataTy: Int16DTy }).addScoreModal({
    displayName: "Movement Points",
    columnPrefix: "Foundation Moved",
    fullName: "Foundation Moved Points"
  }).addTep({ columnPrefix: "Foundation Moved", fullName: "Foundation Moved Points" })
).addColumn(
  new DescriptorColumn({ name: "autoPoints" }).addMatchScore({
    fromSelf: (self) => self.autoNavPoints + self.autoRepositioningPoints + self.autoDeliveryPoints + self.autoPlacementPoints,
    dataTy: Int16DTy
  }).addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" }).addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" })
).addColumn(
  new DescriptorColumn({ name: "dcPoints" }).addMatchScore({
    fromSelf: (self) => self.dcDeliveryPoints + self.dcPlacementPoints + self.skyscraperBonusPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Teleop Points"
  }).addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "egPoints" }).addMatchScore({
    fromSelf: (self) => self.cappingPoints + self.egParkPoints + self.egFoundationMovedPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Endgame",
    columnPrefix: "Endgame",
    fullName: "Endgame Points"
  }).addTep({
    columnPrefix: "Endgame",
    dialogName: "Endgame Points",
    fullName: "Endgame Points"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPointsNp" }).addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints + self.egPoints,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPoints" }).addMatchScore({
    fromSelf: (self) => self.totalPointsNp + self.penaltyPointsByOpp,
    dataTy: Int16DTy
  }).addTep({ columnPrefix: "", dialogName: "Total Points", fullName: "Total Points" })
).addTree([
  { val: "totalPoints", children: [] },
  { val: "totalPointsNp", children: [] },
  {
    val: "autoPoints",
    children: [
      {
        val: "autoDeliveryPoints",
        children: [
          { val: "autoSkystonesDeliveredFirst", children: [] },
          { val: "autoDelivered", children: [] },
          { val: "autoReturned", children: [] }
        ]
      },
      { val: "autoPlacementPoints", children: [] },
      { val: "autoRepositioningPoints", children: [] },
      {
        val: "autoNavPoints",
        children: [
          { val: "autoNav1", children: [] },
          { val: "autoNav2", children: [] },
          { val: "autoNavPointsIndividual", children: [] }
        ]
      }
    ]
  },
  {
    val: "dcPoints",
    children: [
      {
        val: "dcDeliveryPoints",
        children: [
          { val: "dcDelivered", children: [] },
          { val: "dcReturned", children: [] }
        ]
      },
      { val: "dcPlacementPoints", children: [] },
      { val: "skyscraperBonusPoints", children: [] }
    ]
  },
  {
    val: "egPoints",
    children: [
      {
        val: "cappingPoints",
        children: [
          { val: "capLevel1", children: [] },
          { val: "capLevel2", children: [] },
          { val: "cappingPointsIndividual", children: [] }
        ]
      },
      { val: "egFoundationMovedPoints", children: [] },
      {
        val: "egParkPoints",
        children: [
          { val: "egParked1", children: [] },
          { val: "egParked2", children: [] },
          { val: "egParkPointsIndividual", children: [] }
        ]
      }
    ]
  },
  {
    val: "penaltyPointsCommitted",
    children: [
      { val: "majorsCommittedPoints", children: [] },
      { val: "minorsCommittedPoints", children: [] }
    ]
  },
  {
    val: "penaltyPointsByOpp",
    children: [
      { val: "majorsCommittedPoints", for: "sm", children: [] },
      { val: "minorsCommittedPoints", for: "sm", children: [] },
      { val: "majorsByOppPoints", for: "tep", children: [] },
      { val: "minorsByOppPoints", for: "tep", children: [] }
    ]
  }
]).addMatchInsightCols(
  ["autoPlacementPoints", "skyscraperBonusPoints", "cappingPoints"],
  ["autoPlacementPoints", "skyscraperBonusPoints", "cappingPoints"]
).finish();
const WobbleEndPosition2020 = {
  None: "None",
  StartLine: "StartLine",
  DropZone: "DropZone"
};
const WobbleEndPosition2020DTy = EnumDTy(
  WobbleEndPosition2020,
  "WobbleEndPosition2020",
  "wobble_end_pos_2020_enum"
);
function wobbleEndPosFromApi(api) {
  switch (api) {
    case 0:
      return WobbleEndPosition2020.None;
    case 1:
      return WobbleEndPosition2020.StartLine;
    default:
      return WobbleEndPosition2020.DropZone;
  }
}
function wobbleEndPosPoints(pos) {
  switch (pos) {
    case "None":
      return 0;
    case "StartLine":
      return 5;
    case "DropZone":
      return 20;
  }
}
function formatWobbleEndPos(pos) {
  switch (pos) {
    case "None":
      return "";
    case "StartLine":
      return "Start Line";
    case "DropZone":
      return "Drop Zone";
  }
}
const Descriptor2020 = new Descriptor({
  season: Season.UltimateGoal,
  seasonName: "Ultimate Goal",
  hasRemote: true,
  hasEndgame: true,
  pensSubtract: true,
  rankings: {
    rp: "TotalPoints",
    tb: "AutoEndgameTot"
  },
  firstDate: /* @__PURE__ */ new Date("2020-10-18"),
  lastDate: /* @__PURE__ */ new Date("2021-09-11"),
  kickoff: /* @__PURE__ */ new Date("2020-09-12")
}).addColumn(
  new DescriptorColumn({ name: "autoWobble1" }).addMatchScore({ fromApi: (api) => api.wobbleDelivered1, dataTy: BoolDTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoWobble2" }).addMatchScore({ fromApi: (api) => api.wobbleDelivered2, dataTy: BoolDTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoNav1" }).addMatchScore({
    apiName: "autoNav2020_1",
    remoteApiName: "autoNav2020",
    fromApi: (api) => api.navigated1,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2020_1 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "autoNav2", tradOnly: true }).addMatchScore({
    apiName: "autoNav2020_2",
    fromApi: (api) => api.navigated2,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2020_2 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "autoPowershots" }).addMatchScore({
    fromApi: (api) => +api.autoPowerShotLeft + +api.autoPowerShotCenter + +api.autoPowerShotRight,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoTowerLow" }).addMatchScore({ fromApi: (api) => api.autoTowerLow, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoTowerMid" }).addMatchScore({ fromApi: (api) => api.autoTowerMid, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoTowerHigh" }).addMatchScore({ fromApi: (api) => api.autoTowerHigh, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcTowerLow" }).addMatchScore({ fromApi: (api) => api.dcTowerLow, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcTowerMid" }).addMatchScore({ fromApi: (api) => api.dcTowerMid, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcTowerHigh" }).addMatchScore({ fromApi: (api) => api.dcTowerHigh, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "wobbleEndPos1" }).addMatchScore({
    fromApi: (api) => wobbleEndPosFromApi(api.wobbleEnd1),
    dataTy: WobbleEndPosition2020DTy
  }).addScoreModal({
    displayName: "Wobble 1",
    columnPrefix: "Wobble 1",
    fullName: "Wobble Goal 1 Points",
    getValue: (ms) => wobbleEndPosPoints(ms.wobbleEndPos1),
    getTitle: (ms) => formatWobbleEndPos(ms.wobbleEndPos1)
  })
).addColumn(
  new DescriptorColumn({ name: "wobbleEndPos2" }).addMatchScore({
    fromApi: (api) => wobbleEndPosFromApi(api.wobbleEnd2),
    dataTy: WobbleEndPosition2020DTy
  }).addScoreModal({
    displayName: "Wobble 2",
    columnPrefix: "Wobble 2",
    fullName: "Wobble Goal 2 Points",
    getValue: (ms) => wobbleEndPosPoints(ms.wobbleEndPos2),
    getTitle: (ms) => formatWobbleEndPos(ms.wobbleEndPos2)
  })
).addColumn(
  new DescriptorColumn({ name: "egWobbleRings" }).addMatchScore({
    fromApi: (api) => api.wobbleRings1 + api.wobbleRings2,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "egPowershots" }).addMatchScore({
    fromApi: (api) => +api.endPowerShotLeft + +api.endPowerShotCenter + +api.endPowerShotRight,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsCommitted" }).addMatchScore({ fromApi: (api) => api.minorPenalties, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsCommitted" }).addMatchScore({ fromApi: (api) => api.majorPenalties, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoNavPoints" }).addMatchScore({
    fromSelf: (self) => "autoNav2020" in self ? self.autoNav2020 * 5 : self.autoNav2020_1 * 5 + self.autoNav2020_2 * 5,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Auto Nav",
    fullName: "Auto Navigation Points"
  }).addTep({ columnPrefix: "Auto Nav", fullName: "Auto Navigation Points" })
).addColumn(
  new DescriptorColumn({ name: "autoNavPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.Solo ? ms.autoNav2020 * 5 : station == Station.One ? ms.autoNav2020_1 * 5 : ms.autoNav2020_2 * 5,
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoTowerPoints" }).addMatchScore({
    fromSelf: (self) => self.autoTowerLow * 3 + self.autoTowerMid * 6 + self.autoTowerHigh * 12,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Tower Points",
    columnPrefix: "Tower",
    fullName: "Auto Tower Points"
  }).addTep({ columnPrefix: "Auto Tower", fullName: "Auto Tower Points" })
).addColumn(
  new DescriptorColumn({ name: "autoTowerLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "Auto Tower Low",
    fullName: "Auto Tower Low Points",
    sql: (ms) => `(${ms}.autoTowerLow * 3)`,
    getValue: (ms) => ms.autoTowerLow * 3,
    getTitle: (ms) => nOf(ms.autoTowerLow, "Ring")
  }).addTep({
    make: (ms) => ms.autoTowerLow * 3,
    columnPrefix: "Auto Tower Low",
    fullName: "Auto Tower Low Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoTowerMidPoints" }).addScoreModal({
    displayName: "Mid",
    columnPrefix: "Auto Tower Mid",
    fullName: "Auto Tower Mid Points",
    sql: (ms) => `(${ms}.autoTowerMid * 6)`,
    getValue: (ms) => ms.autoTowerMid * 6,
    getTitle: (ms) => nOf(ms.autoTowerMid, "Ring")
  }).addTep({
    make: (ms) => ms.autoTowerMid * 6,
    columnPrefix: "Auto Tower Mid",
    fullName: "Auto Tower Mid Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoTowerHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "Auto Tower High",
    fullName: "Auto Tower Low Points",
    sql: (ms) => `(${ms}.autoTowerHigh * 12)`,
    getValue: (ms) => ms.autoTowerHigh * 12,
    getTitle: (ms) => nOf(ms.autoTowerHigh, "Ring")
  }).addTep({
    make: (ms) => ms.autoTowerHigh * 12,
    columnPrefix: "Auto Tower High",
    fullName: "Auto Tower Low Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoWobblePoints" }).addMatchScore({
    fromSelf: (self) => self.autoWobble1 * 15 + self.autoWobble2 * 15,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Wobble Goal Points",
    columnPrefix: "Auto Wobble",
    fullName: "Auto Wobble Goal Points",
    getTitle: (ms) => nOf(+ms.autoWobble1 + +ms.autoWobble2, "Wobble Goal")
  }).addTep({ columnPrefix: "Auto Wobble", fullName: "Auto Wobble Goal Points" })
).addColumn(
  new DescriptorColumn({ name: "autoPowershotPoints" }).addMatchScore({ fromSelf: (self) => self.autoPowershots * 15, dataTy: Int16DTy }).addScoreModal({
    displayName: "Powershot Points",
    columnPrefix: "Auto Powershot",
    fullName: "Auto Powershot Points",
    getTitle: (ms) => nOf(ms.autoPowershots, "Powershot")
  }).addTep({ columnPrefix: "Auto Powershot", fullName: "Auto Powershot Points" })
).addColumn(
  new DescriptorColumn({ name: "egWobblePoints" }).addMatchScore({
    fromSelf: (self) => wobbleEndPosPoints(self.wobbleEndPos1) + wobbleEndPosPoints(self.wobbleEndPos2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Wobble Goal Points",
    columnPrefix: "Endgame Wobble",
    fullName: "Endgame Wobble Goal Points"
  }).addTep({ columnPrefix: "Endgame Wobble", fullName: "Endgame Wobble Goal Points" })
).addColumn(
  new DescriptorColumn({ name: "egPowershotPoints" }).addMatchScore({ fromSelf: (self) => self.egPowershots * 15, dataTy: Int16DTy }).addScoreModal({
    displayName: "Powershot Points",
    columnPrefix: "Endgame Powershot",
    fullName: "Endgame Powershot Points",
    getTitle: (ms) => nOf(ms.egPowershots, "Powershot")
  }).addTep({ columnPrefix: "Endgame Powershot", fullName: "Endgame Powershot Points" })
).addColumn(
  new DescriptorColumn({ name: "egWobbleRingPoints" }).addMatchScore({ fromSelf: (self) => self.egWobbleRings * 5, dataTy: Int16DTy }).addScoreModal({
    displayName: "Wobble Ring Points",
    columnPrefix: "Wobble Rings",
    fullName: "Endgame Wobble Ring Points",
    getTitle: (ms) => nOf(ms.egWobbleRings, "Ring")
  }).addTep({
    columnPrefix: "Endgame Wobble Rings",
    fullName: "Endgame Wobble Ring Points"
  })
).addColumn(
  new DescriptorColumn({ name: "majorsCommittedPoints" }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points",
    sql: (ms) => `(${ms}.majorsCommitted * -30)`,
    getValue: (ms) => ms.majorsCommitted * -30,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed")
  }).addTep({
    make: (ms) => ms.majorsCommitted * -30,
    columnPrefix: "Majors",
    dialogName: "Majors",
    fullName: "Major Penalty Points"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommittedPoints" }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points",
    sql: (ms) => `(${ms}.minorsCommitted * -10)`,
    getValue: (ms) => ms.minorsCommitted * -10,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed")
  }).addTep({
    make: (ms) => ms.minorsCommitted * -10,
    columnPrefix: "Minors",
    dialogName: "Minors",
    fullName: "Minor Penalty Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoPoints" }).addMatchScore({
    fromSelf: (self) => self.autoNavPoints + self.autoTowerPoints + self.autoWobblePoints + self.autoPowershotPoints,
    dataTy: Int16DTy
  }).addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" }).addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" })
).addColumn(
  new DescriptorColumn({ name: "dcPoints" }).addMatchScore({
    fromSelf: (self) => self.dcTowerLow * 2 + self.dcTowerMid * 4 + self.dcTowerHigh * 6,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Teleop Points"
  }).addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcTowerLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "DC Tower Low",
    fullName: "Teleop Tower Low Points",
    sql: (ms) => `(${ms}.dcTowerLow * 2)`,
    getValue: (ms) => ms.dcTowerLow * 2,
    getTitle: (ms) => nOf(ms.dcTowerLow, "Ring")
  }).addTep({
    make: (ms) => ms.dcTowerLow * 2,
    columnPrefix: "DC Tower Low",
    fullName: "Teleop Tower Low Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcTowerMidPoints" }).addScoreModal({
    displayName: "Mid",
    columnPrefix: "DC Tower Mid",
    fullName: "Teleop Tower Mid Points",
    sql: (ms) => `(${ms}.dcTowerMid * 4)`,
    getValue: (ms) => ms.dcTowerMid * 4,
    getTitle: (ms) => nOf(ms.dcTowerMid, "Ring")
  }).addTep({
    make: (ms) => ms.dcTowerMid * 4,
    columnPrefix: "DC Tower Mid",
    fullName: "Teleop Tower Mid Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcTowerHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "DC Tower High",
    fullName: "Teleop Tower High Points",
    sql: (ms) => `(${ms}.dcTowerHigh * 6)`,
    getValue: (ms) => ms.dcTowerHigh * 6,
    getTitle: (ms) => nOf(ms.dcTowerHigh, "Ring")
  }).addTep({
    make: (ms) => ms.dcTowerHigh * 6,
    columnPrefix: "DC Tower High",
    fullName: "Teleop Tower High Points"
  })
).addColumn(
  new DescriptorColumn({ name: "egPoints" }).addMatchScore({
    fromSelf: (self) => self.egPowershotPoints + self.egWobblePoints + self.egWobbleRingPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Endgame",
    columnPrefix: "Endgame",
    fullName: "Endgame Points"
  }).addTep({
    columnPrefix: "Endgame",
    dialogName: "Endgame Points",
    fullName: "Endgame Points"
  })
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsCommitted" }).addMatchScore({
    fromSelf: (self) => self.majorsCommitted * -30 + self.minorsCommitted * -10,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points"
  }).addTep({
    columnPrefix: "Penalties",
    dialogName: "Penalty Points",
    fullName: "Penalty Points"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPointsNp" }).addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints + self.egPoints,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPoints" }).addMatchScore({
    fromSelf: (self) => Math.max(0, self.totalPointsNp),
    dataTy: Int16DTy
  }).addTep({ columnPrefix: "", dialogName: "Total Points", fullName: "Total Points" })
).addTree(
  [
    { val: "totalPoints", children: [] },
    { val: "totalPointsNp", children: [] },
    {
      val: "autoPoints",
      children: [
        {
          val: "autoNavPoints",
          children: [
            { val: "autoNav1", children: [] },
            { val: "autoNav2", children: [] },
            { val: "autoNavPointsIndividual", children: [] }
          ]
        },
        {
          val: "autoTowerPoints",
          children: [
            { val: "autoTowerLowPoints", children: [] },
            { val: "autoTowerMidPoints", children: [] },
            { val: "autoTowerHighPoints", children: [] }
          ]
        },
        { val: "autoWobblePoints", children: [] },
        { val: "autoPowershotPoints", children: [] }
      ]
    },
    {
      val: "dcPoints",
      children: [
        { val: "dcTowerLowPoints", children: [] },
        { val: "dcTowerMidPoints", children: [] },
        { val: "dcTowerHighPoints", children: [] }
      ]
    },
    {
      val: "egPoints",
      children: [
        { val: "egPowershotPoints", children: [] },
        {
          val: "egWobblePoints",
          children: [
            { val: "wobbleEndPos1", children: [] },
            { val: "wobbleEndPos2", children: [] }
          ]
        },
        { val: "egWobbleRingPoints", children: [] }
      ]
    },
    {
      val: "penaltyPointsCommitted",
      children: [
        { val: "majorsCommittedPoints", children: [] },
        { val: "minorsCommittedPoints", children: [] }
      ]
    }
  ],
  [
    { val: "totalPoints", children: [] },
    { val: "totalPointsNp", children: [] },
    {
      val: "autoPoints",
      children: [
        { val: "autoNavPoints", children: [] },
        {
          val: "autoTowerPoints",
          children: [
            { val: "autoTowerLowPoints", children: [] },
            { val: "autoTowerMidPoints", children: [] },
            { val: "autoTowerHighPoints", children: [] }
          ]
        },
        { val: "autoWobblePoints", children: [] },
        { val: "autoPowershotPoints", children: [] }
      ]
    },
    {
      val: "dcPoints",
      children: [
        { val: "dcTowerLowPoints", children: [] },
        { val: "dcTowerMidPoints", children: [] },
        { val: "dcTowerHighPoints", children: [] }
      ]
    },
    {
      val: "egPoints",
      children: [
        { val: "egPowershotPoints", children: [] },
        {
          val: "egWobblePoints",
          children: [
            { val: "wobbleEndPos1", children: [] },
            { val: "wobbleEndPos2", children: [] }
          ]
        },
        { val: "egWobbleRingPoints", children: [] }
      ]
    },
    {
      val: "penaltyPointsCommitted",
      children: [
        { val: "majorsCommittedPoints", children: [] },
        { val: "minorsCommittedPoints", children: [] }
      ]
    }
  ]
).finish();
const BarcodeElement2021 = {
  Duck: "Duck",
  TSE: "TSE"
};
const BarcodeElement2021DTy = EnumDTy(
  BarcodeElement2021,
  "BarcodeElement2021",
  "barcode_element_2021_enum"
);
function barcodeElementFromApi(api) {
  switch (api) {
    case "DUCK":
      return BarcodeElement2021.Duck;
    case "TEAM_SHIPPING_ELEMENT":
      return BarcodeElement2021.TSE;
  }
}
const AutoNav2021 = {
  None: "None",
  InStorage: "InStorage",
  CompletelyInStorage: "CompletelyInStorage",
  InWarehouse: "InWarehouse",
  CompletelyInWarehouse: "CompletelyInWarehouse"
};
const AutoNav2021DTy = EnumDTy(AutoNav2021, "AutoNav2021", "auto_nav_2021_enum");
function autoNav2021FromApi(api) {
  switch (api) {
    case "NONE":
      return AutoNav2021.None;
    case "IN_STORAGE":
      return AutoNav2021.InStorage;
    case "COMPLETELY_IN_STORAGE":
      return AutoNav2021.CompletelyInStorage;
    case "IN_WAREHOUSE":
      return AutoNav2021.InWarehouse;
    case "COMPLETELY_IN_WAREHOUSE":
      return AutoNav2021.CompletelyInWarehouse;
  }
}
function autoNav2021Points(nav) {
  if (nav == null)
    return 0;
  switch (nav) {
    case "None":
      return 0;
    case "InStorage":
      return 3;
    case "CompletelyInStorage":
      return 6;
    case "InWarehouse":
      return 5;
    case "CompletelyInWarehouse":
      return 10;
  }
}
function formatAutoNav2021(nav) {
  switch (nav) {
    case "None":
      return "No Park";
    case "InStorage":
      return "Partially in Storage";
    case "CompletelyInStorage":
      return "Fully in Storage";
    case "InWarehouse":
      return "Partially in Warehouse";
    case "CompletelyInWarehouse":
      return "Fully in Warehouse";
  }
}
const EgPark2021 = {
  None: "None",
  InWarehouse: "InWarehouse",
  CompletelyInWarehouse: "CompletelyInWarehouse"
};
const EgPark2021DTy = EnumDTy(EgPark2021, "EgPark2021", "eg_park_2021_enum");
function egPark2021FromApi(api) {
  switch (api) {
    case "NONE":
      return EgPark2021.None;
    case "IN_WAREHOUSE":
      return EgPark2021.InWarehouse;
    case "COMPLETELY_IN_WAREHOUSE":
      return EgPark2021.CompletelyInWarehouse;
  }
}
function egPark2021Points(park) {
  if (park == null)
    return 0;
  switch (park) {
    case "None":
      return 0;
    case "InWarehouse":
      return 3;
    case "CompletelyInWarehouse":
      return 6;
  }
}
function formatEgPark2021(park) {
  switch (park) {
    case "None":
      return "No Park";
    case "InWarehouse":
      return "Partially in Warehouse";
    case "CompletelyInWarehouse":
      return "Fully in Warehouse";
  }
}
function autoBonusPoints2021(bonus, barcode) {
  if (bonus) {
    return barcode == BarcodeElement2021.Duck ? 10 : 20;
  } else {
    return 0;
  }
}
function formatAutoBonusPoints2021(bonus, barcode) {
  let item = barcode == BarcodeElement2021.Duck ? "Duck" : "TSE";
  if (bonus) {
    return `${item} Bonus`;
  } else {
    return `No Bonus ${item}`;
  }
}
const Descriptor2021 = new Descriptor({
  season: Season.FreightFrenzy,
  seasonName: "Freight Frenzy",
  hasRemote: true,
  hasEndgame: true,
  pensSubtract: true,
  rankings: {
    rp: "TotalPoints",
    tb: "AutoEndgameTot"
  },
  firstDate: /* @__PURE__ */ new Date("2021-09-17"),
  lastDate: /* @__PURE__ */ new Date("2022-09-23"),
  kickoff: /* @__PURE__ */ new Date("2021-09-18")
}).addColumn(
  new DescriptorColumn({ name: "barcodeElement1" }).addMatchScore({
    remoteApiName: "barcodeElement",
    fromApi: (api) => barcodeElementFromApi(
      "barcodeElement1" in api ? api.barcodeElement1 : api.barcodeElement
    ),
    dataTy: BarcodeElement2021DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "barcodeElement2", tradOnly: true }).addMatchScore({
    fromApi: (api) => "barcodeElement2" in api ? barcodeElementFromApi(api.barcodeElement2) : null,
    dataTy: BarcodeElement2021DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoCarousel" }).addMatchScore({ fromApi: (api) => api.carousel, dataTy: BoolDTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoNav1" }).addMatchScore({
    apiName: "autoNav2021_1",
    remoteApiName: "autoNav2021",
    fromApi: (api) => autoNav2021FromApi(
      "autoNavigated1" in api ? api.autoNavigated1 : api.autoNavigated
    ),
    dataTy: AutoNav2021DTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => autoNav2021Points(ms.autoNav2021_1),
    getTitle: (ms) => formatAutoNav2021(ms.autoNav2021_1)
  })
).addColumn(
  new DescriptorColumn({ name: "autoNav2", tradOnly: true }).addMatchScore({
    apiName: "autoNav2021_2",
    fromApi: (api) => "autoNavigated2" in api ? autoNav2021FromApi(api.autoNavigated2) : null,
    dataTy: AutoNav2021DTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => autoNav2021Points(ms.autoNav2021_2),
    getTitle: (ms) => formatAutoNav2021(ms.autoNav2021_2)
  })
).addColumn(
  new DescriptorColumn({ name: "autoBonus1" }).addMatchScore({
    remoteApiName: "autoBonus",
    fromApi: (api) => "autoBonus1" in api ? api.autoBonus1 : api.autoBonus,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Bonus 1",
    fullName: "Robot 1 Auto Bonus Points",
    getValue: (ms) => autoBonusPoints2021(ms.autoBonus1, ms.barcodeElement1),
    getTitle: (ms) => formatAutoBonusPoints2021(ms.autoBonus1, ms.barcodeElement1)
  })
).addColumn(
  new DescriptorColumn({ name: "autoBonus2", tradOnly: true }).addMatchScore({
    fromApi: (api) => "autoBonus2" in api ? api.autoBonus2 : null,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Bonus 2",
    fullName: "Robot 2 Auto Bonus Points",
    getValue: (ms) => autoBonusPoints2021(ms.autoBonus2, ms.barcodeElement2),
    getTitle: (ms) => formatAutoBonusPoints2021(ms.autoBonus2, ms.barcodeElement2)
  })
).addColumn(
  new DescriptorColumn({ name: "autoStorageFreight" }).addMatchScore({
    fromApi: (api) => api.autoStorageFreight,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "autoFreight1" }).addMatchScore({ fromApi: (api) => api.autoFreight1, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoFreight2" }).addMatchScore({
    fromApi: (api) => api.autoFreight2,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoFreight3" }).addMatchScore({ fromApi: (api) => api.autoFreight3, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcStorageFreight" }).addMatchScore({
    fromApi: (api) => api.driverControlledStorageFreight,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcFreight1" }).addMatchScore({
    fromApi: (api) => api.driverControlledFreight1,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcFreight2" }).addMatchScore({
    fromApi: (api) => api.driverControlledFreight2,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcFreight3" }).addMatchScore({
    fromApi: (api) => api.driverControlledFreight3,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "sharedFreight", tradOnly: true }).addMatchScore({
    fromApi: (api) => "sharedFreight" in api ? api.sharedFreight : null,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "egDucks" }).addMatchScore({ fromApi: (api) => api.endgameDelivered, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "allianceBalanced" }).addMatchScore({ fromApi: (api) => api.allianceBalanced, dataTy: BoolDTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "sharedUnbalanced", tradOnly: true }).addMatchScore({
    fromApi: (api) => "sharedUnbalanced" in api ? api.sharedUnbalanced : null,
    dataTy: BoolDTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "egPark1" }).addMatchScore({
    remoteApiName: "egPark",
    fromApi: (api) => egPark2021FromApi(
      "endgameParked1" in api ? api.endgameParked1 : api.endgameParked
    ),
    dataTy: EgPark2021DTy
  }).addScoreModal({
    displayName: "Robot 1",
    remoteDisplayName: "Parking Points",
    columnPrefix: "Endgame Park 1",
    fullName: "Robot 1 Endgame Parking Points",
    getValue: (ms) => egPark2021Points(ms.egPark1),
    getTitle: (ms) => formatEgPark2021(ms.egPark1)
  })
).addColumn(
  new DescriptorColumn({ name: "egPark2", tradOnly: true }).addMatchScore({
    fromApi: (api) => "endgameParked2" in api ? egPark2021FromApi(api.endgameParked2) : null,
    dataTy: EgPark2021DTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Endgame Park 2",
    fullName: "Robot 2 Endgame Parking Points",
    getValue: (ms) => egPark2021Points(ms.egPark2),
    getTitle: (ms) => formatEgPark2021(ms.egPark2)
  })
).addColumn(
  new DescriptorColumn({ name: "capped" }).addMatchScore({
    fromApi: (api) => api.capped,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommitted" }).addMatchScore({ fromApi: (api) => api.minorPenalties, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsCommitted" }).addMatchScore({ fromApi: (api) => api.majorPenalties, dataTy: Int16DTy }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoCarouselPoints" }).addMatchScore({ fromSelf: (self) => self.autoCarousel * 10, dataTy: Int16DTy }).addScoreModal({
    displayName: "Carousel Points",
    columnPrefix: "Auto Carousel",
    fullName: "Auto Carousel Points"
  }).addTep({ columnPrefix: "Auto Carousel", fullName: "Auto Carousel Points" })
).addColumn(
  new DescriptorColumn({ name: "autoNavPoints" }).addMatchScore({
    fromSelf: (self) => {
      if ("autoNav2021_1" in self) {
        return autoNav2021Points(self.autoNav2021_1) + autoNav2021Points(self.autoNav2021_2);
      } else {
        return autoNav2021Points(self.autoNav2021);
      }
    },
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Auto Nav",
    fullName: "Auto Navigation Points",
    getValue: (ms) => "autoNav2021" in ms ? autoNav2021Points(ms.autoNav2021) : autoNav2021Points(ms.autoNav2021_1) + autoNav2021Points(ms.autoNav2021_2),
    getTitle: (ms) => "autoNav2021" in ms ? formatAutoNav2021(ms.autoNav2021) : ""
  }).addTep({ columnPrefix: "Auto Nav", fullName: "Auto Navigation Points" })
).addColumn(
  new DescriptorColumn({ name: "autoNavPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? autoNav2021Points(ms.autoNav2021_1) : station == Station.Solo ? autoNav2021Points(ms.autoNav2021) : autoNav2021Points(ms.autoNav2021_2),
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoFreightPoints" }).addMatchScore({
    fromSelf: (self) => self.autoStorageFreight * 2 + (self.autoFreight1 + self.autoFreight2 + self.autoFreight3) * 6,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Freight Points",
    columnPrefix: "Auto Freight",
    fullName: "Auto Freight Points"
  }).addTep({ columnPrefix: "Auto Freight", fullName: "Auto Freight Points" })
).addColumn(
  new DescriptorColumn({ name: "autoFreight1Points" }).addScoreModal({
    displayName: "Level 1",
    columnPrefix: "Auto Freight 1",
    fullName: "Level 1 Auto Freight Points",
    sql: (ms) => `(${ms}.autoFreight1 * 6)`,
    getValue: (ms) => ms.autoFreight1 * 6,
    getTitle: (ms) => nOf(ms.autoFreight1, "Freight", "Freight")
  }).addTep({
    make: (ms) => ms.autoFreight1 * 6,
    columnPrefix: "Auto Freight 1",
    fullName: "Level 1 Auto Freight Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoFreight2Points" }).addScoreModal({
    displayName: "Level 2",
    columnPrefix: "Auto Freight 2",
    fullName: "Level 2 Auto Freight Points",
    sql: (ms) => `(${ms}.autoFreight2 * 6)`,
    getValue: (ms) => ms.autoFreight2 * 6,
    getTitle: (ms) => nOf(ms.autoFreight2, "Freight", "Freight")
  }).addTep({
    make: (ms) => ms.autoFreight2 * 6,
    columnPrefix: "Auto Freight 2",
    fullName: "Level 2 Auto Freight Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoFreight3Points" }).addScoreModal({
    displayName: "Level 3",
    columnPrefix: "Auto Freight 3",
    fullName: "Level 3 Auto Freight Points",
    sql: (ms) => `(${ms}.autoFreight3 * 6)`,
    getValue: (ms) => ms.autoFreight3 * 6,
    getTitle: (ms) => nOf(ms.autoFreight3, "Freight", "Freight")
  }).addTep({
    make: (ms) => ms.autoFreight3 * 6,
    columnPrefix: "Auto Freight 3",
    fullName: "Level 3 Auto Freight Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoFreightStoragePoints" }).addScoreModal({
    displayName: "Storage",
    columnPrefix: "Auto Storage",
    fullName: "Auto Storage Points",
    sql: (ms) => `(${ms}.autoStorageFreight * 2)`,
    getValue: (ms) => ms.autoStorageFreight * 2,
    getTitle: (ms) => nOf(ms.autoStorageFreight, "Freight", "Freight")
  }).addTep({
    make: (ms) => ms.autoStorageFreight * 2,
    columnPrefix: "Auto Storage",
    fullName: "Auto Storage Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoBonusPoints" }).addMatchScore({
    fromSelf: (self) => {
      if ("autoBonus1" in self) {
        return autoBonusPoints2021(self.autoBonus1, self.barcodeElement1) + autoBonusPoints2021(self.autoBonus2, self.barcodeElement2);
      } else {
        return autoBonusPoints2021(self.autoBonus, self.barcodeElement);
      }
    },
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Bonus Points",
    columnPrefix: "Bonus",
    fullName: "Auto Bonus Points",
    getTitle: (ms) => "autoBonus" in ms ? formatAutoBonusPoints2021(ms.autoBonus, ms.barcodeElement) : ""
  }).addTep({ columnPrefix: "Bonus", fullName: "Auto Bonus Points" })
).addColumn(
  new DescriptorColumn({ name: "autoBonusPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.Solo ? autoBonusPoints2021(ms.autoBonus, ms.barcodeElement) : station == Station.One ? autoBonusPoints2021(ms.autoBonus1, ms.barcodeElement1) : autoBonusPoints2021(ms.autoBonus2, ms.barcodeElement2),
    columnPrefix: "Bonus Individual",
    dialogName: "Individual",
    fullName: "Auto Bonus Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcAllianceHubPoints" }).addMatchScore({
    fromSelf: (self) => self.dcFreight1 * 2 + self.dcFreight2 * 4 + self.dcFreight3 * 6,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Alliance Hub Points",
    columnPrefix: "Hub",
    fullName: "Alliance Hub Points"
  }).addTep({ columnPrefix: "Hub", fullName: "Alliance Hub Points" })
).addColumn(
  new DescriptorColumn({ name: "dcFreight1Points" }).addScoreModal({
    displayName: "Level 1",
    columnPrefix: "Hub 1",
    fullName: "Level 1 Alliance Hub Points",
    sql: (ms) => `(${ms}.dcFreight1 * 2)`,
    getValue: (ms) => ms.dcFreight1 * 2,
    getTitle: (ms) => nOf(ms.dcFreight1, "Freight", "Freight")
  }).addTep({
    make: (ms) => ms.dcFreight1 * 2,
    columnPrefix: "Hub 1",
    fullName: "Level 1 Alliance Hub Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcFreight2Points" }).addScoreModal({
    displayName: "Level 2",
    columnPrefix: "Hub 2",
    fullName: "Level 2 Alliance Hub Points",
    sql: (ms) => `(${ms}.dcFreight2 * 4)`,
    getValue: (ms) => ms.dcFreight2 * 4,
    getTitle: (ms) => nOf(ms.dcFreight2, "Freight", "Freight")
  }).addTep({
    make: (ms) => ms.dcFreight2 * 4,
    columnPrefix: "Hub 2",
    fullName: "Level 2 Alliance Hub Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcFreight3Points" }).addScoreModal({
    displayName: "Level 3",
    columnPrefix: "Hub 3",
    fullName: "Level 3 Alliance Hub Points",
    sql: (ms) => `(${ms}.dcFreight3 * 6)`,
    getValue: (ms) => ms.dcFreight3 * 6,
    getTitle: (ms) => nOf(ms.dcFreight3, "Freight", "Freight")
  }).addTep({
    make: (ms) => ms.dcFreight3 * 6,
    columnPrefix: "Hub 3",
    fullName: "Level 3 Alliance Hub Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSharedHubPoints", tradOnly: true }).addMatchScore({
    fromSelf: (self) => "sharedFreight" in self ? self.sharedFreight * 4 : 0,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Shared Hub Points",
    columnPrefix: "Shared",
    fullName: "Shared Hub Points",
    getTitle: (ms) => nOf(ms.sharedFreight, "Freight", "Freight")
  }).addTep({ columnPrefix: "Shared", fullName: "Shared Hub Points" })
).addColumn(
  new DescriptorColumn({ name: "dcStoragePoints" }).addMatchScore({ fromSelf: (self) => self.dcStorageFreight, dataTy: Int16DTy }).addScoreModal({
    displayName: "Storage Points",
    columnPrefix: "Storage",
    fullName: "Teleop Storage Points",
    getTitle: (ms) => nOf(ms.dcStorageFreight, "Freight", "Freight")
  }).addTep({ columnPrefix: "Storage", fullName: "Teleop Storage Points" })
).addColumn(
  new DescriptorColumn({ name: "egDuckPoints" }).addMatchScore({ fromSelf: (self) => self.egDucks * 6, dataTy: Int16DTy }).addScoreModal({
    displayName: "Delivery Points",
    columnPrefix: "Delivery",
    fullName: "Delivery Points",
    getTitle: (ms) => nOf(ms.egDucks, "Duck")
  }).addTep({ columnPrefix: "Delivery", fullName: "Delivery Points" })
).addColumn(
  new DescriptorColumn({ name: "allianceBalancedPoints" }).addMatchScore({ fromSelf: (self) => self.allianceBalanced * 10, dataTy: Int16DTy }).addScoreModal({
    displayName: "Balanced Points",
    columnPrefix: "Hub Balanced",
    fullName: "Alliance Hub Balanced Points"
  }).addTep({ columnPrefix: "Hub Balanced", fullName: "Alliance Hub Balanced Points" })
).addColumn(
  new DescriptorColumn({ name: "sharedUnbalancedPoints", tradOnly: true }).addMatchScore({ fromSelf: (self) => self.sharedUnbalanced * 20, dataTy: Int16DTy }).addScoreModal({
    displayName: "Tipped Points",
    columnPrefix: "Shared Tipped",
    fullName: "Shared Hub Tipped Points"
  }).addTep({ columnPrefix: "Shared Tipped", fullName: "Shared Hub Tipped Points" })
).addColumn(
  new DescriptorColumn({ name: "egParkPoints" }).addMatchScore({
    fromSelf: (self) => {
      if ("egPark1" in self) {
        return egPark2021Points(self.egPark1) + egPark2021Points(self.egPark2);
      } else {
        return egPark2021Points(self.egPark);
      }
    },
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Parking Points",
    columnPrefix: "Endgame Park",
    fullName: "Endgame Parking Points",
    getTitle: (ms) => "egPark" in ms ? formatEgPark2021(ms.egPark) : ""
  }).addTep({ columnPrefix: "Endgame Park", fullName: "Endgame Parking Points" })
).addColumn(
  new DescriptorColumn({ name: "egParkPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.Solo ? egPark2021Points(ms.egPark) : station == Station.One ? egPark2021Points(ms.egPark1) : egPark2021Points(ms.egPark2),
    columnPrefix: "Endgame Park Individual",
    dialogName: "Individual",
    fullName: "Endgame Parking Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "cappingPoints" }).addMatchScore({ fromSelf: (self) => self.capped * 15, dataTy: Int16DTy }).addScoreModal({
    displayName: "Capping Points",
    columnPrefix: "Capping",
    fullName: "Capping Points",
    getTitle: (ms) => nOf(ms.capped, "TSE Capped", "TSEs Capped")
  }).addTep({ columnPrefix: "Capping", fullName: "Capping Points" })
).addColumn(
  new DescriptorColumn({ name: "majorsCommittedPoints" }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points",
    sql: (ms) => `(${ms}.majorsCommitted * -30)`,
    getValue: (ms) => ms.majorsCommitted * -30,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed")
  }).addTep({
    make: (ms) => ms.majorsCommitted * -30,
    columnPrefix: "Majors",
    dialogName: "Majors",
    fullName: "Major Penalty Points"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommittedPoints" }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points",
    sql: (ms) => `(${ms}.minorsCommitted * -10)`,
    getValue: (ms) => ms.minorsCommitted * -10,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed")
  }).addTep({
    make: (ms) => ms.minorsCommitted * -10,
    columnPrefix: "Minors",
    dialogName: "Minors",
    fullName: "Minor Penalty Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoPoints" }).addMatchScore({
    fromSelf: (self) => self.autoCarouselPoints + self.autoNavPoints + self.autoFreightPoints + self.autoBonusPoints,
    dataTy: Int16DTy
  }).addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" }).addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" })
).addColumn(
  new DescriptorColumn({ name: "dcPoints" }).addMatchScore({
    fromSelf: (self) => self.dcAllianceHubPoints + self.dcStoragePoints + self.dcSharedHubPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Teleop Points"
  }).addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "egPoints" }).addMatchScore({
    fromSelf: (self) => self.egDuckPoints + self.allianceBalancedPoints + self.sharedUnbalancedPoints + self.egParkPoints + self.cappingPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Endgame",
    columnPrefix: "Endgame",
    fullName: "Endgame Points"
  }).addTep({
    columnPrefix: "Endgame",
    dialogName: "Endgame Points",
    fullName: "Endgame Points"
  })
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsCommitted" }).addMatchScore({
    fromSelf: (self) => self.majorsCommitted * -30 + self.minorsCommitted * -10,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points"
  }).addTep({
    columnPrefix: "Penalties",
    dialogName: "Penalty Points",
    fullName: "Penalty Points"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPointsNp" }).addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints + self.egPoints,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPoints" }).addMatchScore({
    fromSelf: (self) => Math.max(0, self.totalPointsNp + self.penaltyPointsCommitted),
    dataTy: Int16DTy
  }).addTep({ columnPrefix: "", dialogName: "Total Points", fullName: "Total Points" })
).addTree(
  [
    { val: "totalPoints", children: [] },
    { val: "totalPointsNp", children: [] },
    {
      val: "autoPoints",
      children: [
        {
          val: "autoFreightPoints",
          children: [
            { val: "autoFreight1Points", children: [] },
            { val: "autoFreight2Points", children: [] },
            { val: "autoFreight3Points", children: [] },
            { val: "autoFreightStoragePoints", children: [] }
          ]
        },
        { val: "autoCarouselPoints", children: [] },
        {
          val: "autoNavPoints",
          children: [
            { val: "autoNav1", children: [] },
            { val: "autoNav2", children: [] },
            { val: "autoNavPointsIndividual", children: [] }
          ]
        },
        {
          val: "autoBonusPoints",
          children: [
            { val: "autoBonus1", children: [] },
            { val: "autoBonus2", children: [] },
            { val: "autoBonusPointsIndividual", children: [] }
          ]
        }
      ]
    },
    {
      val: "dcPoints",
      children: [
        {
          val: "dcAllianceHubPoints",
          children: [
            { val: "dcFreight1Points", children: [] },
            { val: "dcFreight2Points", children: [] },
            { val: "dcFreight3Points", children: [] }
          ]
        },
        { val: "dcSharedHubPoints", children: [] },
        { val: "dcStoragePoints", children: [] }
      ]
    },
    {
      val: "egPoints",
      children: [
        { val: "egDuckPoints", children: [] },
        { val: "cappingPoints", children: [] },
        {
          val: "egParkPoints",
          children: [
            { val: "egPark1", children: [] },
            { val: "egPark2", children: [] },
            { val: "egParkPointsIndividual", children: [] }
          ]
        },
        { val: "allianceBalancedPoints", children: [] },
        { val: "sharedUnbalancedPoints", children: [] }
      ]
    },
    {
      val: "penaltyPointsCommitted",
      children: [
        { val: "majorsCommittedPoints", children: [] },
        { val: "minorsCommittedPoints", children: [] }
      ]
    }
  ],
  [
    { val: "totalPoints", children: [] },
    { val: "totalPointsNp", children: [] },
    {
      val: "autoPoints",
      children: [
        {
          val: "autoFreightPoints",
          children: [
            { val: "autoFreight1Points", children: [] },
            { val: "autoFreight2Points", children: [] },
            { val: "autoFreight3Points", children: [] },
            { val: "autoFreightStoragePoints", children: [] }
          ]
        },
        { val: "autoCarouselPoints", children: [] },
        { val: "autoNavPoints", children: [] },
        { val: "autoBonusPoints", children: [] }
      ]
    },
    {
      val: "dcPoints",
      children: [
        {
          val: "dcAllianceHubPoints",
          children: [
            { val: "dcFreight1Points", children: [] },
            { val: "dcFreight2Points", children: [] },
            { val: "dcFreight3Points", children: [] }
          ]
        },
        { val: "dcStoragePoints", children: [] }
      ]
    },
    {
      val: "egPoints",
      children: [
        { val: "egDuckPoints", children: [] },
        { val: "cappingPoints", children: [] },
        { val: "egParkPoints", children: [] },
        { val: "allianceBalancedPoints", children: [] }
      ]
    },
    {
      val: "penaltyPointsCommitted",
      children: [
        { val: "majorsCommittedPoints", children: [] },
        { val: "minorsCommittedPoints", children: [] }
      ]
    }
  ]
).addMatchInsightCols(
  [
    "autoFreightPoints",
    "dcFreight1Points",
    "dcSharedHubPoints",
    "sharedUnbalancedPoints",
    "egDuckPoints",
    "cappingPoints"
  ],
  ["autoFreightPoints", "dcFreight1Points", "egDuckPoints", "cappingPoints"]
).finish();
const AutoNav2022 = {
  None: "None",
  Terminal: "Terminal",
  Signal: "Signal",
  TeamSignal: "TeamSignal"
};
const AutoNav2022DTy = EnumDTy(AutoNav2022, "AutoNav2022", "auto_nav_2022_enum");
function autoNav2022FromApi(place, signalSleeve) {
  if (place == "NONE") {
    return AutoNav2022.None;
  } else if (place == "SIGNAL_ZONE") {
    return signalSleeve ? AutoNav2022.TeamSignal : AutoNav2022.Signal;
  } else {
    return AutoNav2022.Terminal;
  }
}
function autoNav2022Points(autoNav) {
  switch (autoNav) {
    case "None":
      return 0;
    case "Terminal":
      return 2;
    case "Signal":
      return 10;
    case "TeamSignal":
      return 20;
  }
}
function formatAutoNav2022(autoNav) {
  switch (autoNav) {
    case "None":
      return "No Park";
    case "Terminal":
      return "Parked in Terminal";
    case "Signal":
      return "Parked in Signal Zone";
    case "TeamSignal":
      return "Parked in Signal Zone with Custom Sleeve";
  }
}
const ConeType = {
  RedCone: "RedCone",
  BlueCone: "BlueCone",
  RedBeacon1: "RedBeacon1",
  BlueBeacon1: "BlueBeacon1",
  RedBeacon2: "RedBeacon2",
  BlueBeacon2: "BlueBeacon2"
};
const ConeTypeDTy = EnumDTy(ConeType, "ConeType", "cone_type_enum");
function coneTypeFromApi(coneType, myColor) {
  switch (coneType) {
    case "MY_CONE":
      return myColor == Alliance.Red ? ConeType.RedCone : ConeType.BlueCone;
    case "OTHER_CONE":
      return myColor == Alliance.Red ? ConeType.BlueCone : ConeType.RedCone;
    case "MY_R1_BEACON":
      return myColor == Alliance.Red ? ConeType.RedBeacon1 : ConeType.BlueBeacon1;
    case "MY_R2_BEACON":
      return myColor == Alliance.Red ? ConeType.RedBeacon2 : ConeType.BlueBeacon2;
    case "OTHER_R1_BEACON":
      return myColor == Alliance.Red ? ConeType.BlueBeacon1 : ConeType.RedBeacon1;
    case "OTHER_R2_BEACON":
      return myColor == Alliance.Red ? ConeType.BlueBeacon2 : ConeType.RedBeacon2;
  }
}
function junctionsFromApi(api, myAlliance) {
  let res = [
    [[], [], [], [], []],
    [[], [], [], [], []],
    [[], [], [], [], []],
    [[], [], [], [], []],
    [[], [], [], [], []]
  ];
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      if (api.length > x && api[x].length > y) {
        for (let c of api[x][y]) {
          res[4 - y][4 - x].push(coneTypeFromApi(c, myAlliance));
        }
      }
    }
  }
  return res;
}
let coneLayoutGQL = new GraphQLObjectType({
  name: "ConeLayout",
  fields: {
    redNearTerminal: IntTy$1,
    redFarTerminal: IntTy$1,
    blueNearTerminal: IntTy$1,
    blueFarTerminal: IntTy$1,
    junctions: listTy$1(listTy$1(listTy$1({ type: nn$1(ConeTypeDTy.gql) })))
  }
});
const ConeLayoutDTy = AnyDTy(coneLayoutGQL);
function coneLayoutFromDb(red, blue, auto) {
  return {
    redNearTerminal: auto ? red.autoTerminalCones : red.dcNearTerminalCones,
    redFarTerminal: auto ? 0 : red.dcFarTerminalCones,
    blueNearTerminal: auto ? blue.autoTerminalCones : blue.dcNearTerminalCones,
    blueFarTerminal: auto ? 0 : blue.dcFarTerminalCones,
    junctions: auto ? red.autoConeLayout : red.dcConeLayout
  };
}
const Descriptor2022 = new Descriptor({
  season: Season.PowerPlay,
  seasonName: "Power Play",
  hasRemote: false,
  hasEndgame: true,
  pensSubtract: false,
  rankings: {
    rp: "Record",
    tb: "AutoEndgameAvg"
  },
  firstDate: /* @__PURE__ */ new Date("2022-09-10"),
  lastDate: /* @__PURE__ */ new Date("2023-09-05"),
  kickoff: /* @__PURE__ */ new Date("2022-09-10")
}).addColumn(
  new DescriptorColumn({ name: "autoNav1" }).addMatchScore({
    apiName: "autoNav2022_1",
    remoteApiName: "autoNav2022",
    fromApi: (api) => autoNav2022FromApi(api.robot1Auto, api.initSignalSleeve1),
    dataTy: AutoNav2022DTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => autoNav2022Points(ms.autoNav2022_1),
    getTitle: (ms) => formatAutoNav2022(ms.autoNav2022_1)
  })
).addColumn(
  new DescriptorColumn({ name: "autoNav2" }).addMatchScore({
    apiName: "autoNav2022_2",
    fromApi: (api) => autoNav2022FromApi(api.robot2Auto, api.initSignalSleeve2),
    dataTy: AutoNav2022DTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => autoNav2022Points(ms.autoNav2022_2),
    getTitle: (ms) => formatAutoNav2022(ms.autoNav2022_2)
  })
).addColumn(
  new DescriptorColumn({ name: "autoTerminalCones" }).addMatchScore({
    fromApi: (api) => api.autoTerminal,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoGroundCones" }).addMatchScore({
    fromApi: (api) => api.autoJunctionCones[0],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoLowCones" }).addMatchScore({
    fromApi: (api) => api.autoJunctionCones[1],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoMediumCones" }).addMatchScore({
    fromApi: (api) => api.autoJunctionCones[2],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoHighCones" }).addMatchScore({
    fromApi: (api) => api.autoJunctionCones[3],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoConeLayout" }).addMatchScore({
    outer: true,
    fromApi: (api) => junctionsFromApi(api.autoJunctions, api.alliance),
    dataTy: ConeLayoutDTy,
    apiMap: (r, b) => coneLayoutFromDb(r, b, true)
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcNearTerminalCones" }).addMatchScore({
    fromApi: (api) => api.dcTerminalNear,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcFarTerminalCones" }).addMatchScore({
    fromApi: (api) => api.dcTerminalFar,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcTerminalCones" }).addMatchScore({
    fromSelf: (self) => self.dcNearTerminalCones + self.dcFarTerminalCones,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcGroundCones" }).addMatchScore({
    fromApi: (api) => api.dcJunctionCones[0],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcLowCones" }).addMatchScore({
    fromApi: (api) => api.dcJunctionCones[1],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcMediumCones" }).addMatchScore({
    fromApi: (api) => api.dcJunctionCones[2],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcHighCones" }).addMatchScore({
    fromApi: (api) => api.dcJunctionCones[3],
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcConeLayout" }).addMatchScore({
    outer: true,
    fromApi: (api) => junctionsFromApi(api.dcJunctions, api.alliance),
    dataTy: ConeLayoutDTy,
    apiMap: (r, b) => coneLayoutFromDb(r, b, false)
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "egNav1" }).addMatchScore({
    remoteApiName: "egNav",
    fromApi: (api) => api.egNavigated1,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Endgame Nav 1",
    fullName: "Robot 1 Endgame Navigation Points",
    getValue: (ms) => ms.egNav1 * 2
  })
).addColumn(
  new DescriptorColumn({ name: "egNav2" }).addMatchScore({
    fromApi: (api) => api.egNavigated2,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Endgame Nav 2",
    fullName: "Robot 2 Endgame Navigation Points",
    getValue: (ms) => ms.egNav2 * 2
  })
).addColumn(
  new DescriptorColumn({ name: "coneOwnedJunctions" }).addMatchScore({
    fromApi: (api) => api.ownedJunctions - api.beacons,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "beaconOwnedJunctions" }).addMatchScore({
    fromApi: (api) => api.beacons,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "circuit" }).addMatchScore({
    fromApi: (api) => api.circuit,
    dataTy: BoolDTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsCommitted" }).addMatchScore({
    fromApi: (api) => api.minorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsCommitted" }).addMatchScore({
    fromApi: (api) => api.majorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.minorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.majorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoNavPoints" }).addMatchScore({
    fromSelf: (self) => "autoNav2022" in self ? autoNav2022Points(self.autoNav2022) : autoNav2022Points(self.autoNav2022_1) + autoNav2022Points(self.autoNav2022_2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Auto Nav",
    fullName: "Auto Navigation Points"
  }).addTep({ columnPrefix: "Auto Nav", fullName: "Auto Navigation Points" })
).addColumn(
  new DescriptorColumn({ name: "autoNavPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? autoNav2022Points(ms.autoNav2022_1) : station == Station.Solo ? autoNav2022Points(ms.autoNav2022) : autoNav2022Points(ms.autoNav2022_2),
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoConePoints" }).addMatchScore({
    fromSelf: (self) => self.autoTerminalCones * 1 + self.autoGroundCones * 2 + self.autoLowCones * 3 + self.autoMediumCones * 4 + self.autoHighCones * 5,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Cone Points",
    columnPrefix: "Auto Cone",
    fullName: "Auto Cone Points"
  }).addTep({
    columnPrefix: "Auto Cone",
    dialogName: "Cone Points",
    fullName: "Auto Cone Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoTerminalPoints" }).addScoreModal({
    displayName: "Terminal",
    columnPrefix: "Auto Terminal",
    fullName: "Auto Terminal Points",
    sql: (ms) => `(${ms}.autoTerminalCones * 1)`,
    getValue: (ms) => ms.autoTerminalCones * 1,
    getTitle: (ms) => nOf(ms.autoTerminalCones, "Cone")
  }).addTep({
    make: (ms) => ms.autoTerminalCones * 1,
    columnPrefix: "Auto Terminal",
    fullName: "Auto Terminal Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoGroundPoints" }).addScoreModal({
    displayName: "Ground",
    columnPrefix: "Auto Ground",
    fullName: "Auto Ground Junction Points",
    sql: (ms) => `(${ms}.autoGroundCones * 2)`,
    getValue: (ms) => ms.autoGroundCones * 2,
    getTitle: (ms) => nOf(ms.autoGroundCones, "Cone")
  }).addTep({
    make: (ms) => ms.autoGroundCones * 2,
    columnPrefix: "Auto Ground",
    fullName: "Auto Ground Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "Auto Low",
    fullName: "Auto Low Junction Points",
    sql: (ms) => `(${ms}.autoLowCones * 3)`,
    getValue: (ms) => ms.autoLowCones * 3,
    getTitle: (ms) => nOf(ms.autoLowCones, "Cone")
  }).addTep({
    make: (ms) => ms.autoLowCones * 3,
    columnPrefix: "Auto Low",
    fullName: "Auto Low Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoMediumPoints" }).addScoreModal({
    displayName: "Medium",
    columnPrefix: "Auto Medium",
    fullName: "Auto Medium Junction Points",
    sql: (ms) => `(${ms}.autoMediumCones * 4)`,
    getValue: (ms) => ms.autoMediumCones * 4,
    getTitle: (ms) => nOf(ms.autoMediumCones, "Cone")
  }).addTep({
    make: (ms) => ms.autoMediumCones * 4,
    columnPrefix: "Auto Medium",
    fullName: "Auto Medium Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "Auto High",
    fullName: "Auto High Junction Points",
    sql: (ms) => `(${ms}.autoHighCones * 5)`,
    getValue: (ms) => ms.autoHighCones * 5,
    getTitle: (ms) => nOf(ms.autoHighCones, "Cone")
  }).addTep({
    make: (ms) => ms.autoHighCones * 5,
    columnPrefix: "Auto High",
    fullName: "Auto High Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "egNavPoints" }).addMatchScore({
    fromSelf: (self) => self.egNav1 * 2 + self.egNav2 * 2,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Endgame Nav",
    fullName: "Endgame Navigation Points"
  }).addTep({ columnPrefix: "Endgame Nav", fullName: "Endgame Navigation Points" })
).addColumn(
  new DescriptorColumn({ name: "egNavPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => (station == Station.One ? ms.egNav1 : station == Station.Solo ? ms.egNav : ms.egNav2) * 2,
    columnPrefix: "Endgame Nav Individual",
    dialogName: "Individual",
    fullName: "Endgame Navigation Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "ownershipPoints" }).addMatchScore({
    fromSelf: (self) => self.coneOwnedJunctions * 3 + self.beaconOwnedJunctions * 10,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Ownership Points",
    columnPrefix: "Ownership",
    fullName: "Ownership Points"
  }).addTep({ columnPrefix: "Ownership", fullName: "Ownership Points" })
).addColumn(
  new DescriptorColumn({ name: "coneOwnershipPoints" }).addScoreModal({
    displayName: "Regular",
    columnPrefix: "Cone Ownership",
    fullName: "Cone Ownership Points",
    sql: (ms) => `(${ms}.coneOwnedJunctions * 3)`,
    getValue: (ms) => ms.coneOwnedJunctions * 3,
    getTitle: (ms) => nOf(ms.coneOwnedJunctions, "Junction")
  }).addTep({
    make: (ms) => ms.coneOwnedJunctions * 3,
    columnPrefix: "Regular Ownership",
    fullName: "Cone Ownership Points"
  })
).addColumn(
  new DescriptorColumn({ name: "beaconOwnershipPoints" }).addScoreModal({
    displayName: "Beacon",
    columnPrefix: "Beacon Ownership",
    fullName: "Beacon Ownership Points",
    sql: (ms) => `(${ms}.beaconOwnedJunctions * 10)`,
    getValue: (ms) => ms.beaconOwnedJunctions * 10,
    getTitle: (ms) => nOf(ms.beaconOwnedJunctions, "Beacon")
  }).addTep({
    make: (ms) => ms.beaconOwnedJunctions * 10,
    columnPrefix: "Beacon Ownership",
    fullName: "Beacon Ownership Points"
  })
).addColumn(
  new DescriptorColumn({ name: "circuitPoints" }).addMatchScore({
    fromSelf: (self) => self.circuit * 20,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Circuit Points",
    columnPrefix: "Circuit",
    fullName: "Circuit Points"
  }).addTep({ columnPrefix: "Circuit", fullName: "Circuit Points" })
).addColumn(
  new DescriptorColumn({ name: "majorsCommittedPoints" }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points Committed",
    sql: (ms) => `(${ms}.majorsCommitted * 30)`,
    getValue: (ms) => ms.majorsCommitted * 30,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed")
  }).addTep({
    make: (ms) => ms.majorsCommitted * 30,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommittedPoints" }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points Committed",
    sql: (ms) => `(${ms}.minorsCommitted * 10)`,
    getValue: (ms) => ms.minorsCommitted * 10,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed")
  }).addTep({
    make: (ms) => ms.minorsCommitted * 10,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsCommitted" }).addMatchScore({
    fromSelf: (self) => self.majorsCommitted * 30 + self.minorsCommitted * 10,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "majorsByOppPoints" }).addTep({
    make: (ms) => ms.majorsByOpp * 30,
    columnPrefix: "Opp Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOppPoints" }).addTep({
    make: (ms) => ms.minorsByOpp * 10,
    columnPrefix: "Opp Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsByOpp" }).addMatchScore({
    fromSelf: (self) => self.majorsByOpp * 30 + self.minorsByOpp * 10,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Opp Penalties Committed",
    dialogName: "Opp Penalty Points",
    fullName: "Penalty Points by Opponent"
  }).addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points By Opponent"
  })
).addColumn(
  new DescriptorColumn({ name: "autoPoints" }).addMatchScore({
    fromSelf: (self) => self.autoNavPoints + self.autoConePoints,
    dataTy: Int16DTy
  }).addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" }).addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" })
).addColumn(
  new DescriptorColumn({ name: "dcPoints" }).addMatchScore({
    fromSelf: (self) => self.dcTerminalCones * 1 + self.dcGroundCones * 2 + self.dcLowCones * 3 + self.dcMediumCones * 4 + self.dcHighCones * 5,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Teleop Points"
  }).addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcTerminalPoints" }).addScoreModal({
    displayName: "Terminal",
    columnPrefix: "DC Terminal",
    fullName: "Teleop Terminal Points",
    sql: (ms) => `(${ms}.dcTerminalCones * 1)`,
    getValue: (ms) => ms.dcTerminalCones * 1,
    getTitle: (ms) => nOf(ms.dcTerminalCones, "Cone")
  }).addTep({
    make: (ms) => ms.dcTerminalCones * 1,
    columnPrefix: "DC Terminal",
    fullName: "Teleop Terminal Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcGroundPoints" }).addScoreModal({
    displayName: "Ground",
    columnPrefix: "DC Ground",
    fullName: "Teleop Ground Junction Points",
    sql: (ms) => `(${ms}.dcGroundCones * 2)`,
    getValue: (ms) => ms.dcGroundCones * 2,
    getTitle: (ms) => nOf(ms.dcGroundCones, "Cone")
  }).addTep({
    make: (ms) => ms.dcGroundCones * 2,
    columnPrefix: "DC Ground",
    fullName: "Teleop Ground Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "DC Low",
    fullName: "Teleop Low Junction Points",
    sql: (ms) => `(${ms}.dcLowCones * 3)`,
    getValue: (ms) => ms.dcLowCones * 3,
    getTitle: (ms) => nOf(ms.dcLowCones, "Cone")
  }).addTep({
    make: (ms) => ms.dcLowCones * 3,
    columnPrefix: "DC Low",
    fullName: "Teleop Low Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcMediumPoints" }).addScoreModal({
    displayName: "Medium",
    columnPrefix: "DC Medium",
    fullName: "Teleop Medium Junction Points",
    sql: (ms) => `(${ms}.dcMediumCones * 4)`,
    getValue: (ms) => ms.dcMediumCones * 4,
    getTitle: (ms) => nOf(ms.dcMediumCones, "Cone")
  }).addTep({
    make: (ms) => ms.dcMediumCones * 4,
    columnPrefix: "DC Medium",
    fullName: "Teleop Medium Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "DC High",
    fullName: "Teleop High Junction Points",
    sql: (ms) => `(${ms}.dcHighCones * 5)`,
    getValue: (ms) => ms.dcHighCones * 5,
    getTitle: (ms) => nOf(ms.dcHighCones, "Cone")
  }).addTep({
    make: (ms) => ms.dcHighCones * 5,
    columnPrefix: "DC High",
    fullName: "Teleop High Junction Points"
  })
).addColumn(
  new DescriptorColumn({ name: "egPoints" }).addMatchScore({
    fromSelf: (self) => self.egNavPoints + self.ownershipPoints + self.circuitPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Endgame",
    columnPrefix: "Endgame",
    fullName: "Endgame Points"
  }).addTep({
    columnPrefix: "Endgame",
    dialogName: "Endgame Points",
    fullName: "Endgame Points"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPointsNp" }).addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints + self.egPoints,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPoints" }).addMatchScore({
    fromSelf: (self) => self.totalPointsNp + self.penaltyPointsByOpp,
    dataTy: Int16DTy
  }).addTep({ columnPrefix: "", dialogName: "Total Points", fullName: "Total Points" })
).addTree([
  { val: "totalPoints", children: [] },
  { val: "totalPointsNp", children: [] },
  {
    val: "autoPoints",
    children: [
      {
        val: "autoNavPoints",
        children: [
          { val: "autoNav1", children: [] },
          { val: "autoNav2", children: [] },
          { val: "autoNavPointsIndividual", children: [] }
        ]
      },
      {
        val: "autoConePoints",
        children: [
          { val: "autoTerminalPoints", children: [] },
          { val: "autoGroundPoints", children: [] },
          { val: "autoLowPoints", children: [] },
          { val: "autoMediumPoints", children: [] },
          { val: "autoHighPoints", children: [] }
        ]
      }
    ]
  },
  {
    val: "dcPoints",
    children: [
      { val: "dcTerminalPoints", children: [] },
      { val: "dcGroundPoints", children: [] },
      { val: "dcLowPoints", children: [] },
      { val: "dcMediumPoints", children: [] },
      { val: "dcHighPoints", children: [] }
    ]
  },
  {
    val: "egPoints",
    children: [
      {
        val: "egNavPoints",
        children: [
          { val: "egNav1", children: [] },
          { val: "egNav2", children: [] },
          { val: "egNavPointsIndividual", children: [] }
        ]
      },
      {
        val: "ownershipPoints",
        children: [
          { val: "coneOwnershipPoints", children: [] },
          { val: "beaconOwnershipPoints", children: [] }
        ]
      },
      { val: "circuitPoints", children: [] }
    ]
  },
  {
    val: "penaltyPointsCommitted",
    children: [
      { val: "majorsCommittedPoints", children: [] },
      { val: "minorsCommittedPoints", children: [] }
    ]
  },
  {
    val: "penaltyPointsByOpp",
    children: [
      { val: "majorsCommittedPoints", for: "sm", children: [] },
      { val: "minorsCommittedPoints", for: "sm", children: [] },
      { val: "majorsByOppPoints", for: "tep", children: [] },
      { val: "minorsByOppPoints", for: "tep", children: [] }
    ]
  }
]).addMatchInsightCols(["autoConePoints", "circuitPoints"], ["autoConePoints", "circuitPoints"]).finish();
const AutoSpecialScoring = {
  None: "None",
  NoProp: "NoProp",
  TeamProp: "TeamProp"
};
const AutoSpecialScoringDTy = EnumDTy(
  AutoSpecialScoring,
  "AutoSpecialScoring",
  "auto_special_scoring_enum"
);
function autoSpecialScoringFromAPI(scored, teamProp) {
  if (scored) {
    if (teamProp) {
      return AutoSpecialScoring.TeamProp;
    } else {
      return AutoSpecialScoring.NoProp;
    }
  } else {
    return AutoSpecialScoring.None;
  }
}
function autoSpecialScoringPoints(autoSpecialScoring) {
  switch (autoSpecialScoring) {
    case "None":
      return 0;
    case "NoProp":
      return 10;
    case "TeamProp":
      return 20;
  }
}
function formatAutoSpecialScoringPoints(autoSpecialScoring) {
  switch (autoSpecialScoring) {
    case "None":
      return "Not scored";
    case "NoProp":
      return "Scored without prop";
    case "TeamProp":
      return "Scored with team prop";
  }
}
function dronePoints(zone) {
  if (zone == 0) {
    return 0;
  } else {
    return (4 - zone) * 10;
  }
}
const EgNav2023 = {
  None: "None",
  Backstage: "Backstage",
  Rigging: "Rigging"
};
const EgNav2023DTy = EnumDTy(EgNav2023, "EgNav2023", "endgame_nav_2023_enum");
function egNav2023FromApi(place) {
  if (place == "NONE") {
    return EgNav2023.None;
  } else if (place == "BACKSTAGE") {
    return EgNav2023.Backstage;
  } else {
    return EgNav2023.Rigging;
  }
}
function egNav2023Points(egNav) {
  switch (egNav) {
    case "None":
      return 0;
    case "Backstage":
      return 5;
    case "Rigging":
      return 20;
  }
}
function formatEgNav2023(egNav) {
  switch (egNav) {
    case "None":
      return "No Park";
    case "Backstage":
      return "Parked Backstage";
    case "Rigging":
      return "Suspended on Rigging";
  }
}
const Descriptor2023 = new Descriptor({
  season: Season.CenterStage,
  seasonName: "Centerstage",
  hasRemote: false,
  hasEndgame: true,
  pensSubtract: false,
  rankings: {
    rp: "Record",
    tb: "AutoEndgameAvg"
  },
  firstDate: /* @__PURE__ */ new Date("2023-09-10"),
  lastDate: /* @__PURE__ */ new Date("2024-09-05"),
  kickoff: /* @__PURE__ */ new Date("2023-09-09")
}).addColumn(
  new DescriptorColumn({ name: "egNav1" }).addMatchScore({
    apiName: "egNav2023_1",
    fromApi: (api) => egNav2023FromApi(api.egRobot1),
    dataTy: EgNav2023DTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Endgame Nav 1",
    fullName: "Robot 1 Endgame Navigation Points",
    getValue: (ms) => egNav2023Points(ms.egNav2023_1),
    getTitle: (ms) => formatEgNav2023(ms.egNav2023_1)
  })
).addColumn(
  new DescriptorColumn({ name: "egNav2" }).addMatchScore({
    apiName: "egNav2023_2",
    fromApi: (api) => egNav2023FromApi(api.egRobot2),
    dataTy: EgNav2023DTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Endgame Nav 2",
    fullName: "Robot 2 Endgame Navigation Points",
    getValue: (ms) => egNav2023Points(ms.egNav2023_2),
    getTitle: (ms) => formatEgNav2023(ms.egNav2023_2)
  })
).addColumn(
  new DescriptorColumn({ name: "purple1" }).addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.spikeMarkPixel1, api.initTeamProp1),
    dataTy: AutoSpecialScoringDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Purple 1",
    fullName: "Robot 1 Purple Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.purple1),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.purple1)
  })
).addColumn(
  new DescriptorColumn({ name: "purple2" }).addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.spikeMarkPixel2, api.initTeamProp2),
    dataTy: AutoSpecialScoringDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Purple 2",
    fullName: "Robot 2 Purple Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.purple2),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.purple2)
  })
).addColumn(
  new DescriptorColumn({ name: "yellow1" }).addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.targetBackdropPixel1, api.initTeamProp1),
    dataTy: AutoSpecialScoringDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Yellow 1",
    fullName: "Robot 1 Yellow Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.yellow1),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.yellow1)
  })
).addColumn(
  new DescriptorColumn({ name: "yellow2" }).addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.targetBackdropPixel2, api.initTeamProp2),
    dataTy: AutoSpecialScoringDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Yellow 2",
    fullName: "Robot 2 Yellow Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.yellow2),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.yellow2)
  })
).addColumn(
  new DescriptorColumn({ name: "autoBackdrop" }).addMatchScore({
    fromApi: (api) => api.autoBackdrop,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoBackstage" }).addMatchScore({
    fromApi: (api) => api.autoBackstage,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcBackstage" }).addMatchScore({
    fromApi: (api) => api.dcBackstagePoints,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dcBackdrop" }).addMatchScore({
    fromApi: (api) => api.dcBackdrop,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoNav1" }).addMatchScore({
    fromApi: (api) => api.robot1Auto,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => ms.autoNav1 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "autoNav2" }).addMatchScore({
    fromApi: (api) => api.robot2Auto,
    dataTy: BoolDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2 * 5
  })
).addColumn(
  new DescriptorColumn({ name: "drone1" }).addMatchScore({
    fromApi: (api) => api.drone1,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Drone 1",
    columnPrefix: "Drone 1",
    fullName: "Robot 1 Drone Points",
    getValue: (ms) => dronePoints(ms.drone1)
  })
).addColumn(
  new DescriptorColumn({ name: "drone2" }).addMatchScore({
    fromApi: (api) => api.drone2,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Drone 2",
    columnPrefix: "Drone 2",
    fullName: "Robot 2 Drone Points",
    getValue: (ms) => dronePoints(ms.drone2)
  })
).addColumn(
  new DescriptorColumn({ name: "maxSetLine" }).addMatchScore({
    fromApi: (api) => api.maxSetLine,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "mosaics" }).addMatchScore({
    fromApi: (api) => api.mosaics,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsCommitted" }).addMatchScore({
    fromApi: (api) => api.minorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsCommitted" }).addMatchScore({
    fromApi: (api) => api.majorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.minorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.majorPenalties,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "egNavPoints" }).addMatchScore({
    fromSelf: (self) => "egNav2023" in self ? egNav2023Points(self.egNav2023) : egNav2023Points(self.egNav2023_1) + egNav2023Points(self.egNav2023_2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Endgame Nav",
    fullName: "Endgame Navigation Points"
  }).addTep({ columnPrefix: "Endgame Nav", fullName: "Endgame Navigation Points" })
).addColumn(
  new DescriptorColumn({ name: "egNavPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? egNav2023Points(ms.egNav2023_1) : station == Station.Solo ? egNav2023Points(ms.egNav2023) : egNav2023Points(ms.egNav2023_2),
    columnPrefix: "Endgame Nav Individual",
    dialogName: "Individual",
    fullName: "Endgame Navigation Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "purplePoints" }).addMatchScore({
    fromSelf: (self) => autoSpecialScoringPoints(self.purple1) + autoSpecialScoringPoints(self.purple2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Purple Bonus Points",
    columnPrefix: "Purple",
    fullName: "Purple Bonus Points"
  }).addTep({ columnPrefix: "Purple", fullName: "Purple Bonus Points" })
).addColumn(
  new DescriptorColumn({ name: "purplePointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? autoSpecialScoringPoints(ms.purple1) : autoSpecialScoringPoints(ms.purple2),
    columnPrefix: "Purple Bonus Individual",
    dialogName: "Individual",
    fullName: "Purple Bonus Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "yellowPoints" }).addMatchScore({
    fromSelf: (self) => autoSpecialScoringPoints(self.yellow1) + autoSpecialScoringPoints(self.yellow2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Yellow Bonus Points",
    columnPrefix: "Yellow",
    fullName: "Yellow Bonus Points"
  }).addTep({ columnPrefix: "Yellow", fullName: "Yellow Bonus Points" })
).addColumn(
  new DescriptorColumn({ name: "yellowPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? autoSpecialScoringPoints(ms.yellow1) : autoSpecialScoringPoints(ms.yellow2),
    columnPrefix: "Yellow Bonus Individual",
    dialogName: "Individual",
    fullName: "Yellow Bonus Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoPixelPoints" }).addMatchScore({
    fromSelf: (self) => self.autoBackdrop * 5 + self.autoBackstage * 3,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Pixel Points",
    columnPrefix: "Auto Pixel",
    fullName: "Auto Pixel Points"
  }).addTep({
    columnPrefix: "Auto Pixel",
    dialogName: "Pixel Points",
    fullName: "Auto Pixel Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoBackstagePoints" }).addScoreModal({
    displayName: "Backstage",
    columnPrefix: "Auto Backstage",
    fullName: "Auto Backstage Points",
    getValue: (ms) => ms.autoBackstage * 3,
    getTitle: (ms) => nOf(ms.autoBackstage, "Pixel"),
    sql: (ms) => `(${ms}.autoBackstage * 3)`
  }).addTep({
    make: (ms) => ms.autoBackstage * 3,
    columnPrefix: "Auto Backstage",
    fullName: "Auto Backstage Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoBackdropPoints" }).addScoreModal({
    displayName: "Backdrop",
    columnPrefix: "Auto Backdrop",
    fullName: "Auto Backdrop Points",
    getValue: (ms) => ms.autoBackdrop * 5,
    getTitle: (ms) => nOf(ms.autoBackdrop, "Pixel"),
    sql: (ms) => `(${ms}.autoBackdrop * 5)`
  }).addTep({
    make: (ms) => ms.autoBackdrop * 5,
    columnPrefix: "Auto Backdrop",
    fullName: "Auto Backdrop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoNavPoints" }).addMatchScore({
    fromSelf: (self) => self.autoNav1 * 5 + self.autoNav2 * 5,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Auto Nav",
    fullName: "Auto Navigation Points"
  }).addTep({ columnPrefix: "Auto Nav", fullName: "Auto Navigation Points" })
).addColumn(
  new DescriptorColumn({ name: "autoNavPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => (station == Station.One ? ms.autoNav1 : station == Station.Solo ? ms.autoNav : ms.autoNav2) * 5,
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "dronePoints" }).addMatchScore({
    fromSelf: (self) => dronePoints(self.drone1) + dronePoints(self.drone2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Drone Points",
    columnPrefix: "Drone",
    fullName: "Drone Points"
  }).addTep({ columnPrefix: "Drone", fullName: "Drone Points" })
).addColumn(
  new DescriptorColumn({ name: "dronePointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => dronePoints(station == Station.One ? ms.drone1 : ms.drone2),
    columnPrefix: "Drone Individual",
    dialogName: "Individual",
    fullName: "Drone Points Individual"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "setLinePoints" }).addMatchScore({
    fromSelf: (self) => self.maxSetLine * 10,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Setline Points",
    columnPrefix: "Setline",
    fullName: "Setline points"
  }).addTep({ columnPrefix: "Setline", fullName: "Setline Points" })
).addColumn(
  new DescriptorColumn({ name: "mosaicPoints" }).addMatchScore({
    fromSelf: (self) => self.mosaics * 10,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Mosaic Points",
    columnPrefix: "Mosaic",
    fullName: "Mosaic Points"
  }).addTep({ columnPrefix: "Mosaic", fullName: "Mosaic Points" })
).addColumn(
  new DescriptorColumn({ name: "majorsCommittedPoints" }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points",
    getValue: (ms) => ms.majorsCommitted * 30,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed"),
    sql: (ms) => `(${ms}.majorsCommitted * 30)`
  }).addTep({
    make: (ms) => ms.majorsCommitted * 30,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommittedPoints" }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points",
    getValue: (ms) => ms.minorsCommitted * 10,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed"),
    sql: (ms) => `(${ms}.minorsCommitted * 30)`
  }).addTep({
    make: (ms) => ms.minorsCommitted * 10,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsCommitted" }).addMatchScore({
    fromSelf: (self) => self.majorsCommitted * 30 + self.minorsCommitted * 10,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "majorsByOppPoints" }).addTep({
    make: (ms) => ms.majorsByOpp * 30,
    columnPrefix: "Opp Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOppPoints" }).addTep({
    make: (ms) => ms.minorsByOpp * 10,
    columnPrefix: "Opp Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsByOpp" }).addMatchScore({
    fromSelf: (self) => self.majorsByOpp * 30 + self.minorsByOpp * 10,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Opp Penalties Committed",
    dialogName: "Opp Penalty Points",
    fullName: "Penalty Points by Opponent"
  }).addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoPoints" }).addMatchScore({
    fromSelf: (self) => self.autoNavPoints + self.autoPixelPoints + self.purplePoints + self.yellowPoints,
    dataTy: Int16DTy
  }).addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" }).addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" })
).addColumn(
  new DescriptorColumn({ name: "dcPoints" }).addMatchScore({
    fromSelf: (self) => self.dcBackdrop * 3 + self.dcBackstage * 1 + self.mosaicPoints + self.setLinePoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Driver Controlled Points"
  }).addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcBackdropPoints" }).addScoreModal({
    displayName: "Backdrop",
    columnPrefix: "DC Backdrop",
    fullName: "Driver Controlled Backdrop Points",
    getValue: (ms) => ms.dcBackdrop * 3,
    getTitle: (ms) => nOf(ms.dcBackdrop, "Pixel"),
    sql: (ms) => `(${ms}.dcBackdrop * 3)`
  }).addTep({
    make: (ms) => ms.dcBackdrop * 3,
    columnPrefix: "DC Backdrop",
    fullName: "Teleop Backdrop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcBackstagePoints" }).addScoreModal({
    displayName: "Backstage",
    columnPrefix: "DC Backstage",
    fullName: "Driver Controlled Backstage Points",
    getValue: (ms) => ms.dcBackstage * 1,
    getTitle: (ms) => nOf(ms.dcBackstage, "Pixel"),
    sql: (ms) => `(${ms}.dcBackstage * 1)`
  }).addTep({
    make: (ms) => ms.dcBackstage * 1,
    columnPrefix: "DC Backstage",
    fullName: "Teleop Backstage Points"
  })
).addColumn(
  new DescriptorColumn({ name: "egPoints" }).addMatchScore({
    fromSelf: (self) => self.egNavPoints + self.dronePoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Endgame",
    columnPrefix: "Endgame",
    fullName: "Endgame Points"
  }).addTep({
    columnPrefix: "Endgame",
    dialogName: "Endgame Points",
    fullName: "Endgame Points"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPointsNp" }).addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints + self.egPoints,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPoints" }).addMatchScore({
    fromSelf: (self) => self.totalPointsNp + self.penaltyPointsByOpp,
    dataTy: Int16DTy
  }).addTep({ columnPrefix: "", dialogName: "Total Points", fullName: "Total Points" })
).addTree([
  { val: "totalPoints", children: [] },
  { val: "totalPointsNp", children: [] },
  {
    val: "autoPoints",
    children: [
      {
        val: "autoNavPoints",
        children: [
          { val: "autoNav1", children: [] },
          { val: "autoNav2", children: [] },
          { val: "autoNavPointsIndividual", children: [] }
        ]
      },
      {
        val: "autoPixelPoints",
        children: [
          { val: "autoBackdropPoints", children: [] },
          { val: "autoBackstagePoints", children: [] }
        ]
      },
      {
        val: "purplePoints",
        children: [
          { val: "purple1", children: [] },
          { val: "purple2", children: [] },
          { val: "purplePointsIndividual", children: [] }
        ]
      },
      {
        val: "yellowPoints",
        children: [
          { val: "yellow1", children: [] },
          { val: "yellow2", children: [] },
          { val: "yellowPointsIndividual", children: [] }
        ]
      }
    ]
  },
  {
    val: "dcPoints",
    children: [
      { val: "dcBackdropPoints", children: [] },
      { val: "dcBackstagePoints", children: [] },
      { val: "mosaicPoints", children: [] },
      { val: "setLinePoints", children: [] }
    ]
  },
  {
    val: "egPoints",
    children: [
      {
        val: "egNavPoints",
        children: [
          { val: "egNav1", children: [] },
          { val: "egNav2", children: [] },
          { val: "egNavPointsIndividual", children: [] }
        ]
      },
      {
        val: "dronePoints",
        children: [
          { val: "drone1", children: [] },
          { val: "drone2", children: [] },
          { val: "dronePointsIndividual", children: [] }
        ]
      }
    ]
  },
  {
    val: "penaltyPointsCommitted",
    children: [
      { val: "majorsCommittedPoints", children: [] },
      { val: "minorsCommittedPoints", children: [] }
    ]
  },
  {
    val: "penaltyPointsByOpp",
    children: [
      { val: "majorsCommittedPoints", for: "sm", children: [] },
      { val: "minorsCommittedPoints", for: "sm", children: [] },
      { val: "majorsByOppPoints", for: "tep", children: [] },
      { val: "minorsByOppPoints", for: "tep", children: [] }
    ]
  }
]).addMatchInsightCols(["autoPixelPoints", "mosaicPoints"], ["autoPixelPoints", "mosaicPoints"]).finish();
const ITDPark = {
  ObservationZone: "ObservationZone",
  Ascent1: "Ascent1",
  Ascent2: "Ascent2",
  Ascent3: "Ascent3",
  None: "None"
};
const ITDParkDTy = EnumDTy(ITDPark, "ITDPark", "itd_park_enum");
function parkFromApi(api) {
  switch (api) {
    case "OBSERVATION_ZONE":
      return ITDPark.ObservationZone;
    case "ASCENT_1":
    case "ASCENT":
      return ITDPark.Ascent1;
    case "ASCENT_2":
      return ITDPark.Ascent2;
    case "ASCENT_3":
      return ITDPark.Ascent3;
    case "NONE":
      return ITDPark.None;
  }
}
function parkPoints(park) {
  switch (park) {
    case "ObservationZone":
      return 3;
    case "Ascent1":
      return 3;
    case "Ascent2":
      return 15;
    case "Ascent3":
      return 30;
    case "None":
      return 0;
  }
}
function formatPark(park) {
  switch (park) {
    case "ObservationZone":
      return "Observation Zone";
    case "Ascent1":
      return "Level 1 Ascent";
    case "Ascent2":
      return "Level 2 Ascent";
    case "Ascent3":
      return "Level 3 Ascent";
    case "None":
      return "No Park";
  }
}
const Descriptor2024 = new Descriptor({
  season: Season.IntoTheDeep,
  seasonName: "Into The Deep",
  hasRemote: false,
  hasEndgame: false,
  pensSubtract: false,
  rankings: {
    rp: "Record",
    tb: "AutoAscentAvg"
  },
  firstDate: /* @__PURE__ */ new Date("2024-09-07"),
  lastDate: /* @__PURE__ */ new Date("2025-09-05"),
  kickoff: /* @__PURE__ */ new Date("2024-09-07")
}).addColumn(
  new DescriptorColumn({ name: "autoPark1" }).addMatchScore({
    fromApi: (api) => parkFromApi(api.robot1Auto),
    dataTy: ITDParkDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Park 1",
    fullName: "Robot 1 Auto Parking Points",
    getValue: (ms) => parkPoints(ms.autoPark1),
    getTitle: (ms) => formatPark(ms.autoPark1)
  })
).addColumn(
  new DescriptorColumn({ name: "autoPark2" }).addMatchScore({
    fromApi: (api) => parkFromApi(api.robot2Auto),
    dataTy: ITDParkDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Park 2",
    fullName: "Robot 2 Auto Parking Points",
    getValue: (ms) => parkPoints(ms.autoPark2),
    getTitle: (ms) => formatPark(ms.autoPark2)
  })
).addColumn(
  new DescriptorColumn({ name: "autoSampleNet" }).addMatchScore({
    fromApi: (api) => api.autoSampleNet,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "autoSampleLow" }).addMatchScore({
    fromApi: (api) => api.autoSampleLow,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "autoSampleHigh" }).addMatchScore({
    fromApi: (api) => api.autoSampleHigh,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "autoSpecimenLow" }).addMatchScore({
    fromApi: (api) => api.autoSpecimenLow,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "autoSpecimenHigh" }).addMatchScore({
    fromApi: (api) => api.autoSpecimenHigh,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "dcPark1" }).addMatchScore({
    fromApi: (api) => parkFromApi(api.robot1Teleop),
    dataTy: ITDParkDTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "DC Park 1",
    fullName: "Robot 1 Teleop Parking Points",
    getValue: (ms) => parkPoints(ms.dcPark1),
    getTitle: (ms) => formatPark(ms.dcPark1)
  })
).addColumn(
  new DescriptorColumn({ name: "dcPark2" }).addMatchScore({
    fromApi: (api) => parkFromApi(api.robot2Teleop),
    dataTy: ITDParkDTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "DC Park 2",
    fullName: "Robot 2 Teleop Parking Points",
    getValue: (ms) => parkPoints(ms.dcPark2),
    getTitle: (ms) => formatPark(ms.dcPark2)
  })
).addColumn(
  new DescriptorColumn({ name: "dcSampleNet" }).addMatchScore({
    fromApi: (api) => api.teleopSampleNet,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "dcSampleLow" }).addMatchScore({
    fromApi: (api) => api.teleopSampleLow,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "dcSampleHigh" }).addMatchScore({
    fromApi: (api) => api.teleopSampleHigh,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "dcSpecimenLow" }).addMatchScore({
    fromApi: (api) => api.teleopSpecimenLow,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "dcSpecimenHigh" }).addMatchScore({
    fromApi: (api) => api.teleopSpecimenHigh,
    dataTy: Int16DTy
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommitted" }).addMatchScore({
    fromApi: (api) => api.minorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsCommitted" }).addMatchScore({
    fromApi: (api) => api.majorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.minorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.majorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "autoParkPoints" }).addMatchScore({
    fromSelf: (self) => parkPoints(self.autoPark1) + parkPoints(self.autoPark2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Parking Points",
    columnPrefix: "Auto Park",
    fullName: "Auto Parking Points"
  }).addTep({ columnPrefix: "Auto Park", fullName: "Auto Parking Points" })
).addColumn(
  new DescriptorColumn({ name: "autoParkPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => parkPoints(station == Station.One ? ms.autoPark1 : ms.autoPark2),
    columnPrefix: "Auto Park Individual",
    dialogName: "Individual",
    fullName: "Auto Parking Points Individual"
  })
).addColumn(
  new DescriptorColumn({ name: "autoSamplePoints" }).addMatchScore({
    fromSelf: (self) => self.autoSampleNet * 2 + self.autoSampleLow * 4 + self.autoSampleHigh * 8,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Sample Points",
    columnPrefix: "Auto Sample",
    fullName: "Auto Sample Points"
  }).addTep({
    columnPrefix: "Auto Sample",
    dialogName: "Sample Points",
    fullName: "Auto Sample Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoSpecimenPoints" }).addMatchScore({
    fromSelf: (self) => self.autoSpecimenLow * 6 + self.autoSpecimenHigh * 10,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Specimen Points",
    columnPrefix: "Auto Specimen",
    fullName: "Auto Specimen Points"
  }).addTep({
    columnPrefix: "Auto Specimen",
    dialogName: "Specimen Points",
    fullName: "Auto Specimen Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoSampleNetPoints" }).addScoreModal({
    displayName: "Net",
    columnPrefix: "Auto Sample Net",
    fullName: "Auto Sample Net Points",
    sql: (ms) => `(${ms}.autoSampleNet * 2)`,
    getValue: (ms) => ms.autoSampleNet * 2,
    getTitle: (ms) => nOf(ms.autoSampleNet, "Sample")
  }).addTep({
    make: (ms) => ms.autoSampleNet * 2,
    columnPrefix: "Auto Sample Net",
    fullName: "Auto Sample Net Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoSampleLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "Auto Sample Low",
    fullName: "Auto Sample Low Points",
    sql: (ms) => `(${ms}.autoSampleLow * 4)`,
    getValue: (ms) => ms.autoSampleLow * 4,
    getTitle: (ms) => nOf(ms.autoSampleLow, "Sample")
  }).addTep({
    make: (ms) => ms.autoSampleLow * 4,
    columnPrefix: "Auto Sample Low",
    fullName: "Auto Sample Low Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoSampleHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "Auto Sample High",
    fullName: "Auto Sample High Points",
    sql: (ms) => `(${ms}.autoSampleHigh * 8)`,
    getValue: (ms) => ms.autoSampleHigh * 8,
    getTitle: (ms) => nOf(ms.autoSampleHigh, "Sample")
  }).addTep({
    make: (ms) => ms.autoSampleHigh * 8,
    columnPrefix: "Auto Sample High",
    fullName: "Auto Sample High Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoSpecimenLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "Auto Specimen Low",
    fullName: "Auto Specimen Low Points",
    sql: (ms) => `(${ms}.autoSpecimenLow * 6)`,
    getValue: (ms) => ms.autoSpecimenLow * 6,
    getTitle: (ms) => nOf(ms.autoSpecimenLow, "Specimen")
  }).addTep({
    make: (ms) => ms.autoSpecimenLow * 6,
    columnPrefix: "Auto Specimen Low",
    fullName: "Auto Specimen Low Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoSpecimenHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "Auto Specimen High",
    fullName: "Auto Specimen High Points",
    sql: (ms) => `(${ms}.autoSpecimenHigh * 10)`,
    getValue: (ms) => ms.autoSpecimenHigh * 10,
    getTitle: (ms) => nOf(ms.autoSpecimenHigh, "Specimen")
  }).addTep({
    make: (ms) => ms.autoSpecimenHigh * 10,
    columnPrefix: "Auto Specimen High",
    fullName: "Auto Specimen High Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcParkPoints" }).addMatchScore({
    fromSelf: (self) => parkPoints(self.dcPark1) + parkPoints(self.dcPark2),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Parking Points",
    columnPrefix: "DC Park",
    fullName: "DC Parking Points"
  }).addTep({ columnPrefix: "DC Park", fullName: "DC Parking Points" })
).addColumn(
  new DescriptorColumn({ name: "dcParkPointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => parkPoints(station == Station.One ? ms.dcPark1 : ms.dcPark2),
    columnPrefix: "DC Park Individual",
    dialogName: "Individual",
    fullName: "DC Parking Points Individual"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSamplePoints" }).addMatchScore({
    fromSelf: (self) => self.dcSampleNet * 2 + self.dcSampleLow * 4 + self.dcSampleHigh * 8,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Sample Points",
    columnPrefix: "DC Sample",
    fullName: "DC Sample Points"
  }).addTep({
    columnPrefix: "DC Sample",
    dialogName: "Sample Points",
    fullName: "DC Sample Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSpecimenPoints" }).addMatchScore({
    fromSelf: (self) => self.dcSpecimenLow * 6 + self.dcSpecimenHigh * 10,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Specimen Points",
    columnPrefix: "DC Specimen",
    fullName: "DC Specimen Points"
  }).addTep({
    columnPrefix: "DC Specimen",
    dialogName: "Specimen Points",
    fullName: "DC Specimen Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSampleNetPoints" }).addScoreModal({
    displayName: "Net",
    columnPrefix: "DC Sample Net",
    fullName: "DC Sample Net Points",
    sql: (ms) => `(${ms}.dcSampleNet * 2)`,
    getValue: (ms) => ms.dcSampleNet * 2,
    getTitle: (ms) => nOf(ms.dcSampleNet, "Sample")
  }).addTep({
    make: (ms) => ms.dcSampleNet * 2,
    columnPrefix: "DC Sample Net",
    fullName: "DC Sample Net Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSampleLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "DC Sample Low",
    fullName: "DC Sample Low Points",
    sql: (ms) => `(${ms}.dcSampleLow * 4)`,
    getValue: (ms) => ms.dcSampleLow * 4,
    getTitle: (ms) => nOf(ms.dcSampleLow, "Sample")
  }).addTep({
    make: (ms) => ms.dcSampleLow * 4,
    columnPrefix: "DC Sample Low",
    fullName: "DC Sample Low Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSampleHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "DC Sample High",
    fullName: "DC Sample High Points",
    sql: (ms) => `(${ms}.dcSampleHigh * 8)`,
    getValue: (ms) => ms.dcSampleHigh * 8,
    getTitle: (ms) => nOf(ms.dcSampleHigh, "Sample")
  }).addTep({
    make: (ms) => ms.dcSampleHigh * 8,
    columnPrefix: "DC Sample High",
    fullName: "DC Sample High Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSpecimenLowPoints" }).addScoreModal({
    displayName: "Low",
    columnPrefix: "DC Specimen Low",
    fullName: "DC Specimen Low Points",
    sql: (ms) => `(${ms}.dcSpecimenLow * 6)`,
    getValue: (ms) => ms.dcSpecimenLow * 6,
    getTitle: (ms) => nOf(ms.dcSpecimenLow, "Specimen")
  }).addTep({
    make: (ms) => ms.dcSpecimenLow * 6,
    columnPrefix: "DC Specimen Low",
    fullName: "DC Specimen Low Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcSpecimenHighPoints" }).addScoreModal({
    displayName: "High",
    columnPrefix: "DC Specimen High",
    fullName: "DC Specimen High Points",
    sql: (ms) => `(${ms}.dcSpecimenHigh * 10)`,
    getValue: (ms) => ms.dcSpecimenHigh * 10,
    getTitle: (ms) => nOf(ms.dcSpecimenHigh, "Specimen")
  }).addTep({
    make: (ms) => ms.dcSpecimenHigh * 10,
    columnPrefix: "DC Specimen High",
    fullName: "DC Specimen High Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoPoints" }).addMatchScore({
    fromSelf: (self) => self.autoParkPoints + self.autoSamplePoints + self.autoSpecimenPoints,
    dataTy: Int16DTy
  }).addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" }).addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" })
).addColumn(
  new DescriptorColumn({ name: "dcPoints" }).addMatchScore({
    fromSelf: (self) => self.dcParkPoints + self.dcSamplePoints + self.dcSpecimenPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Teleop Points"
  }).addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points"
  })
).addColumn(
  new DescriptorColumn({ name: "majorsCommittedPoints" }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points Committed",
    sql: (ms) => `(${ms}.majorsCommitted * 15)`,
    getValue: (ms) => ms.majorsCommitted * 15,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed")
  }).addTep({
    make: (ms) => ms.majorsCommitted * 15,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommittedPoints" }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points Committed",
    sql: (ms) => `(${ms}.minorsCommitted * 5)`,
    getValue: (ms) => ms.minorsCommitted * 5,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed")
  }).addTep({
    make: (ms) => ms.minorsCommitted * 5,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsCommitted" }).addMatchScore({
    fromSelf: (self) => self.majorsCommitted * 15 + self.minorsCommitted * 5,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "majorsByOppPoints" }).addTep({
    make: (ms) => ms.majorsByOpp * 15,
    columnPrefix: "Opp Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOppPoints" }).addTep({
    make: (ms) => ms.minorsByOpp * 5,
    columnPrefix: "Opp Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsByOpp" }).addMatchScore({
    fromSelf: (self) => self.majorsByOpp * 15 + self.minorsByOpp * 5,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Opp Penalties Committed",
    dialogName: "Opp Penalty Points",
    fullName: "Penalty Points by Opponent"
  }).addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points By Opponent"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPointsNp" }).addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPoints" }).addMatchScore({
    fromSelf: (self) => self.totalPointsNp + self.penaltyPointsByOpp,
    dataTy: Int16DTy
  }).addTep({ columnPrefix: "", dialogName: "Total Points", fullName: "Total Points" })
).addTree([
  { val: "totalPoints", children: [] },
  { val: "totalPointsNp", children: [] },
  {
    val: "autoPoints",
    children: [
      {
        val: "autoParkPoints",
        children: [
          { val: "autoPark1", children: [] },
          { val: "autoPark2", children: [] },
          { val: "autoParkPointsIndividual", children: [] }
        ]
      },
      {
        val: "autoSamplePoints",
        children: [
          { val: "autoSampleNetPoints", children: [] },
          { val: "autoSampleLowPoints", children: [] },
          { val: "autoSampleHighPoints", children: [] }
        ]
      },
      {
        val: "autoSpecimenPoints",
        children: [
          { val: "autoSpecimenLowPoints", children: [] },
          { val: "autoSpecimenHighPoints", children: [] }
        ]
      }
    ]
  },
  {
    val: "dcPoints",
    children: [
      {
        val: "dcParkPoints",
        children: [
          { val: "dcPark1", children: [] },
          { val: "dcPark2", children: [] },
          { val: "dcParkPointsIndividual", children: [] }
        ]
      },
      {
        val: "dcSamplePoints",
        children: [
          { val: "dcSampleNetPoints", children: [] },
          { val: "dcSampleLowPoints", children: [] },
          { val: "dcSampleHighPoints", children: [] }
        ]
      },
      {
        val: "dcSpecimenPoints",
        children: [
          { val: "dcSpecimenLowPoints", children: [] },
          { val: "dcSpecimenHighPoints", children: [] }
        ]
      }
    ]
  },
  {
    val: "penaltyPointsCommitted",
    children: [
      { val: "majorsCommittedPoints", children: [] },
      { val: "minorsCommittedPoints", children: [] }
    ]
  },
  {
    val: "penaltyPointsByOpp",
    children: [
      { val: "majorsCommittedPoints", for: "sm", children: [] },
      { val: "minorsCommittedPoints", for: "sm", children: [] },
      { val: "majorsByOppPoints", for: "tep", children: [] },
      { val: "minorsByOppPoints", for: "tep", children: [] }
    ]
  }
]).addMatchInsightCols(
  ["autoSamplePoints", "autoSpecimenPoints", "dcSamplePoints", "dcSpecimenPoints"],
  ["autoSamplePoints", "autoSpecimenPoints", "dcSamplePoints", "dcSpecimenPoints"]
).finish();
function leavePoints(didLeave) {
  return didLeave ? 3 : 0;
}
function formatLeave(points) {
  return points ? "Left Staging Area" : "Stayed";
}
function basePoints(returnState) {
  switch (returnState) {
    case "PARTIAL":
      return 5;
    case "FULL":
      return 10;
    default:
      return 0;
  }
}
function formatBase(points) {
  switch (points) {
    case 0:
      return "Not Returned";
    case 5:
      return "Partially Returned";
    case 10:
      return "Fully Returned";
    default:
      return "";
  }
}
function baseBonus(r1, r2) {
  return r1 == "FULL" && r2 == "FULL" ? 10 : 0;
}
const ArtifactType = {
  None: "None",
  Purple: "Purple",
  Green: "Green"
};
const ArtifactTypeDTy = EnumDTy(ArtifactType, "ArtifactType", "artifact_type_enum");
function artifactTypeFromApi(artifactType) {
  switch (artifactType) {
    case "NONE":
      return ArtifactType.None;
    case "PURPLE":
      return ArtifactType.Purple;
    case "GREEN":
      return ArtifactType.Green;
  }
}
function classifierStateFromApi(api) {
  let classifier = [];
  for (const artifact of api) {
    classifier.push(artifactTypeFromApi(artifact));
  }
  return classifier;
}
let classifierStateGQL = new GraphQLList$1(ArtifactTypeDTy.gql);
const ClassiferStateDTy = AnyDTy(classifierStateGQL);
const Descriptor2025 = new Descriptor({
  season: Season.Decode,
  seasonName: "Decode",
  hasRemote: false,
  hasEndgame: false,
  pensSubtract: false,
  rankings: {
    rp: "DecodeRP",
    tb: "AvgNpBase"
  },
  rankingPoints: [
    {
      id: "movementRp",
      name: "Movement Ranking Point"
    },
    {
      id: "goalRp",
      name: "Goal Ranking Point"
    },
    {
      id: "patternRp",
      name: "Pattern Ranking Point"
    }
  ],
  firstDate: /* @__PURE__ */ new Date("2025-09-06"),
  lastDate: /* @__PURE__ */ new Date("2026-09-01"),
  kickoff: /* @__PURE__ */ new Date("2025-09-06")
}).addColumn(
  new DescriptorColumn({ name: "autoLeavePoints" }).addMatchScore({
    fromApi: (api) => api.autoLeavePoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Leave Points",
    columnPrefix: "Auto Leave",
    fullName: "Auto Leave Points"
  }).addTep({
    columnPrefix: "Auto Leave",
    dialogName: "Leave Points",
    fullName: "Auto Leave Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoLeave1" }).addMatchScore({
    fromApi: (api) => leavePoints(api.robot1Auto),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Leave 1",
    fullName: "Robot 1 Auto Leave Points",
    getTitle: (ms) => formatLeave(ms.autoLeave1)
  })
).addColumn(
  new DescriptorColumn({ name: "autoLeave2" }).addMatchScore({
    fromApi: (api) => leavePoints(api.robot2Auto),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Leave 2",
    fullName: "Robot 2 Auto Leave Points",
    getTitle: (ms) => formatLeave(ms.autoLeave2)
  })
).addColumn(
  new DescriptorColumn({ name: "autoLeavePointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? ms.autoLeave1 : station == Station.Two ? ms.autoLeave2 : 0,
    columnPrefix: "Auto Leave Individual",
    dialogName: "Individual",
    fullName: "Auto Leave Points Individual"
  })
).addColumn(
  new DescriptorColumn({ name: "autoArtifactPoints" }).addMatchScore({
    fromApi: (api) => api.autoArtifactPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Artifacts",
    columnPrefix: "Auto Artifact",
    fullName: "Auto Artifact Points"
  }).addTep({
    columnPrefix: "Auto Artifact",
    fullName: "Auto Artifact Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoArtifactClassifiedPoints" }).addMatchScore({
    fromApi: (api) => api.autoClassifiedArtifacts * 3,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Classified",
    columnPrefix: "Auto Artifact Classified",
    fullName: "Auto Classified Artifact Points"
  }).addTep({
    columnPrefix: "Auto Artifact Classified",
    fullName: "Auto Classified Artifact Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoArtifactOverflowPoints" }).addMatchScore({
    fromApi: (api) => api.autoOverflowArtifacts * 1,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Overflow",
    columnPrefix: "Auto Artifact Overflow",
    fullName: "Auto Overflow Artifact Points"
  }).addTep({
    columnPrefix: "Auto Artifact Overflow",
    fullName: "Auto Overflow Artifact Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoPatternPoints" }).addMatchScore({
    fromApi: (api) => api.autoPatternPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Pattern",
    columnPrefix: "Auto Pattern",
    fullName: "Auto Pattern Points"
  }).addTep({
    columnPrefix: "Auto Pattern",
    fullName: "Auto Pattern Points"
  })
).addColumn(
  new DescriptorColumn({ name: "autoClassifierState" }).addMatchScore({
    fromApi: (api) => classifierStateFromApi(api.autoClassifierState),
    dataTy: ClassiferStateDTy
  })
).addColumn(
  new DescriptorColumn({ name: "dcBasePoints" }).addMatchScore({
    fromApi: (api) => api.teleopBasePoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Base Points",
    columnPrefix: "DC Base",
    fullName: "DC Base Points"
  }).addTep({
    columnPrefix: "DC Base",
    fullName: "DC Base Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcBase1" }).addMatchScore({
    fromApi: (api) => basePoints(api.robot1Teleop),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "DC Base 1",
    fullName: "Robot 1 Base Points",
    getTitle: (ms) => formatBase(ms.dcBase1)
  })
).addColumn(
  new DescriptorColumn({ name: "dcBase2" }).addMatchScore({
    fromApi: (api) => basePoints(api.robot2Teleop),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "DC Base 2",
    fullName: "Robot 2 Base Points",
    getTitle: (ms) => formatBase(ms.dcBase2)
  })
).addColumn(
  new DescriptorColumn({ name: "dcBaseBonus" }).addMatchScore({
    fromApi: (api) => baseBonus(api.robot1Teleop, api.robot2Teleop),
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Bonus",
    columnPrefix: "DC Base Bonus",
    fullName: "DC Base Bonus Points"
  }).addTep({
    columnPrefix: "DC Base Bonus",
    dialogName: "Bonus",
    fullName: "DC Base Bonus Points",
    make: (ms) => ms.dcBaseBonus ?? 0
  })
).addColumn(
  new DescriptorColumn({ name: "dcBasePointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station.One ? ms.dcBase1 : station == Station.Two ? ms.dcBase2 : 0,
    columnPrefix: "DC Base Individual",
    dialogName: "Individual",
    fullName: "DC Base Points Individual"
  })
).addColumn(
  new DescriptorColumn({ name: "dcBasePointsCombined" }).addTep({
    columnPrefix: "DC Base Combined",
    dialogName: "Combined",
    fullName: "DC Base Points Combined",
    make: (ms) => (ms.dcBase1 ?? 0) + (ms.dcBase2 ?? 0)
  })
).addColumn(
  new DescriptorColumn({ name: "dcArtifactPoints" }).addMatchScore({
    fromApi: (api) => api.teleopArtifactPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Artifacts",
    columnPrefix: "DC Artifact",
    fullName: "DC Artifact Points"
  }).addTep({
    columnPrefix: "DC Artifact",
    fullName: "DC Artifact Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcArtifactClassifiedPoints" }).addMatchScore({
    fromApi: (api) => api.teleopClassifiedArtifacts * 3,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Classified",
    columnPrefix: "DC Artifact Classified",
    fullName: "DC Classified Artifact Points"
  }).addTep({
    columnPrefix: "DC Artifact Classified",
    fullName: "DC Classified Artifact Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcArtifactOverflowPoints" }).addMatchScore({
    fromApi: (api) => api.teleopOverflowArtifacts * 1,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Overflow",
    columnPrefix: "DC Artifact Overflow",
    fullName: "DC Overflow Artifact Points"
  }).addTep({
    columnPrefix: "DC Artifact Overflow",
    fullName: "DC Overflow Artifact Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcPatternPoints" }).addMatchScore({
    fromApi: (api) => api.teleopPatternPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Pattern",
    columnPrefix: "DC Pattern",
    fullName: "DC Pattern Points"
  }).addTep({
    columnPrefix: "DC Pattern",
    fullName: "DC Pattern Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcDepotPoints" }).addMatchScore({
    fromApi: (api) => api.teleopDepotPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Depot",
    columnPrefix: "DC Depot",
    fullName: "DC Depot Points"
  }).addTep({
    columnPrefix: "DC Depot",
    fullName: "DC Depot Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcClassifierState" }).addMatchScore({
    fromApi: (api) => classifierStateFromApi(api.teleopClassifierState),
    dataTy: ClassiferStateDTy
  })
).addColumn(
  new DescriptorColumn({ name: "movementRp", tradOnly: true }).addMatchScore({
    fromApi: (api) => api.movementRP,
    dataTy: BoolDTy
  }).addTep({
    columnPrefix: "Movement RP",
    fullName: "Movement Ranking Points",
    make: (ms) => ms.movementRp ? 1 : 0
  })
).addColumn(
  new DescriptorColumn({ name: "goalRp", tradOnly: true }).addMatchScore({
    fromApi: (api) => api.goalRP,
    dataTy: BoolDTy
  }).addTep({
    columnPrefix: "Goal RP",
    fullName: "Goal Ranking Points",
    make: (ms) => ms.goalRp ? 1 : 0
  })
).addColumn(
  new DescriptorColumn({ name: "patternRp", tradOnly: true }).addMatchScore({
    fromApi: (api) => api.patternRP,
    dataTy: BoolDTy
  }).addTep({
    columnPrefix: "Pattern RP",
    fullName: "Pattern Ranking Points",
    make: (ms) => ms.patternRp ? 1 : 0
  })
).addColumn(
  new DescriptorColumn({ name: "autoPoints" }).addMatchScore({
    fromApi: (api) => api.autoPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "Auto Points",
    columnPrefix: "Auto",
    fullName: "Auto Points"
  }).addTep({
    columnPrefix: "Auto",
    fullName: "Auto Points"
  })
).addColumn(
  new DescriptorColumn({ name: "dcPoints" }).addMatchScore({
    fromApi: (api) => api.teleopPoints,
    dataTy: Int16DTy
  }).addScoreModal({
    displayName: "DC Points",
    columnPrefix: "DC",
    fullName: "Driver-Controlled Points"
  }).addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Driver-Controlled Points"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommitted" }).addMatchScore({
    fromApi: (api) => api.minorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsCommitted" }).addMatchScore({
    fromApi: (api) => api.majorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.minorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsByOpp" }).addMatchScore({
    fromApi: (_, api) => api.majorFouls,
    dataTy: Int16DTy
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "majorsCommittedPoints" }).addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points Committed",
    sql: (ms) => `(${ms}.majorsCommitted * 15)`,
    getValue: (ms) => ms.majorsCommitted * 15,
    getTitle: (ms) => nOf(ms.majorsCommitted, "Major Committed", "Majors Committed")
  }).addTep({
    make: (ms) => ms.majorsCommitted * 15,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "minorsCommittedPoints" }).addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points Committed",
    sql: (ms) => `(${ms}.minorsCommitted * 5)`,
    getValue: (ms) => ms.minorsCommitted * 5,
    getTitle: (ms) => nOf(ms.minorsCommitted, "Minor Committed", "Minors Committed")
  }).addTep({
    make: (ms) => ms.minorsCommitted * 5,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsCommitted" }).addMatchScore({
    fromSelf: (self) => self.majorsCommitted * 15 + self.minorsCommitted * 5,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed"
  })
).addColumn(
  new DescriptorColumn({ name: "majorsByOppPoints" }).addTep({
    make: (ms) => ms.majorsByOpp * 15,
    columnPrefix: "Opp Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "minorsByOppPoints" }).addTep({
    make: (ms) => ms.minorsByOpp * 5,
    columnPrefix: "Opp Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points by Opponent"
  }).finish()
).addColumn(
  new DescriptorColumn({ name: "penaltyPointsByOpp" }).addMatchScore({
    fromSelf: (self) => self.majorsByOpp * 15 + self.minorsByOpp * 5,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "Opp Penalties Committed",
    dialogName: "Opp Penalty Points",
    fullName: "Penalty Points by Opponent"
  }).addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points By Opponent"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPointsNp" }).addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties"
  })
).addColumn(
  new DescriptorColumn({ name: "totalPoints" }).addMatchScore({
    fromSelf: (self) => self.totalPointsNp + self.penaltyPointsByOpp,
    dataTy: Int16DTy
  }).addTep({
    columnPrefix: "",
    dialogName: "Total Points",
    fullName: "Total Points"
  })
).addTree([
  { val: "totalPoints", children: [] },
  { val: "totalPointsNp", children: [] },
  {
    val: "autoPoints",
    children: [
      {
        val: "autoLeavePoints",
        children: [
          { val: "autoLeave1", children: [] },
          { val: "autoLeave2", children: [] },
          { val: "autoLeavePointsIndividual", for: "tep", children: [] }
        ]
      },
      {
        val: "autoArtifactPoints",
        children: [
          { val: "autoArtifactClassifiedPoints", children: [] },
          { val: "autoArtifactOverflowPoints", children: [] }
        ]
      },
      { val: "autoPatternPoints", children: [] }
    ]
  },
  {
    val: "dcPoints",
    children: [
      {
        val: "dcBasePoints",
        children: [
          { val: "dcBase1", children: [] },
          { val: "dcBase2", children: [] },
          { val: "dcBasePointsIndividual", for: "tep", children: [] },
          { val: "dcBasePointsCombined", for: "tep", children: [] },
          { val: "dcBaseBonus", children: [] }
        ]
      },
      {
        val: "dcArtifactPoints",
        children: [
          { val: "dcArtifactClassifiedPoints", children: [] },
          { val: "dcArtifactOverflowPoints", children: [] }
        ]
      },
      { val: "dcPatternPoints", children: [] },
      { val: "dcDepotPoints", children: [] }
    ]
  },
  {
    val: "penaltyPointsCommitted",
    children: [
      { val: "majorsCommittedPoints", children: [] },
      { val: "minorsCommittedPoints", children: [] }
    ]
  },
  {
    val: "penaltyPointsByOpp",
    children: [
      { val: "majorsCommittedPoints", for: "sm", children: [] },
      { val: "minorsCommittedPoints", for: "sm", children: [] },
      { val: "majorsByOppPoints", for: "tep", children: [] },
      { val: "minorsByOppPoints", for: "tep", children: [] }
    ]
  }
]).addMatchInsightCols(
  [
    "autoArtifactPoints",
    "autoPatternPoints",
    "dcArtifactPoints",
    "dcPatternPoints",
    "dcBasePoints"
  ],
  [
    "autoArtifactPoints",
    "autoPatternPoints",
    "dcArtifactPoints",
    "dcPatternPoints",
    "dcBasePoints"
  ]
).finish();
const DESCRIPTORS = {
  [Season.Decode]: Descriptor2025,
  [Season.IntoTheDeep]: Descriptor2024,
  [Season.CenterStage]: Descriptor2023,
  [Season.PowerPlay]: Descriptor2022,
  [Season.FreightFrenzy]: Descriptor2021,
  [Season.UltimateGoal]: Descriptor2020,
  [Season.Skystone]: Descriptor2019
};
const DESCRIPTORS_LIST = ALL_SEASONS.map((s) => DESCRIPTORS[s]);
const EventType = {
  Scrimmage: "Scrimmage",
  LeagueMeet: "LeagueMeet",
  Qualifier: "Qualifier",
  LeagueTournament: "LeagueTournament",
  Championship: "Championship",
  Other: "Other",
  FIRSTChampionship: "FIRSTChampionship",
  SuperQualifier: "SuperQualifier",
  InnovationChallenge: "InnovationChallenge",
  OffSeason: "OffSeason",
  Kickoff: "Kickoff",
  Workshop: "Workshop",
  DemoExhibition: "DemoExhibition",
  VolunteerSignup: "VolunteerSignup",
  PracticeDay: "PracticeDay",
  Premier: "Premier"
};
function eventTypeFromFtcApi(str) {
  let trimmed = str.replace(/[\s\-/]/g, "");
  return Object.keys(EventType).indexOf(trimmed) != -1 ? trimmed : null;
}
const EventTypeOption = {
  All: "All",
  Competition: "Competition",
  Official: "Official",
  NonCompetition: "NonCompetition",
  ...EventType
};
function getEventTypes(option) {
  switch (option) {
    case EventTypeOption.All:
      return Object.values(EventType);
    case EventTypeOption.Competition:
      return COMPETITION_EVENT_TYPES;
    case EventTypeOption.Official:
      return OFFICIAL_EVENT_TYPES;
    case EventTypeOption.NonCompetition:
      return NON_COMPETITION_EVENT_TYPES;
    default:
      return [option];
  }
}
const COMPETITION_EVENT_TYPES = [
  EventType.Scrimmage,
  EventType.LeagueMeet,
  EventType.Qualifier,
  EventType.LeagueTournament,
  EventType.Championship,
  EventType.FIRSTChampionship,
  EventType.SuperQualifier,
  EventType.OffSeason,
  EventType.Premier
];
const OFFICIAL_EVENT_TYPES = [
  EventType.LeagueMeet,
  EventType.Qualifier,
  EventType.LeagueTournament,
  EventType.Championship,
  EventType.FIRSTChampionship,
  EventType.SuperQualifier,
  EventType.Premier
];
const NON_COMPETITION_EVENT_TYPES = [
  EventType.Kickoff,
  EventType.Workshop,
  EventType.DemoExhibition,
  EventType.VolunteerSignup,
  EventType.PracticeDay,
  EventType.InnovationChallenge,
  EventType.Other
];
const RemoteOption = {
  All: "All",
  Trad: "Trad",
  Remote: "Remote"
};
let statSetCache = {};
const TEAM_STATS = [
  new NonRankStatColumn({
    color: Color.White,
    id: "team1This",
    columnName: "Team 1",
    dialogName: "Team 1",
    titleName: "Team 1",
    sqlExpr: "tmp1.team_number",
    ty: StatType.Team,
    getNonRankValue: (d) => {
      let t = d.teams.find((s) => s.station == Station.One || s.station == Station.Solo);
      return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
    }
  }),
  new NonRankStatColumn({
    color: Color.White,
    id: "team2This",
    columnName: "Team 2",
    dialogName: "Team 2",
    titleName: "Team 2",
    sqlExpr: "tmp2.team_number",
    ty: StatType.Team,
    getNonRankValue: (d) => {
      let t = d.teams.find((t2) => t2.station == Station.Two);
      return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
    }
  }),
  new NonRankStatColumn({
    color: Color.White,
    id: "team1Opp",
    columnName: "Opp Team 1",
    dialogName: "Team 1",
    titleName: "Opponent Team 1",
    sqlExpr: "tmp1Opp.team_number",
    ty: StatType.Team,
    getNonRankValue: (d) => {
      let opp = d.opponentsScore;
      if (!opp)
        return null;
      let t = opp.teams.find(
        (t2) => t2.station == Station.One || t2.station == Station.Solo
      );
      return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
    }
  }),
  new NonRankStatColumn({
    color: Color.White,
    id: "team2Opp",
    columnName: "Opp Team 2",
    dialogName: "Team 2",
    titleName: "Opponent Team 2",
    sqlExpr: "tmp2Opp.team_number",
    ty: StatType.Team,
    getNonRankValue: (d) => {
      let opp = d.opponentsScore;
      if (!opp)
        return null;
      let t = opp.teams.find((t2) => t2.station == Station.Two);
      return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
    }
  })
];
let INFO_STATS = [
  new NonRankStatColumn({
    color: Color.Purple,
    id: "matchNum",
    columnName: "Match Num",
    dialogName: "Match Number",
    titleName: "Match Number",
    sqlExpr: "match_id",
    ty: StatType.String,
    getNonRankValue: (d) => ({ ty: "string", val: d.match.description })
  }),
  new NonRankStatColumn({
    color: Color.Purple,
    id: "alliance",
    columnName: "Alliance",
    dialogName: "Alliance",
    titleName: "Alliance",
    sqlExpr: "alliance",
    ty: StatType.String,
    getNonRankValue: (d) => d.alliance ? { ty: "string", val: d.alliance } : null
  }),
  new NonRankStatColumn({
    color: Color.Purple,
    id: "event",
    columnName: "Event",
    dialogName: "Event",
    titleName: "Event",
    sqlExpr: "e.start",
    ty: StatType.Event,
    getNonRankValue: (d) => {
      let e = d.match.event;
      return e ? {
        ty: "event",
        season: e.season,
        code: e.code,
        name: e.name,
        start: e.start,
        end: e.end
      } : null;
    }
  })
];
const TOTAL_POINTS_STATS = [
  new NonRankStatColumn({
    color: Color.Blue,
    id: "totalPointsThis",
    columnName: "Total",
    dialogName: "Total Points",
    titleName: "Total Points",
    sqlExpr: `ms.totalPoints`,
    ty: StatType.Int,
    getNonRankValue: (d) => ({ ty: "int", val: d.totalPoints })
  }),
  new NonRankStatColumn({
    color: Color.Blue,
    id: "totalPointsNpThis",
    columnName: "Total NP",
    dialogName: "Total Points NP",
    titleName: "Total Points No Penalties",
    sqlExpr: `ms.totalPointsNp`,
    ty: StatType.Int,
    getNonRankValue: (d) => ({ ty: "int", val: d.totalPointsNp })
  }),
  new NonRankStatColumn({
    color: Color.Red,
    id: "totalPointsOpp",
    columnName: "Opp Total",
    dialogName: "Total Points",
    titleName: "Opponent Total Points",
    sqlExpr: `msOpp.totalPoints`,
    ty: StatType.Int,
    getNonRankValue: (d) => d.opponentsScore ? { ty: "int", val: d.opponentsScore.totalPoints } : null
  }),
  new NonRankStatColumn({
    color: Color.Red,
    id: "totalPointsNpOpp",
    columnName: "Opp Total NP",
    dialogName: "Total Points NP",
    titleName: "Opp Total Points No Penalties",
    sqlExpr: `msOpp.totalPointsNp`,
    ty: StatType.Int,
    getNonRankValue: (d) => d.opponentsScore ? { ty: "int", val: d.opponentsScore.totalPointsNp } : null
  })
];
function getMatchStatSet(season, remote) {
  let key = `${season}-${remote}`;
  let descriptor = DESCRIPTORS[season];
  if (!(season in statSetCache)) {
    let scoreStats = descriptor.scoreModalColumns().flatMap((c) => [c.getStatColumn(MSStatSide.This), c.getStatColumn(MSStatSide.Opp)]);
    let scoreSection = new StatSetSection(
      "Scores",
      [
        { val: { id: "totalPoints", name: "Total Points" }, children: [] },
        { val: { id: "totalPointsNp", name: "Total Points NP" }, children: [] },
        ...filterMapTreeList(descriptor.getSCoreModalTree(remote), (t) => ({
          id: t.id,
          name: t.displayName
        }))
      ],
      [
        {
          id: MSStatSide.This,
          name: "THIS",
          color: Color.Blue,
          description: "Points scored by this alliance."
        },
        {
          id: MSStatSide.Opp,
          name: "OPP",
          color: Color.Red,
          description: "Points scored by the opposing alliance."
        }
      ]
    );
    let teamsSection = new StatSetSection(
      "Teams",
      [
        { val: { id: "team1", name: "Team 1" }, children: [] },
        { val: { id: "team2", name: "Team 2" }, children: [] }
      ],
      [
        {
          id: MSStatSide.This,
          name: "THIS",
          color: Color.Blue,
          description: "Teams on this alliance."
        },
        {
          id: MSStatSide.Opp,
          name: "OPP",
          color: Color.Red,
          description: "Teams on the opposing alliance."
        }
      ]
    );
    let infoSection = new StatSetSection(
      "Info",
      INFO_STATS.map((s) => ({ val: { id: s.id, name: s.dialogName }, children: [] })),
      [{ id: "", name: "", color: Color.Purple, description: null }]
    );
    statSetCache[key] = new StatSet(
      `ms${season}${remote ? "Remote" : "Trad"}`,
      [...scoreStats, ...TOTAL_POINTS_STATS, ...TEAM_STATS, ...INFO_STATS],
      [scoreSection, teamsSection, infoSection]
    );
  }
  return statSetCache[key];
}
function wr(t) {
  return { type: t };
}
function nn(ty) {
  return new GraphQLNonNull(ty);
}
function list(ty) {
  return nn(new GraphQLList(ty));
}
const IntTy = wr(nn(GraphQLInt));
const FloatTy = wr(nn(GraphQLFloat));
const StrTy = wr(nn(GraphQLString));
const BoolTy = wr(nn(GraphQLBoolean));
const DateTimeTy = wr(nn(GraphQLDateTime));
const DateTy = wr(nn(GraphQLDate));
function listTy(ty) {
  return wr(list(ty.type));
}
function nullTy(ty) {
  return wr(ty.type.ofType);
}
export {
  Alliance as A,
  BoolTy as B,
  DESCRIPTORS as D,
  EventTypeOption as E,
  FloatTy as F,
  IntTy as I,
  RemoteOption as R,
  StrTy as S,
  nn as a,
  DESCRIPTORS_LIST as b,
  nullTy as c,
  DateTimeTy as d,
  listTy as e,
  DateTy as f,
  getEventTypes as g,
  groupBy as h,
  getTepStatSet as i,
  SortDir as j,
  getMatchStatSet as k,
  list as l,
  makeGQLEnum as m,
  notEmpty as n,
  Station as o,
  AllianceRole as p,
  EventType as q,
  eventTypeFromFtcApi as r,
  allianceFromApiStation as s,
  allianceRoleFromApiStation as t,
  wr as w
};
