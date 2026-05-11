import { PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, BaseEntity, ManyToOne, OneToMany } from "typeorm";
import { m as makeGQLEnum, A as Alliance, o as Station, p as AllianceRole, q as EventType, E as EventTypeOption, R as RemoteOption, j as SortDir, n as notEmpty, D as DESCRIPTORS, I as IntTy, S as StrTy, a as nn, r as eventTypeFromFtcApi } from "./types.js";
import { S as Season } from "./Season.js";
import "async-mutex";
import { DateTime } from "luxon";
import { GraphQLNonNull, GraphQLObjectType } from "graphql";
const RegionCode = {
  // cspell:disable
  AU: "AU",
  BR: "BR",
  CAAB: "CAAB",
  CABC: "CABC",
  CAON: "CAON",
  CAQC: "CAQC",
  CMPIC: "CMPIC",
  CMPZ2: "CMPZ2",
  CN: "CN",
  CY: "CY",
  DE: "DE",
  EG: "EG",
  ES: "ES",
  FR: "FR",
  GB: "GB",
  IL: "IL",
  IN: "IN",
  JM: "JM",
  KR: "KR",
  KZ: "KZ",
  LY: "LY",
  MX: "MX",
  NG: "NG",
  NL: "NL",
  NZ: "NZ",
  ONADOD: "ONADOD",
  QA: "QA",
  RO: "RO",
  RU: "RU",
  SA: "SA",
  TH: "TH",
  TW: "TW",
  USAK: "USAK",
  USAL: "USAL",
  USAR: "USAR",
  USARL: "USARL",
  USAZ: "USAZ",
  USCALA: "USCALA",
  USCALS: "USCALS",
  USCANO: "USCANO",
  USCASD: "USCASD",
  USCHS: "USCHS",
  USCO: "USCO",
  USCT: "USCT",
  USDE: "USDE",
  USFL: "USFL",
  USGA: "USGA",
  USHI: "USHI",
  USIA: "USIA",
  USID: "USID",
  USIL: "USIL",
  USIN: "USIN",
  USKY: "USKY",
  USLA: "USLA",
  USMA: "USMA",
  USMD: "USMD",
  USMI: "USMI",
  USMN: "USMN",
  USMOKS: "USMOKS",
  USMS: "USMS",
  USMT: "USMT",
  USNC: "USNC",
  USND: "USND",
  USNE: "USNE",
  USNH: "USNH",
  USNJ: "USNJ",
  USNM: "USNM",
  USNV: "USNV",
  USNYEX: "USNYEX",
  USNYLI: "USNYLI",
  USNYNY: "USNYNY",
  USOH: "USOH",
  USOK: "USOK",
  USOR: "USOR",
  USPA: "USPA",
  USRI: "USRI",
  USSC: "USSC",
  USTN: "USTN",
  USTXCE: "USTXCE",
  USTXHO: "USTXHO",
  USTXNO: "USTXNO",
  USTXSO: "USTXSO",
  USTXWP: "USTXWP",
  USUT: "USUT",
  USVA: "USVA",
  USVT: "USVT",
  USWA: "USWA",
  USWI: "USWI",
  USWV: "USWV",
  USWY: "USWY",
  ZA: "ZA"
  // cspell:enable
};
const RegionOption = {
  All: "All",
  UnitedStates: "UnitedStates",
  International: "International",
  // cspell:ignore USCA, USNY, USTX
  USCA: "USCA",
  USNY: "USNY",
  USTX: "USTX",
  ...RegionCode
};
function getRegionCodes(region) {
  switch (region) {
    case RegionOption.All:
      return Object.values(RegionCode);
    case RegionOption.UnitedStates:
      return Object.values(RegionCode).filter((c) => c.startsWith("US"));
    case RegionOption.International:
      return INTERNATIONAL_REGIONS;
    case RegionOption.USTX:
    case RegionOption.USCA:
    case RegionOption.USNY:
      return [
        ...Object.values(RegionCode).filter((c) => c.startsWith(region)),
        region
      ];
    default:
      return [region];
  }
}
const INTERNATIONAL_REGIONS = [
  RegionOption.AU,
  RegionOption.BR,
  RegionOption.CN,
  RegionOption.CY,
  RegionOption.DE,
  RegionOption.EG,
  RegionOption.ES,
  RegionOption.FR,
  RegionOption.GB,
  RegionOption.IL,
  RegionOption.IN,
  RegionOption.JM,
  RegionOption.KR,
  RegionOption.KZ,
  RegionOption.LY,
  RegionOption.MX,
  RegionOption.NG,
  RegionOption.NL,
  RegionOption.NZ,
  RegionOption.QA,
  RegionOption.RO,
  RegionOption.RU,
  RegionOption.SA,
  RegionOption.TH,
  RegionOption.TW,
  RegionOption.ZA
];
const TournamentLevel = {
  Quals: "Quals",
  Semis: "Semis",
  Finals: "Finals",
  DoubleElim: "DoubleElim"
};
function tournamentLevelFromFtcApi(str) {
  return {
    OTHER: TournamentLevel.Quals,
    QUALIFICATION: TournamentLevel.Quals,
    SEMIFINAL: TournamentLevel.Semis,
    FINAL: TournamentLevel.Finals,
    PLAYOFF: TournamentLevel.DoubleElim
  }[str];
}
function tournamentLevelValue(level) {
  switch (level) {
    case TournamentLevel.Quals:
      return 0;
    case TournamentLevel.Semis:
      return 1;
    default:
      return 2;
  }
}
const FilterOp = {
  Eq: "Eq",
  Neq: "Neq",
  Gt: "Gt",
  Gte: "Gte",
  Lt: "Lt",
  Lte: "Lte"
};
const FilterGroupTy = {
  And: "and",
  Or: "or"
};
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
const AwardType = {
  DeansListFinalist: "DeansListFinalist",
  DeansListSemiFinalist: "DeansListSemiFinalist",
  DeansListWinner: "DeansListWinner",
  JudgesChoice: "JudgesChoice",
  DivisionFinalist: "DivisionFinalist",
  DivisionWinner: "DivisionWinner",
  ConferenceFinalist: "ConferenceFinalist",
  Compass: "Compass",
  Promote: "Promote",
  Control: "Control",
  Motivate: "Motivate",
  Reach: "Reach",
  Sustain: "Sustain",
  Design: "Design",
  Innovate: "Innovate",
  Connect: "Connect",
  Think: "Think",
  TopRanked: "TopRanked",
  Inspire: "Inspire",
  Winner: "Winner",
  Finalist: "Finalist"
};
let Award = class extends BaseEntity {
  static fromApi(season, api) {
    if (api.eventCode == null || api.teamNumber == null) {
      return null;
    }
    let divisionName = api.name.includes("Division") ? api.name.split("Division")[0].trim() : api.name.includes("Conference") ? api.name.split("Conference")[0].trim() : null;
    let awardCode = awardCodeFromFtcApi(api);
    if (awardCode != null) {
      return Award.create({
        season,
        eventCode: api.eventCode,
        teamNumber: api.teamNumber,
        type: awardCode[0],
        placement: awardCode[1],
        divisionName,
        personName: api.person?.trim() ?? null
      });
    } else {
      return null;
    }
  }
};
__decorateClass$2([
  PrimaryColumn("smallint")
], Award.prototype, "season", 2);
__decorateClass$2([
  PrimaryColumn()
], Award.prototype, "eventCode", 2);
__decorateClass$2([
  PrimaryColumn("int")
], Award.prototype, "teamNumber", 2);
__decorateClass$2([
  PrimaryColumn("enum", { enum: AwardType, enumName: "award_type_enum" })
], Award.prototype, "type", 2);
__decorateClass$2([
  PrimaryColumn("smallint")
], Award.prototype, "placement", 2);
__decorateClass$2([
  Column("varchar", { nullable: true })
], Award.prototype, "divisionName", 2);
__decorateClass$2([
  Column("varchar", { nullable: true })
], Award.prototype, "personName", 2);
__decorateClass$2([
  CreateDateColumn({ type: "timestamptz" })
], Award.prototype, "createdAt", 2);
__decorateClass$2([
  UpdateDateColumn({ type: "timestamptz" })
], Award.prototype, "updatedAt", 2);
Award = __decorateClass$2([
  Entity()
], Award);
function awardCodeFromFtcApi(award) {
  switch (award.awardId) {
    case 1:
      return [AwardType.JudgesChoice, awardTop(award, 7)];
    case 2:
      return [AwardType.Compass, awardTop(award, 3)];
    case 3:
      return [AwardType.Promote, awardTop(award, 3)];
    case 4:
      return [AwardType.Control, awardTop(award, 3)];
    case 5:
      return [AwardType.Motivate, awardTop(award, 3)];
    case 6:
      return [AwardType.Design, awardTop(award, 3)];
    case 7:
      return [AwardType.Innovate, awardTop(award, 3)];
    case 8:
      return [AwardType.Connect, awardTop(award, 3)];
    case 9:
      return [AwardType.Think, awardTop(award, 3)];
    case 10:
      if (award.name.includes(" Finalists")) {
        return [AwardType.DeansListFinalist, awardTop(award, 100)];
      } else if (award.name.includes(" Semi-Finalists")) {
        return [AwardType.DeansListSemiFinalist, awardTop(award, 100)];
      } else if (award.name.includes(" Winner")) {
        return [AwardType.DeansListWinner, awardTop(award, 100)];
      } else {
        throw `Can't handle Dean's List named '${award.name}'`;
      }
    case 11:
      return [AwardType.Inspire, awardTop(award, 3)];
    case 13:
      return [AwardType.Winner, awardTop(award, 3)];
    case 12:
      return [AwardType.Finalist, awardTop(award, 3)];
    case 14:
      return [AwardType.TopRanked, awardTop(award, 6)];
    case 15:
      return [AwardType.Finalist, awardTop(award, 999)];
    case 17:
      return [AwardType.Winner, awardTop(award, 1)];
    case 18:
    case 19:
      return null;
    case 22:
      return [AwardType.DivisionFinalist, awardTop(award, 3)];
    case 23:
      return [AwardType.DivisionWinner, awardTop(award, 3)];
    case 24:
      return [AwardType.ConferenceFinalist, awardTop(award, 3)];
    case 25:
      return [AwardType.Reach, awardTop(award, 3)];
    case 26:
      return [AwardType.Sustain, awardTop(award, 3)];
    case 102:
      return [AwardType.Compass, awardTop(award, 5, true)];
    case 103:
      return [AwardType.Promote, awardTop(award, 5, true)];
    case 104:
      return [AwardType.Control, awardTop(award, 5, true)];
    case 105:
      return [AwardType.Motivate, awardTop(award, 5, true)];
    case 106:
      return [AwardType.Design, awardTop(award, 5, true)];
    case 107:
      return [AwardType.Innovate, awardTop(award, 5, true)];
    case 108:
      return [AwardType.Connect, awardTop(award, 5, true)];
    case 109:
      return [AwardType.Think, awardTop(award, 5, true)];
    case 111:
      return [AwardType.Inspire, awardTop(award, 4, true)];
    case 125:
      return [AwardType.Reach, awardTop(award, 5, true)];
    case 126:
      return [AwardType.Sustain, awardTop(award, 5, true)];
    default:
      throw "Can't handle award: " + JSON.stringify(award);
  }
}
function awardTop(award, top, shift = false) {
  if (award.series <= top) {
    return award.series + (shift ? 1 : 0);
  } else {
    throw "Can't handle award: " + JSON.stringify(award);
  }
}
const AllianceGQL = makeGQLEnum(Alliance, "Alliance");
const StationGQL = makeGQLEnum(Station, "Station");
const AllianceRoleGQL = makeGQLEnum(AllianceRole, "AllianceRole");
const EventTypeGQL = makeGQLEnum(EventType, "EventType");
const EventTypeOptionGQL = makeGQLEnum(EventTypeOption, "EventTypeOption");
const RemoteOptionGQL = makeGQLEnum(RemoteOption, "RemoteOption");
const RegionOptionGQL = makeGQLEnum(RegionOption, "RegionOption");
const TournamentLevelGQL = makeGQLEnum(TournamentLevel, "TournamentLevel");
const AwardTypeGQL = makeGQLEnum(AwardType, "AwardType");
const SortDirGQL = makeGQLEnum(SortDir, "SortDir");
const FilterOpGQL = makeGQLEnum(FilterOp, "FilterOp");
const FilterGroupTyGQL = makeGQLEnum(FilterGroupTy, "FilterGroupTy");
function makeMatchScoreTys(descriptor) {
  return [makeMSTysTrad(descriptor), makeMSTysRemote(descriptor)].filter(notEmpty);
}
function frontendMSFromDB(ms) {
  function fields(s, remote) {
    let ret = {};
    let descriptor = DESCRIPTORS[s.season];
    for (let c of descriptor.msColumns()) {
      if (c.outer || remote && c.tradOnly)
        continue;
      ret[c.getApiName(remote)] = s[c.dbColName];
    }
    return ret;
  }
  if (ms.length == 1) {
    let s = ms[0];
    if (s.alliance != Alliance.Solo)
      return null;
    return {
      __typename: `MatchScores${s.season}Remote`,
      season: s.season,
      eventCode: s.eventCode,
      matchId: s.matchId,
      alliance: Alliance.Solo,
      ...fields(s, true)
    };
  } else if (ms.length == 2) {
    let red = ms.find((s) => s.alliance == Alliance.Red);
    let blue = ms.find((s) => s.alliance == Alliance.Blue);
    if (red == void 0 || blue == void 0)
      return null;
    let ret = {
      __typename: DESCRIPTORS[red.season].hasRemote ? `MatchScores${red.season}Trad` : `MatchScores${red.season}`,
      season: red.season,
      eventCode: red.eventCode,
      matchId: red.matchId,
      red: {
        season: red.season,
        eventCode: red.eventCode,
        matchId: red.matchId,
        alliance: Alliance.Red,
        ...fields(red, false)
      },
      blue: {
        season: red.season,
        eventCode: red.eventCode,
        matchId: red.matchId,
        alliance: Alliance.Blue,
        ...fields(blue, false)
      }
    };
    let descriptor = DESCRIPTORS[red.season];
    for (let c of descriptor.msColumns()) {
      if (!c.outer)
        continue;
      ret[c.getApiName(false)] = "apiMap" in c && c.apiMap ? c.apiMap(red, blue) : red[c.dbColName];
    }
    return ret;
  }
  return null;
}
function makeMSTysTrad(descriptor) {
  let innerFields = {
    season: IntTy,
    eventCode: StrTy,
    matchId: IntTy,
    alliance: { type: nn(AllianceGQL) }
  };
  let outerFields = {
    season: IntTy,
    eventCode: StrTy,
    matchId: IntTy
  };
  for (let c of descriptor.msColumns()) {
    let type = new GraphQLNonNull(c.dataTy.gql);
    if (c.outer) {
      outerFields[c.getApiName(false)] = { type };
    } else {
      innerFields[c.getApiName(false)] = { type };
    }
  }
  let allianceTy = new GraphQLObjectType({
    name: `MatchScores${descriptor.season}Alliance`,
    fields: innerFields
  });
  let outerTy = new GraphQLObjectType({
    name: descriptor.hasRemote ? `MatchScores${descriptor.season}Trad` : `MatchScores${descriptor.season}`,
    fields: {
      ...outerFields,
      red: { type: nn(allianceTy) },
      blue: { type: nn(allianceTy) }
    }
  });
  return outerTy;
}
function makeMSTysRemote(descriptor) {
  if (!descriptor.hasRemote)
    return null;
  let fields = {
    season: IntTy,
    eventCode: StrTy,
    matchId: IntTy,
    alliance: { type: nn(AllianceGQL) }
  };
  for (let c of descriptor.msColumns()) {
    if (c.tradOnly)
      continue;
    let type = c.dataTy.gql;
    fields[c.getApiName(true)] = { type: new GraphQLNonNull(type) };
  }
  let outerTy = new GraphQLObjectType({
    name: `MatchScores${descriptor.season}Remote`,
    fields
  });
  return outerTy;
}
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
let Match = class extends BaseEntity {
  get matchNum() {
    return this.id % 1e3;
  }
  get description() {
    switch (this.tournamentLevel) {
      case TournamentLevel.Quals:
        return `Q-${this.matchNum}`;
      case TournamentLevel.Semis:
        return `SF${this.series}-${this.matchNum}`;
      case TournamentLevel.Finals:
        return `F-${this.matchNum}`;
      case TournamentLevel.DoubleElim:
        return this.matchNum > 1 ? `M-${this.series}.${this.matchNum}` : `M-${this.series}`;
    }
  }
  static fromApi(api, event, hasBeenPlayed, allMatches) {
    let timezone = event.timezone;
    let tournamentLevel = tournamentLevelFromFtcApi(api.tournamentLevel);
    let [tournamentLevel_, series, matchNum] = computeMatchOrder(
      tournamentLevel,
      api,
      event,
      allMatches
    );
    tournamentLevel = tournamentLevel_;
    return Match.create({
      eventSeason: event.season,
      eventCode: event.code,
      id: event.remote ? api.teams[0].teamNumber * 1e3 + matchNum : tournamentLevelValue(tournamentLevel) * 1e4 + series * 1e3 + matchNum,
      hasBeenPlayed,
      scheduledStartTime: DateTime.fromISO(api.startTime, { zone: timezone }).year > 2e3 ? DateTime.fromISO(api.startTime, { zone: timezone }).toJSDate() : null,
      actualStartTime: api.actualStartTime ? DateTime.fromISO(api.actualStartTime, { zone: timezone }).toJSDate() : null,
      postResultTime: api.postResultTime ? DateTime.fromISO(api.postResultTime, { zone: timezone }).toJSDate() : null,
      tournamentLevel,
      series
    });
  }
  toFrontend() {
    return { ...this, scores: frontendMSFromDB(this.scores) };
  }
};
__decorateClass$1([
  PrimaryColumn("smallint")
], Match.prototype, "eventSeason", 2);
__decorateClass$1([
  PrimaryColumn()
], Match.prototype, "eventCode", 2);
__decorateClass$1([
  PrimaryColumn("int")
], Match.prototype, "id", 2);
__decorateClass$1([
  ManyToOne(() => Event, (event) => event.matches)
], Match.prototype, "event", 2);
__decorateClass$1([
  Column()
], Match.prototype, "hasBeenPlayed", 2);
__decorateClass$1([
  Column("timestamptz", { nullable: true })
], Match.prototype, "scheduledStartTime", 2);
__decorateClass$1([
  Column("timestamptz", { nullable: true })
], Match.prototype, "actualStartTime", 2);
__decorateClass$1([
  Column("timestamptz", { nullable: true })
], Match.prototype, "postResultTime", 2);
__decorateClass$1([
  Column("enum", { enum: TournamentLevel, enumName: "tournament_level_enum" })
], Match.prototype, "tournamentLevel", 2);
__decorateClass$1([
  Column("smallint")
], Match.prototype, "series", 2);
__decorateClass$1([
  CreateDateColumn({ type: "timestamptz" })
], Match.prototype, "createdAt", 2);
__decorateClass$1([
  UpdateDateColumn({ type: "timestamptz" })
], Match.prototype, "updatedAt", 2);
Match = __decorateClass$1([
  Entity()
], Match);
function computeMatchOrder(level, api, event, allMatches) {
  if (event.remote) {
    return [level, 0, api.matchNumber];
  }
  if (level != TournamentLevel.DoubleElim) {
    return [level, api.series, api.matchNumber];
  }
  let uniquePlayoffTeams = allMatches.filter((m) => m.tournamentLevel == "PLAYOFF").flatMap((m) => m.teams.map((t) => t.teamNumber));
  uniquePlayoffTeams = [...new Set(uniquePlayoffTeams)];
  if (uniquePlayoffTeams.length <= 4) {
    level = TournamentLevel.Finals;
    return [level, 0, api.matchNumber];
  }
  return [level, api.series, api.matchNumber];
}
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
let Event = class extends BaseEntity {
  static fromApi(api, season) {
    let type = eventTypeFromFtcApi(api.typeName ?? "");
    if (api.code == null || type == null || api.country == null || api.stateprov == null || api.city == null) {
      console.error(api, type);
      console.error(`Rejecting api event ${season} ${api.code}.`);
      return null;
    }
    const EDIT_EVENT_BY_CODE = {
      FTCCMP1: "FIRST World Championship - Finals Division",
      FTCCMP1FRNK: "FIRST World Championship - Franklin Division",
      FTCCMP1FRAN: "FIRST World Championship - Franklin Division",
      FTCCMP1JEMI: "FIRST World Championship - Jemison Division",
      FTCCMP1EDIS: "FIRST World Championship - Edison Division",
      FTCCMP1OCHO: "FIRST World Championship - Ochoa Division",
      FTCCMP1JACK: "FIRST World Championship - Jackson Division",
      FTCCMP1GOOD: "FIRST World Championship - Goodall Division",
      FTCCMP1LOVE: "FIRST World Championship - Lovelace Division",
      FTCCMP1ROSS: "FIRST World Championship - Ross Division",
      // Old event division weren't named nicely. cspell:disable
      "19MICMP2": "FIRST in Michigan FTC State Championship - Warren",
      "19MICMP2MARIECURIE": "FIRST in Michigan FTC State Championship - Warren - Marie Curie Division",
      "19MICMP2WOODIEFLOWER": "FIRST in Michigan FTC State Championship - Warren - Woodie Flowers Division",
      "2019FLC1": "Florida FTC State Championship",
      "2019FLC1LAWRENCE": "Florida FTC State Championship - Lawrence Division",
      "2019FLC1SCOTT": "Florida FTC State Championship - Scott Division",
      "2019GACMP": "Georgia State Championship",
      "2019GACMPKILRAIN": "Georgia State Championship - Kilrain Division",
      "2019GACMPPEMBERTON": "Georgia State Championship - Pemberton Division",
      "2019IACMP1": "Iowa Championship",
      "2019IACMP1BLACK": "Iowa Championship - Black Division",
      "2019IACMP1GOLD": "Iowa Championship - Gold Division",
      "2019MOC1": "Missouri State Championship",
      "2019MOC1SDIVISION": "Missouri State Championship - S Division",
      "2019MOC1TDIVISION": "Missouri State Championship - T Division",
      "2019TXCCMP": "Central Texas FIRST Tech Challenge Regional Championship",
      "2019TXCCMPKANE": "Central Texas FIRST Tech Challenge Regional Championship - Kane Division",
      "2019TXCCMPNAYLOR": "Central Texas FIRST Tech Challenge Regional Championship - Naylor Division",
      "63707970587.8573": "2019-2020 MN FTC Stratasys State Championship",
      "63707970587.8573GALA": "2019-2020 MN FTC Stratasys State Championship - Galaxy Division",
      "63707970587.8573NANO": "2019-2020 MN FTC Stratasys State Championship - Nano Division",
      "63713064000.6815": ",MD-DC SKYSTONE Championship",
      "63713064000.6815COLL": "MD-DC SKYSTONE Championship - Collins Aerospace Division",
      "63713064000.6815KAHL": "MD-DC SKYSTONE Championship - Kahlert Division",
      AZFTCCP: "Arizona FIRST Tech Challenge Championship",
      AZFTCCPGRANDCANYON: "Arizona FIRST Tech Challenge Championship - Grand Canyon Division",
      AZFTCCPSAGUARO: "Arizona FIRST Tech Challenge Championship - Saguaro Division",
      LACHAMP: "Los Angeles Championship Monrovia, CA",
      LACHAMPGALILEO: "Los Angeles Championship Monrovia, CA - Galileo Division",
      LACHAMPODYSSEY: "Los Angeles Championship Monrovia, CA - Odyssey Division",
      NTXCH01: "North Texas FTC Regional Championship",
      NTXCH01RUBY: "North Texas FTC Regional Championship - Ruby Division",
      NTXCH01SAPPHIRE: "North Texas FTC Regional Championship - Sapphire Division",
      PACHAMP1: "Pennsylvania FTC Championship",
      PACHAMP1ALLEGHENY: "Pennsylvania FTC Championship - Allegheny Division",
      PACHAMP1POCONO: "Pennsylvania FTC Championship - Pocono Division"
      // cspell:enable
    };
    function fixLocations(event_name) {
      const replacements = [["Chinese Taipei", "Taiwan"]];
      for (const [old_str, new_str] of replacements) {
        if (event_name.includes(old_str)) {
          return event_name.replace(old_str, new_str);
        }
      }
      return event_name;
    }
    const MODIFIED_RULES = [
      // cspell:disable
      "USTXCECCS"
      // cspell:enable
    ];
    const MODIFIED_REGION_CODES = {
      NE: RegionCode.USNE
    };
    const EVENT_LIVESTREAM_OVERRIDES = {
      [Season.Decode]: {
        FTCCMP1: [
          {
            day: /* @__PURE__ */ new Date("2026-04-29"),
            liveStreamURL: "https://www.youtube.com/watch?v=llW0_BOPt_E"
          },
          {
            day: /* @__PURE__ */ new Date("2026-04-30"),
            liveStreamURL: "https://www.youtube.com/watch?v=SuBzmIbCyFE"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-01"),
            liveStreamURL: "https://www.youtube.com/watch?v=zNKWz-nAI7E"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-02"),
            liveStreamURL: "https://www.youtube.com/watch?v=abjNLBFk1N8"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-03"),
            liveStreamURL: "https://www.youtube.com/watch?v=6PZDgfPz14Y"
          }
        ],
        FTCCMP1EDIS: [
          {
            day: /* @__PURE__ */ new Date("2026-04-29"),
            liveStreamURL: "https://www.youtube.com/watch?v=SEbooZaBoIs"
          },
          {
            day: /* @__PURE__ */ new Date("2026-04-30"),
            liveStreamURL: "https://www.youtube.com/watch?v=v_KlA02le9g"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-01"),
            liveStreamURL: "https://www.youtube.com/watch?v=ATn3vKK9Cac"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-02"),
            liveStreamURL: "https://www.youtube.com/watch?v=WQUBVjbh-hM"
          }
        ],
        FTCCMP1FRAN: [
          {
            day: /* @__PURE__ */ new Date("2026-04-29"),
            liveStreamURL: "https://www.youtube.com/watch?v=76X4pB5eljY"
          },
          {
            day: /* @__PURE__ */ new Date("2026-04-30"),
            liveStreamURL: "https://www.youtube.com/watch?v=MeaiooVeA70"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-01"),
            liveStreamURL: "https://www.youtube.com/watch?v=U3-l-scDglY"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-02"),
            liveStreamURL: "https://www.youtube.com/watch?v=iCMhB5nhEZU"
          }
        ],
        FTCCMP1GOOD: [
          {
            day: /* @__PURE__ */ new Date("2026-04-29"),
            liveStreamURL: "https://www.youtube.com/watch?v=ws7CKWmZ2J4"
          },
          {
            day: /* @__PURE__ */ new Date("2026-04-30"),
            liveStreamURL: "https://www.youtube.com/watch?v=ZEzRZXUkgEI"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-01"),
            liveStreamURL: "https://www.youtube.com/watch?v=nNWYRvkSHvw"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-02"),
            liveStreamURL: "https://www.youtube.com/watch?v=H920hSVJw7E"
          }
        ],
        FTCCMP1JACK: [
          {
            day: /* @__PURE__ */ new Date("2026-04-29"),
            liveStreamURL: "https://www.youtube.com/watch?v=njxbmoGyvQE"
          },
          {
            day: /* @__PURE__ */ new Date("2026-04-30"),
            liveStreamURL: "https://www.youtube.com/watch?v=Yd5q_PokJ0Y"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-01"),
            liveStreamURL: "https://www.youtube.com/watch?v=C5hddvlYfKQ"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-02"),
            liveStreamURL: "https://www.youtube.com/watch?v=56Elss5raPo"
          }
        ],
        FTCCMP1LOVE: [
          {
            day: /* @__PURE__ */ new Date("2026-04-29"),
            liveStreamURL: "https://www.youtube.com/watch?v=lalSiHiXbxc"
          },
          {
            day: /* @__PURE__ */ new Date("2026-04-30"),
            liveStreamURL: "https://www.youtube.com/watch?v=KbMURIWFcMg"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-01"),
            liveStreamURL: "https://www.youtube.com/watch?v=imScd0Dv9IA"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-02"),
            liveStreamURL: "https://www.youtube.com/watch?v=lZNmEpiOSx8"
          }
        ],
        FTCCMP1ROSS: [
          {
            day: /* @__PURE__ */ new Date("2026-04-29"),
            liveStreamURL: "https://www.youtube.com/watch?v=WoGngaj3ABk"
          },
          {
            day: /* @__PURE__ */ new Date("2026-04-30"),
            liveStreamURL: "https://www.youtube.com/watch?v=oTLneTQGnsM"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-01"),
            liveStreamURL: "https://www.youtube.com/watch?v=ps5rsAdW4-Q"
          },
          {
            day: /* @__PURE__ */ new Date("2026-05-02"),
            liveStreamURL: "https://www.youtube.com/watch?v=oG0JzHFcf5A"
          }
        ]
      }
    };
    return Event.create({
      season,
      code: api.code,
      divisionCode: api.divisionCode ? api.divisionCode : null,
      name: fixLocations(EDIT_EVENT_BY_CODE[api.code] ?? api.name).trim(),
      remote: api.remote,
      hybrid: api.hybrid,
      fieldCount: api.fieldCount,
      published: api.published,
      type,
      regionCode: api.regionCode ? MODIFIED_REGION_CODES[api.regionCode] ?? api.regionCode : null,
      leagueCode: api.leagueCode,
      districtCode: api.districtCode ? api.districtCode : null,
      venue: api.venue?.trim() ?? null,
      address: api.address?.trim() ?? null,
      country: fixLocations(api.country),
      state: fixLocations(api.stateprov),
      city: fixLocations(api.city),
      website: api.website ? api.website.trim() : null,
      liveStreamURL: api.liveStreamUrl && api.liveStreamUrl.startsWith("https://") ? api.liveStreamUrl.trim() : null,
      livestreamsByDay: EVENT_LIVESTREAM_OVERRIDES[season]?.[api.code] ?? null,
      webcasts: api.webcasts ? api.webcasts : [],
      timezone: api.timezone === "Asia/Calcutta" ? "Asia/Kolkata" : api.timezone ?? "UTC",
      start: new Date(api.dateStart),
      end: new Date(api.dateEnd),
      modifiedRules: MODIFIED_RULES.indexOf(api.code) != -1
    });
  }
};
__decorateClass([
  PrimaryColumn("smallint")
], Event.prototype, "season", 2);
__decorateClass([
  PrimaryColumn()
], Event.prototype, "code", 2);
__decorateClass([
  OneToMany(() => Match, (match) => match.event)
], Event.prototype, "matches", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "divisionCode", 2);
__decorateClass([
  Column()
], Event.prototype, "name", 2);
__decorateClass([
  Column()
], Event.prototype, "remote", 2);
__decorateClass([
  Column()
], Event.prototype, "hybrid", 2);
__decorateClass([
  Column()
], Event.prototype, "fieldCount", 2);
__decorateClass([
  Column()
], Event.prototype, "published", 2);
__decorateClass([
  Column("enum", { enum: EventType, enumName: "event_type_enum" })
], Event.prototype, "type", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "regionCode", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "leagueCode", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "districtCode", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "venue", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "address", 2);
__decorateClass([
  Column()
], Event.prototype, "country", 2);
__decorateClass([
  Column()
], Event.prototype, "state", 2);
__decorateClass([
  Column()
], Event.prototype, "city", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "website", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Event.prototype, "liveStreamURL", 2);
__decorateClass([
  Column("json", { nullable: true })
], Event.prototype, "livestreamsByDay", 2);
__decorateClass([
  Column("json")
], Event.prototype, "webcasts", 2);
__decorateClass([
  Column({ type: "varchar" })
], Event.prototype, "timezone", 2);
__decorateClass([
  Column("date")
], Event.prototype, "start", 2);
__decorateClass([
  Column("date")
], Event.prototype, "end", 2);
__decorateClass([
  Column()
], Event.prototype, "modifiedRules", 2);
__decorateClass([
  CreateDateColumn({ type: "timestamptz" })
], Event.prototype, "createdAt", 2);
__decorateClass([
  UpdateDateColumn({ type: "timestamptz" })
], Event.prototype, "updatedAt", 2);
Event = __decorateClass([
  Entity()
], Event);
const Event$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get Event() {
    return Event;
  }
}, Symbol.toStringTag, { value: "Module" }));
export {
  AllianceGQL as A,
  Event as E,
  FilterOpGQL as F,
  Match as M,
  RegionOptionGQL as R,
  StationGQL as S,
  TournamentLevelGQL as T,
  AllianceRoleGQL as a,
  EventTypeGQL as b,
  EventTypeOptionGQL as c,
  RegionOption as d,
  AwardTypeGQL as e,
  frontendMSFromDB as f,
  getRegionCodes as g,
  Award as h,
  FilterGroupTyGQL as i,
  FilterGroupTy as j,
  SortDirGQL as k,
  RemoteOptionGQL as l,
  makeMatchScoreTys as m,
  Event$1 as n
};
