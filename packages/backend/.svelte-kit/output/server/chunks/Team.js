import { PrimaryColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, Entity, BaseEntity, OneToMany } from "typeorm";
import { A as Alliance, o as Station, p as AllianceRole, s as allianceFromApiStation, t as allianceRoleFromApiStation, n as notEmpty } from "./types.js";
import "async-mutex";
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
let TeamMatchParticipation = class extends BaseEntity {
  static fromApi(teams, match, remote) {
    const cmp = (a, b) => a.station.localeCompare(b.station);
    function getOnField(teams2, color) {
      let onFieldCount = teams2.filter((t) => t.onField && t.station.includes(color)).length;
      return teams2.filter((t) => {
        if (!t.station.includes(color))
          return false;
        if (match.eventSeason == 2019)
          return true;
        if (onFieldCount <= 1)
          return true;
        if (!t.dq && !(t.onField ?? true))
          return false;
        return true;
      }).sort(cmp);
    }
    let redTeams = getOnField(teams, "Red");
    let blueTeams = getOnField(teams, "Blue");
    function getStation(team) {
      if (remote) {
        return Station.Solo;
      } else if (team.teamNumber == redTeams?.[0]?.teamNumber || team.teamNumber == blueTeams?.[0]?.teamNumber) {
        return Station.One;
      } else if (team.teamNumber == redTeams?.[1]?.teamNumber || team.teamNumber == blueTeams?.[1]?.teamNumber) {
        return Station.Two;
      } else {
        return Station.NotOnField;
      }
    }
    return teams.map((t) => {
      if (t.teamNumber == null)
        return null;
      return TeamMatchParticipation.create({
        season: match.eventSeason,
        eventCode: match.eventCode,
        matchId: match.id,
        alliance: allianceFromApiStation(t.station),
        station: getStation(t),
        teamNumber: t.teamNumber,
        allianceRole: allianceRoleFromApiStation(t.station),
        surrogate: t.surrogate,
        noShow: t.noShow,
        dq: match.eventSeason == 2019 ? false : t.dq ?? false,
        // For 2019 the api always returns false for dq
        onField: match.eventSeason == 2019 ? true : t.onField ?? true
        // And doesn't return the teams that weren't on the field.
      });
    }).filter(notEmpty);
  }
};
__decorateClass$1([
  PrimaryColumn("smallint")
], TeamMatchParticipation.prototype, "season", 2);
__decorateClass$1([
  PrimaryColumn()
], TeamMatchParticipation.prototype, "eventCode", 2);
__decorateClass$1([
  PrimaryColumn("int")
], TeamMatchParticipation.prototype, "matchId", 2);
__decorateClass$1([
  PrimaryColumn("enum", { enum: Alliance, enumName: "alliance_enum" })
], TeamMatchParticipation.prototype, "alliance", 2);
__decorateClass$1([
  PrimaryColumn("enum", { enum: Station, enumName: "station_enum" })
], TeamMatchParticipation.prototype, "station", 2);
__decorateClass$1([
  ManyToOne(() => Team, (team) => team.matches)
], TeamMatchParticipation.prototype, "team", 2);
__decorateClass$1([
  Column("int")
], TeamMatchParticipation.prototype, "teamNumber", 2);
__decorateClass$1([
  Column("enum", { enum: AllianceRole, enumName: "alliance_role_enum" })
], TeamMatchParticipation.prototype, "allianceRole", 2);
__decorateClass$1([
  Column("bool")
], TeamMatchParticipation.prototype, "surrogate", 2);
__decorateClass$1([
  Column("bool")
], TeamMatchParticipation.prototype, "noShow", 2);
__decorateClass$1([
  Column("bool")
], TeamMatchParticipation.prototype, "dq", 2);
__decorateClass$1([
  Column("bool")
], TeamMatchParticipation.prototype, "onField", 2);
__decorateClass$1([
  CreateDateColumn({ type: "timestamptz" })
], TeamMatchParticipation.prototype, "createdAt", 2);
__decorateClass$1([
  UpdateDateColumn({ type: "timestamptz" })
], TeamMatchParticipation.prototype, "updatedAt", 2);
TeamMatchParticipation = __decorateClass$1([
  Entity()
], TeamMatchParticipation);
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
let Team = class extends BaseEntity {
  static fromApi(api) {
    if (api.nameShort == null || api.rookieYear == null) {
      console.warn(`Rejecting api team ${api.teamNumber}.`);
      return null;
    }
    function fixLocations(event_name) {
      const replacements = [["Chinese Taipei", "Taiwan"]];
      for (const [old_str, new_str] of replacements) {
        if (event_name.includes(old_str)) {
          return event_name.replace(old_str, new_str);
        }
      }
      return event_name;
    }
    let name = api.nameShort.trim();
    let schoolName;
    let sponsors;
    if (api.nameFull == null) {
      schoolName = "Unknown";
      sponsors = [];
    } else if (api.nameFull.includes("&")) {
      let index = api.nameFull.lastIndexOf("&");
      let teamNamePart = api.nameFull.slice(index + 1);
      let sponsorsPart = api.nameFull.slice(0, index);
      schoolName = teamNamePart.trim();
      sponsors = sponsorsPart.split("/").map((s) => s.trim()).filter((s) => !!s);
    } else {
      schoolName = api.nameFull?.trim() ?? null;
      sponsors = [];
    }
    return Team.create({
      number: api.teamNumber,
      name,
      schoolName,
      sponsors,
      country: fixLocations(api.country ?? ""),
      state: fixLocations(api.stateProv ?? ""),
      city: fixLocations(api.city ?? ""),
      rookieYear: api.rookieYear,
      website: api.website
    });
  }
};
__decorateClass([
  PrimaryColumn("int")
], Team.prototype, "number", 2);
__decorateClass([
  OneToMany(() => TeamMatchParticipation, (tmp) => tmp.team)
], Team.prototype, "matches", 2);
__decorateClass([
  Column()
], Team.prototype, "name", 2);
__decorateClass([
  Column()
], Team.prototype, "schoolName", 2);
__decorateClass([
  Column("json")
], Team.prototype, "sponsors", 2);
__decorateClass([
  Column()
], Team.prototype, "country", 2);
__decorateClass([
  Column()
], Team.prototype, "state", 2);
__decorateClass([
  Column()
], Team.prototype, "city", 2);
__decorateClass([
  Column()
], Team.prototype, "rookieYear", 2);
__decorateClass([
  Column({ type: "varchar", nullable: true })
], Team.prototype, "website", 2);
__decorateClass([
  CreateDateColumn({ type: "timestamptz" })
], Team.prototype, "createdAt", 2);
__decorateClass([
  UpdateDateColumn({ type: "timestamptz" })
], Team.prototype, "updatedAt", 2);
Team = __decorateClass([
  Entity()
], Team);
const Team$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get Team() {
    return Team;
  }
}, Symbol.toStringTag, { value: "Module" }));
export {
  Team as T,
  TeamMatchParticipation as a,
  Team$1 as b
};
