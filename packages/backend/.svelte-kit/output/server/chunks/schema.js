import { GraphQLObjectType, GraphQLUnionType, GraphQLInt, GraphQLInputObjectType, GraphQLSchema } from "graphql";
import DataLoader from "dataloader";
import { Brackets, In, LessThan } from "typeorm";
import { n as notEmpty, D as DESCRIPTORS, F as FloatTy, I as IntTy, a as nn, b as DESCRIPTORS_LIST, S as StrTy, B as BoolTy, c as nullTy, d as DateTimeTy, l as list, e as listTy, f as DateTy, w as wr, E as EventTypeOption, g as getEventTypes, h as groupBy, i as getTepStatSet, R as RemoteOption, j as SortDir, k as getMatchStatSet } from "./types.js";
import { m as makeMatchScoreTys, T as TournamentLevelGQL, f as frontendMSFromDB, M as Match, E as Event, A as AllianceGQL, S as StationGQL, a as AllianceRoleGQL, b as EventTypeGQL, R as RegionOptionGQL, c as EventTypeOptionGQL, d as RegionOption, g as getRegionCodes, e as AwardTypeGQL, h as Award, F as FilterOpGQL, i as FilterGroupTyGQL, j as FilterGroupTy, k as SortDirGQL, l as RemoteOptionGQL } from "./Event.js";
import { C as CURRENT_SEASON, A as ALL_SEASONS, S as Season } from "./Season.js";
import "async-mutex";
import { T as Team, a as TeamMatchParticipation } from "./Team.js";
import { D as DATA_SOURCE, T as TeamEventParticipation, M as MatchScore, B as BestName } from "./data-source.js";
import graphqlFields from "graphql-fields";
import { DateTime } from "luxon";
import { PubSub } from "graphql-subscriptions";
function isSepChar(c) {
  return c == " " || c == "-" || c == "." || c == "_" || c == void 0;
}
const notAllowedCost = Infinity;
const baseDeleteCost = 5e3;
const baseMoveCost = 1e3;
const nominalCost = 10;
const haystackLenCost = 1e-3;
function calcShortestDistance(haystack, needle, scoreCutoff = Infinity, distMatrix = [], pathMatrix = []) {
  if (needle == "")
    return 0;
  if (haystack == "")
    return needle.length * baseDeleteCost;
  let hLen = haystack.length;
  let rowLen = hLen + 1;
  let nLen = needle.length;
  for (let hi = 0; hi <= hLen; hi++)
    distMatrix[hi + nLen * rowLen] = 0;
  for (let ni = 0; ni <= nLen; ni++)
    distMatrix[hLen + ni * rowLen] = (nLen - ni) * baseDeleteCost;
  for (let ni = nLen - 1; ni >= 0; ni--) {
    let nc = needle[ni];
    let ncSep = isSepChar(nc);
    let deleteCost = isSepChar(nc) ? nominalCost : baseDeleteCost;
    let moveCost = ni == 0 ? 0 : baseMoveCost;
    let previousIsSep = true;
    let wordStartIdx = hLen;
    let bestScore = Infinity;
    for (let hi = hLen - 1; hi >= 0; hi--) {
      let hc = haystack[hi];
      let hcSep = isSepChar(hc);
      let sameChar = nc == hc;
      let bothSep = hcSep && ncSep;
      let canPrefix = wordStartIdx != hLen && sameChar && !ncSep;
      for (let d = 1; canPrefix; d++) {
        let pnc = needle[ni - d];
        let phc = haystack[hi - d];
        if (isSepChar(phc))
          break;
        canPrefix &&= pnc == phc;
      }
      let deleteOpt = distMatrix[hi + (ni + 1) * rowLen] + deleteCost;
      let useOpt = sameChar || bothSep ? distMatrix[hi + 1 + (ni + 1) * rowLen] : notAllowedCost;
      let skipCharOpt = distMatrix[hi + 1 + ni * rowLen] + moveCost;
      let skipWordOpt = ncSep || hcSep ? distMatrix[wordStartIdx + ni * rowLen] + nominalCost : notAllowedCost;
      let prefixOpt = canPrefix ? distMatrix[wordStartIdx + 1 + (ni + 1) * rowLen] + nominalCost : notAllowedCost;
      let thisIdx = hi + ni * rowLen;
      let min = Math.min(deleteOpt, useOpt, skipCharOpt, skipWordOpt, prefixOpt);
      distMatrix[thisIdx] = min;
      bestScore = Math.min(bestScore, min);
      switch (min) {
        case deleteOpt:
          pathMatrix[thisIdx] = hi + (ni + 1) * rowLen;
          break;
        case useOpt:
          pathMatrix[thisIdx] = hi + 1 + (ni + 1) * rowLen;
          break;
        case skipCharOpt:
          pathMatrix[thisIdx] = hi + 1 + ni * rowLen;
          break;
        case skipWordOpt:
          pathMatrix[thisIdx] = wordStartIdx + ni * rowLen;
          break;
        case prefixOpt:
          pathMatrix[thisIdx] = wordStartIdx + 1 + (ni + 1) * rowLen;
          break;
      }
      if (!previousIsSep && hcSep)
        wordStartIdx = hi;
      previousIsSep = hcSep;
    }
    if (bestScore > scoreCutoff) {
      return scoreCutoff + 1;
    }
  }
  return distMatrix[0] + haystack.length * haystackLenCost;
}
function calcHighlights(pathMatrix, hLen, nLen) {
  if (isNaN(hLen) || isNaN(nLen))
    return [];
  let rowLen = hLen + 1;
  let hi = 0;
  let ni = 0;
  let positions = [];
  while (hi != hLen && ni != nLen) {
    let next = pathMatrix[hi + ni * rowLen];
    let nHi = next % rowLen;
    let nNi = Math.floor(next / rowLen);
    if (nHi >= hi + 1 && nNi == ni + 1)
      positions.push(hi);
    hi = nHi;
    ni = nNi;
  }
  return positions;
}
function getFuzzyDistance(haystack, needle, scoreCutoff = Infinity, distMatrix = [], pathMatrix = []) {
  haystack = haystack.toLowerCase().trim();
  needle = needle.toLowerCase().trim();
  pathMatrix ??= [];
  let distance = calcShortestDistance(haystack, needle, scoreCutoff, distMatrix, pathMatrix);
  let highlights = distance > scoreCutoff ? [] : calcHighlights(pathMatrix, haystack.length, needle.length);
  return { document: haystack, distance, highlights };
}
function insert(results, newR) {
  let low = 0;
  let high = results.length;
  while (low < high) {
    let mid = Math.floor((low + high) / 2);
    if (newR.distance > results[mid].distance) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  results.splice(low, 0, newR);
}
function calcCutoff(dist, needleLen = 10, needleSepChars = 2) {
  return Math.min(
    dist * 2 + (needleSepChars + 1) * nominalCost + haystackLenCost * 10,
    baseDeleteCost * Math.max(Math.min(5, Math.ceil(needleLen / 2)), needleLen / 4)
  );
}
function fuzzySearch(documents, needle, maxResults, key, sort = false) {
  needle = needle.slice(0, 50);
  if (needle == "") {
    return documents.slice(0, maxResults).map((document) => ({ document, distance: 0, highlights: [] }));
  }
  let distMatrix = [];
  let pathMatrix = [];
  maxResults ??= Infinity;
  let needleSepChars = needle.split("").filter(isSepChar).length;
  let scoreCutoff = Infinity;
  let sortedResults = [];
  for (let i = 0; i < documents.length; i++) {
    let haystack = key ? documents[i][key] : documents[i];
    let res = getFuzzyDistance(haystack + "", needle, scoreCutoff, distMatrix, pathMatrix);
    let dist = res.distance;
    let newCutoff = calcCutoff(dist, needle.length, needleSepChars);
    if (newCutoff < scoreCutoff) {
      scoreCutoff = newCutoff;
      sortedResults = sortedResults.filter((r) => r.distance <= scoreCutoff);
    }
    let lastDist = sortedResults[sortedResults.length - 1]?.distance ?? Infinity;
    if (dist > scoreCutoff)
      continue;
    if (dist > lastDist && sortedResults.length >= maxResults)
      continue;
    let documentRes = { ...res, document: documents[i] };
    if (sort) {
      insert(sortedResults, documentRes);
    } else {
      sortedResults.push(documentRes);
    }
  }
  return sortedResults;
}
function dataLoaderResolver(argsToKey, keysToResults, groupResults) {
  let dl = new DataLoader(
    async (kAndI) => {
      let keys = kAndI.map((k) => k[0]);
      let info = kAndI.map((k) => k[1]);
      let results = await keysToResults(keys, info);
      let groups = groupResults(keys, results);
      return groups;
    },
    { cache: false }
  );
  return async (source, args, _ctx, info) => {
    let key = argsToKey(source, args);
    let res = await dl.load([key, info]);
    return res;
  };
}
function matchByKeys(k, r) {
  if (k == null || typeof k != "object" || typeof r != "object")
    throw "Can only use matchByKey with objects";
  for (let key of Object.keys(k)) {
    if (k[key] != r[key])
      return false;
  }
  return true;
}
function dataLoaderResolverSingle(argsToKey, keysToResults, keyMatchesResult = matchByKeys) {
  return dataLoaderResolver(
    argsToKey,
    keysToResults,
    (keys, results) => keys.map((k) => results.find((r) => keyMatchesResult(k, r)) ?? null)
  );
}
function dataLoaderResolverList(argsToKey, keysToResults, keyMatchesResult = matchByKeys) {
  return dataLoaderResolver(
    argsToKey,
    keysToResults,
    (keys, results) => keys.map((k) => results.filter((r) => keyMatchesResult(k, r)))
  );
}
function keyListToWhereClause(tableName, keys) {
  let vIdx = 0;
  return new Brackets((qb) => {
    for (let key of keys) {
      let thisKey = new Brackets((subQb) => {
        for (let [k, v] of Object.entries(key)) {
          subQb.andWhere(`${tableName}.${k} = :v${vIdx}`, { [`v${vIdx}`]: v });
          vIdx += 1;
        }
      });
      qb.orWhere(thisKey);
    }
  });
}
function makeTepTypes(descriptor) {
  let l = [make(descriptor, false), descriptor.hasRemote ? make(descriptor, true) : null];
  return l.filter(notEmpty);
}
function addTypename(tep) {
  let suffix = DESCRIPTORS[tep.season].typeSuffix(tep.isRemote);
  let __typename = `TeamEventStats${tep.season}${suffix}`;
  return { ...tep, __typename };
}
function make(descriptor, remote) {
  let nameSuffix = descriptor.typeSuffix(remote);
  let innerFields = {};
  for (let c of descriptor.tepColumns()) {
    if (c.tradOnly && remote)
      continue;
    innerFields[c.apiName] = FloatTy;
  }
  let inner = new GraphQLObjectType({
    name: `TeamEventStats${descriptor.season}${nameSuffix}Group`,
    fields: innerFields
  });
  let hasTb2 = descriptor.rankings.tb != "LosingScore";
  let outer = new GraphQLObjectType({
    name: `TeamEventStats${descriptor.season}${nameSuffix}`,
    fields: {
      rank: IntTy,
      rp: FloatTy,
      tb1: FloatTy,
      ...hasTb2 ? { tb2: FloatTy } : {},
      ...!remote ? { wins: IntTy, losses: IntTy, ties: IntTy, dqs: IntTy } : {},
      qualMatchesPlayed: IntTy,
      tot: { type: nn(inner) },
      avg: { type: nn(inner) },
      min: { type: nn(inner) },
      max: { type: nn(inner) },
      dev: { type: nn(inner) },
      opr: { type: nn(inner) }
    }
  });
  return outer;
}
const MatchScoresUnionGQL = new GraphQLUnionType({
  name: "MatchScores",
  types: DESCRIPTORS_LIST.flatMap(makeMatchScoreTys)
});
const TepStatsUnionGQL = new GraphQLUnionType({
  name: "TeamEventStats",
  types: DESCRIPTORS_LIST.flatMap(makeTepTypes)
});
const MatchGQL = new GraphQLObjectType({
  name: "Match",
  fields: () => ({
    season: {
      ...IntTy,
      resolve: (m) => m.eventSeason
    },
    eventCode: StrTy,
    id: IntTy,
    hasBeenPlayed: BoolTy,
    scheduledStartTime: nullTy(DateTimeTy),
    actualStartTime: nullTy(DateTimeTy),
    postResultTime: nullTy(DateTimeTy),
    tournamentLevel: { type: nn(TournamentLevelGQL) },
    series: IntTy,
    matchNum: IntTy,
    description: StrTy,
    createdAt: DateTimeTy,
    updatedAt: DateTimeTy,
    // Must use aware loader
    scores: {
      type: MatchScoresUnionGQL,
      resolve: (m) => frontendMSFromDB(m.scores)
    },
    teams: { type: list(nn(TeamMatchParticipationGQL)) },
    event: {
      type: nn(EventGQL),
      resolve: dataLoaderResolverSingle(
        (m) => ({ season: m.eventSeason, code: m.eventCode }),
        (keys) => Event.find({ where: keys })
      )
    }
  })
});
function singleSeasonScoreAwareMatchLoader(keys, info, includeScores = false, includeTeams = false) {
  includeScores ||= info.some((i) => "scores" in graphqlFields(i));
  includeTeams ||= info.some((i) => "teams" in graphqlFields(i));
  let season = keys[0].eventSeason;
  let q = DATA_SOURCE.getRepository(Match).createQueryBuilder("m").where(keyListToWhereClause("m", keys));
  if (includeScores) {
    q.leftJoinAndMapMany(
      "m.scores",
      `match_score_${season}`,
      "ms",
      "m.event_season = ms.season AND m.event_code = ms.event_code AND m.id = ms.match_id"
    );
  }
  if (includeTeams) {
    q.leftJoinAndMapMany(
      "m.teams",
      "team_match_participation",
      "tmp",
      "m.event_season = tmp.season AND m.event_code = tmp.event_code AND m.id = tmp.match_id"
    );
  }
  return q.getMany();
}
const TeamMatchParticipationGQL = new GraphQLObjectType({
  name: "TeamMatchParticipation",
  fields: () => ({
    season: IntTy,
    eventCode: StrTy,
    matchId: IntTy,
    alliance: { type: nn(AllianceGQL) },
    station: { type: nn(StationGQL) },
    teamNumber: IntTy,
    allianceRole: { type: nn(AllianceRoleGQL) },
    surrogate: BoolTy,
    noShow: BoolTy,
    dq: BoolTy,
    onField: BoolTy,
    createdAt: DateTimeTy,
    updatedAt: DateTimeTy,
    team: {
      type: nn(TeamGQL),
      resolve: dataLoaderResolverSingle(
        (tmp) => tmp.teamNumber,
        (keys) => Team.find({ where: { number: In(keys) } }),
        (k, r) => k == r.number
      )
    },
    match: {
      type: nn(MatchGQL),
      resolve: dataLoaderResolverSingle(
        (tmp) => ({ eventSeason: tmp.season, eventCode: tmp.eventCode, id: tmp.matchId }),
        singleSeasonScoreAwareMatchLoader
      )
    },
    event: {
      type: nn(EventGQL),
      resolve: dataLoaderResolverSingle(
        (tmp) => ({ season: tmp.season, code: tmp.eventCode }),
        (keys) => Event.find({ where: keys })
      )
    }
  })
});
const TeamEventParticipationGQL = new GraphQLObjectType({
  name: "TeamEventParticipation",
  fields: () => ({
    season: IntTy,
    eventCode: StrTy,
    teamNumber: IntTy,
    stats: {
      type: TepStatsUnionGQL,
      resolve: (tep) => tep.hasStats ? addTypename(tep) : null
    },
    event: {
      type: nn(EventGQL),
      resolve: dataLoaderResolverSingle(
        (tep) => ({ season: tep.season, code: tep.eventCode }),
        async (keys) => Event.find({ where: keys })
      )
    },
    team: {
      type: nn(TeamGQL),
      resolve: dataLoaderResolverSingle(
        (tep) => tep.teamNumber,
        (keys) => Team.find({ where: { number: In(keys) } }),
        (k, t) => k == t.number
      )
    },
    awards: {
      type: list(nn(AwardGQL)),
      resolve: dataLoaderResolverList(
        (tep) => ({
          season: tep.season,
          eventCode: tep.eventCode,
          teamNumber: tep.teamNumber
        }),
        teamAwareAwardLoader
      )
    },
    matches: {
      type: list(nn(TeamMatchParticipationGQL)),
      resolve: dataLoaderResolverList(
        (tep) => ({
          season: tep.season,
          eventCode: tep.eventCode,
          teamNumber: tep.teamNumber
        }),
        (keys) => TeamMatchParticipation.find({ where: keys })
      )
    }
  })
});
const LocationGQL = new GraphQLObjectType({
  name: "Location",
  fields: {
    venue: nullTy(StrTy),
    city: StrTy,
    state: StrTy,
    country: StrTy
  }
});
const pubsub = new PubSub();
function newMatchesKey(season, code) {
  return `NEW_MATCHES-${season}-${code}`;
}
const EventGQL = new GraphQLObjectType({
  name: "Event",
  fields: () => ({
    season: IntTy,
    code: StrTy,
    divisionCode: nullTy(StrTy),
    name: StrTy,
    remote: BoolTy,
    hybrid: BoolTy,
    fieldCount: IntTy,
    published: BoolTy,
    type: { type: nn(EventTypeGQL) },
    regionCode: nullTy(StrTy),
    leagueCode: nullTy(StrTy),
    districtCode: nullTy(StrTy),
    address: nullTy(StrTy),
    location: {
      type: nn(LocationGQL),
      resolve: (e) => !!e ? { venue: e.venue, city: e.city, state: e.state, country: e.country } : null
    },
    website: nullTy(StrTy),
    liveStreamURL: nullTy(StrTy),
    livestreamsByDay: {
      type: list(nn(EventLivestreamDayGQL)),
      resolve: (e) => {
        if (e.livestreamsByDay && Array.isArray(e.livestreamsByDay) && e.livestreamsByDay.length > 0) {
          return e.livestreamsByDay.map((ls) => ({
            day: DateTime.fromISO(ls.day).toJSDate(),
            liveStreamURL: ls.liveStreamURL,
            webcasts: ls.webcasts ?? []
          }));
        }
        if (e.liveStreamURL) {
          for (let day of [e.start, e.end]) {
            if (day) {
              return [
                {
                  day,
                  liveStreamURL: e.liveStreamURL,
                  webcasts: e.webcasts,
                  label: null
                }
              ];
            }
          }
        }
        return [];
      }
    },
    webcasts: listTy(StrTy),
    timezone: StrTy,
    start: DateTy,
    end: DateTy,
    createdAt: DateTimeTy,
    updatedAt: DateTimeTy,
    started: {
      ...BoolTy,
      resolve: (e) => DateTime.fromISO(e.start, { zone: e.timezone }) < DateTime.now()
    },
    ongoing: {
      ...BoolTy,
      resolve: (e) => DateTime.fromISO(e.start, { zone: e.timezone }) < DateTime.now() && DateTime.now() < DateTime.fromISO(e.end, { zone: e.timezone }).endOf("day")
    },
    finished: {
      ...BoolTy,
      resolve: (e) => DateTime.fromISO(e.end, { zone: e.timezone }).endOf("day") < DateTime.now()
    },
    relatedEvents: {
      type: list(nn(EventGQL)),
      resolve: (e) => DATA_SOURCE.getRepository(Event).createQueryBuilder("e").where("e.season = :season", { season: e.season }).andWhere("e.code <> :code", { code: e.code }).andWhere(
        new Brackets((qb) => {
          if (e.divisionCode) {
            qb.orWhere("e.code = :divCode", {
              divCode: e.divisionCode
            }).orWhere("e.divisionCode = :divCode");
          }
          qb.orWhere("e.divisionCode = :code");
        })
      ).getMany()
    },
    awards: {
      type: list(nn(AwardGQL)),
      resolve: dataLoaderResolverList(
        (event) => ({ season: event.season, eventCode: event.code }),
        teamAwareAwardLoader
      )
    },
    teams: {
      type: list(nn(TeamEventParticipationGQL)),
      resolve: dataLoaderResolverList(
        (event) => ({ season: event.season, eventCode: event.code }),
        async (keys) => {
          let groups = groupBy(keys, (k) => k.season);
          let qs = Object.entries(groups).map(
            ([season, k]) => TeamEventParticipation[+season].find({ where: k })
          );
          return (await Promise.all(qs)).flat();
        }
      )
    },
    teamMatches: {
      type: list(nn(TeamMatchParticipationGQL)),
      args: { teamNumber: nullTy(IntTy) },
      resolve: dataLoaderResolverList(
        (e, { teamNumber }) => teamNumber != null ? { season: e.season, eventCode: e.code, teamNumber } : { season: e.season, eventCode: e.code },
        (keys) => TeamMatchParticipation.find({ where: keys })
      )
    },
    hasMatches: {
      ...BoolTy,
      resolve: async (e) => "hasMatches" in e ? e.hasMatches : (await DATA_SOURCE.getRepository(Event).createQueryBuilder("e").distinctOn(["code"]).addSelect("coalesce(m.has_been_played, false)", "has_matches").leftJoin(
        Match,
        "m",
        "e.season = m.event_season AND e.code = m.event_code"
      ).where("season = :season", { season: e.season }).andWhere("code = :code", { code: e.code }).getRawOne()).has_matches
    },
    matches: {
      type: list(nn(MatchGQL)),
      resolve: dataLoaderResolverList(
        (e, { id }) => id != null ? { eventSeason: e.season, eventCode: e.code, id } : { eventSeason: e.season, eventCode: e.code },
        singleSeasonScoreAwareMatchLoader
      )
    },
    previewStats: {
      ...nullTy(wr(list(nn(EventPreviewStatGQL)))),
      resolve: async (event) => {
        if (event.published) {
          return null;
        }
        let roster = await TeamEventParticipation[event.season].find({
          where: { season: event.season, eventCode: event.code },
          select: ["teamNumber"]
        });
        let teamNumbers = roster.map((r) => r.teamNumber);
        if (!teamNumbers.length)
          return [];
        let descriptor = DESCRIPTORS[event.season];
        let getQuickOpr = (t) => {
          let val = descriptor.pensSubtract ? t.opr?.totalPoints ?? null : t.opr?.totalPointsNp ?? t.opr?.totalPoints ?? null;
          return val == null ? null : +val;
        };
        let candidateStats = await TeamEventParticipation[event.season].createQueryBuilder("t").innerJoin(Event, "e", "e.season = t.season AND e.code = t.eventCode").where("t.teamNumber IN (:...teamNumbers)", { teamNumbers }).andWhere("NOT t.isRemote").andWhere("t.hasStats").andWhere("NOT e.modified_rules").getMany();
        let bestStats = /* @__PURE__ */ new Map();
        for (let row of candidateStats) {
          let quick = getQuickOpr(row);
          let eventCode = row.eventCode;
          let existing = bestStats.get(row.teamNumber);
          if (!existing) {
            bestStats.set(row.teamNumber, { row, quick, eventCode });
            continue;
          }
          let existingValue = existing.quick ?? Number.NEGATIVE_INFINITY;
          let currentValue = quick ?? Number.NEGATIVE_INFINITY;
          if (currentValue > existingValue) {
            bestStats.set(row.teamNumber, { row, quick, eventCode });
          }
        }
        let eventCodes = new Set(candidateStats.map((r) => r.eventCode));
        let events = await Event.findBy({
          season: event.season,
          code: In([...eventCodes])
        });
        let eventMap = new Map(events.map((e) => [e.code, e]));
        return teamNumbers.map((teamNumber) => {
          let entry = bestStats.get(teamNumber);
          return {
            teamNumber,
            npOpr: entry?.quick ?? null,
            stats: entry ? addTypename(entry.row) : null,
            event: eventMap.get(entry?.eventCode ?? "") ?? null
          };
        });
      }
    }
  })
});
const EventPreviewStatGQL = new GraphQLObjectType({
  name: "EventPreviewStat",
  fields: {
    teamNumber: IntTy,
    npOpr: nullTy(FloatTy),
    stats: { type: TepStatsUnionGQL },
    event: { type: EventGQL }
  }
});
const EventLivestreamDayGQL = new GraphQLObjectType({
  name: "EventLivestreamDay",
  fields: {
    day: DateTy,
    liveStreamURL: nullTy(StrTy),
    webcasts: listTy(StrTy)
  }
});
const EventQueries = {
  eventByCode: {
    type: EventGQL,
    args: { season: IntTy, code: StrTy },
    resolve: dataLoaderResolverSingle(
      (_, a) => a,
      (keys) => Event.find({ where: keys })
    )
  },
  eventsSearch: {
    type: list(nn(EventGQL)),
    args: {
      season: IntTy,
      region: { type: RegionOptionGQL },
      type: { type: EventTypeOptionGQL },
      hasMatches: nullTy(BoolTy),
      start: nullTy(DateTy),
      end: nullTy(DateTy),
      limit: nullTy(IntTy),
      searchText: nullTy(StrTy)
    },
    resolve: async (_, {
      season,
      region,
      type,
      hasMatches,
      start,
      end,
      limit,
      searchText
    }) => {
      let q = DATA_SOURCE.getRepository(Event).createQueryBuilder("e").distinctOn(["code"]).addSelect("coalesce(m.has_been_played, false)", "has_matches").where("season = :season", { season });
      if (region && region != RegionOption.All) {
        q.andWhere("region_code IN (:...regions)", { regions: getRegionCodes(region) });
      }
      if (type && type != EventTypeOption.All) {
        q.andWhere("type IN (:...types)", { types: getEventTypes(type) });
      }
      if (start) {
        q.andWhere('"start" >= :start', { start: start.toISOString().split("T")[0] });
      }
      if (end) {
        q.andWhere('"end" <= :end', { end: end.toISOString().split("T")[0] });
      }
      if (limit && (!searchText || searchText.trim() == "")) {
        q.limit(limit);
      }
      let { entities, raw } = await q.leftJoin(Match, "m", "e.season = m.event_season AND e.code = m.event_code").getRawAndEntities();
      for (let i = 0; i < entities.length; i++) {
        entities[i].hasMatches = raw[i].has_matches;
      }
      if (hasMatches != null) {
        entities = entities.filter((e) => e.hasMatches == hasMatches);
      }
      if (searchText && searchText.trim() != "") {
        let res = fuzzySearch(entities, searchText, limit ?? void 0, "name", true);
        entities = res.map((d) => d.document);
      }
      return entities;
    }
  }
};
const EventSubscriptions = {
  newMatches: {
    type: list(nn(MatchGQL)).ofType,
    args: { season: IntTy, code: StrTy },
    subscribe: (_, { season, code }) => pubsub.asyncIterator(newMatchesKey(season, code))
  }
};
const AwardGQL = new GraphQLObjectType({
  name: "Award",
  fields: () => ({
    season: IntTy,
    eventCode: StrTy,
    teamNumber: IntTy,
    divisionName: nullTy(StrTy),
    personName: nullTy(StrTy),
    type: { type: nn(AwardTypeGQL) },
    placement: IntTy,
    createdAt: DateTimeTy,
    updatedAt: DateTimeTy,
    // Must use aware loader
    team: { type: nn(TeamGQL) },
    event: {
      type: nn(EventGQL),
      resolve: dataLoaderResolverSingle(
        (a) => ({ season: a.season, code: a.eventCode }),
        (keys) => Event.find({ where: keys })
      )
    }
  })
});
function teamAwareAwardLoader(keys, info) {
  let includeTeam = info.some((i) => "team" in graphqlFields(i));
  let q = DATA_SOURCE.getRepository(Award).createQueryBuilder("a").where(keyListToWhereClause("a", keys));
  if (includeTeam) {
    q.leftJoinAndMapOne("a.team", "team", "t", "a.team_number = t.number");
  }
  return q.getMany();
}
const QuickStatGQL = new GraphQLObjectType({
  name: "QuickStat",
  fields: {
    value: FloatTy,
    rank: IntTy
  }
});
const QuickStatsGQL = new GraphQLObjectType({
  name: "QuickStats",
  fields: {
    season: IntTy,
    number: IntTy,
    tot: { type: nn(QuickStatGQL) },
    auto: { type: nn(QuickStatGQL) },
    dc: { type: nn(QuickStatGQL) },
    eg: { type: nn(QuickStatGQL) },
    count: IntTy
  }
});
let cachedQSCount = {};
let cacheTime = 1e3 * 60 * 5;
async function getQuickStatCount(season, region) {
  let specialRegion = region && region != RegionOption.All;
  let cached = cachedQSCount[season];
  if (!specialRegion && cached && Date.now() - cached.time < cacheTime) {
    return cached.count;
  }
  let q = DATA_SOURCE.createQueryBuilder(`tep_${season}`, "t").leftJoin("event", "e", "e.season = t.season AND e.code = t.event_code").select("count(distinct team_number)").where("NOT is_remote").andWhere("has_stats").andWhere("NOT e.modified_rules");
  if (region && region != RegionOption.All) {
    q.andWhere("region_code IN (:...regions)", { regions: getRegionCodes(region) });
  }
  let raw = await q.getRawOne();
  let count = +raw.count;
  if (!specialRegion) {
    cachedQSCount[season] = { count, time: Date.now() };
  }
  return count;
}
async function getQuickStats(number, season, region) {
  let total = DESCRIPTORS[season].pensSubtract ? "total_points" : "total_points_np";
  let max = DATA_SOURCE.createQueryBuilder(`tep_${season}`, "t").leftJoin("event", "e", "e.season = t.season AND e.code = t.event_code").select("team_number").addSelect(`max(opr_${total})`, "tot").addSelect("max(opr_auto_points)", "auto").addSelect("max(opr_dc_points)", "dc");
  let egColumn = "opr_eg_points";
  if (season == Season.IntoTheDeep) {
    egColumn = "opr_dc_park_points";
  } else if (season == Season.Decode) {
    egColumn = "opr_dc_base_points";
  }
  max = max.addSelect(`max(${egColumn})`, "eg");
  max = max.where("NOT is_remote").andWhere("has_stats").andWhere("NOT e.modified_rules").groupBy("team_number");
  if (region && region != RegionOption.All) {
    max.andWhere("region_code IN (:...regions)", {
      regions: getRegionCodes(region)
    });
  }
  let ranks = DATA_SOURCE.createQueryBuilder().from("max", "max").select("*").addSelect("rank() over (order by tot DESC)", "tot_rank").addSelect("rank() over (order by auto DESC)", "auto_rank").addSelect("rank() over (order by dc DESC)", "dc_rank").addSelect("rank() over (order by eg DESC)", "eg_rank");
  let res = await DATA_SOURCE.createQueryBuilder().addCommonTableExpression(max, "max").addCommonTableExpression(ranks, "ranks").from("ranks", "ranks").select("*").where("team_number = :number", { number }).getRawOne();
  if (!res)
    return null;
  return {
    season,
    number,
    tot: { value: res.tot, rank: +res.tot_rank },
    auto: { value: res.auto, rank: +res.auto_rank },
    dc: { value: res.dc, rank: +res.dc_rank },
    eg: { value: res.eg, rank: +res.eg_rank },
    count: await getQuickStatCount(season, region)
  };
}
const TeamGQL = new GraphQLObjectType({
  name: "Team",
  fields: () => ({
    number: IntTy,
    name: StrTy,
    schoolName: StrTy,
    sponsors: listTy(StrTy),
    location: {
      type: nn(LocationGQL),
      resolve: (t) => ({ city: t.city, state: t.state, country: t.country })
    },
    rookieYear: IntTy,
    activeSeasons: {
      type: list(GraphQLInt),
      resolve: async (t) => {
        let seasons = await DATA_SOURCE.getRepository(TeamMatchParticipation).createQueryBuilder("tmp").select("DISTINCT season").where("team_number = :number", { number: t.number }).getRawMany();
        return seasons.map((s) => s.season).concat(CURRENT_SEASON);
      }
    },
    website: nullTy(StrTy),
    createdAt: DateTimeTy,
    updatedAt: DateTimeTy,
    awards: {
      type: list(nn(AwardGQL)),
      args: { season: nullTy(IntTy) },
      resolve: dataLoaderResolverList(
        (team, a) => a.season != null ? { season: a.season, teamNumber: team.number } : { teamNumber: team.number },
        teamAwareAwardLoader
      )
    },
    matches: {
      type: list(nn(TeamMatchParticipationGQL)),
      args: { season: nullTy(IntTy), eventCode: nullTy(StrTy) },
      resolve: dataLoaderResolverList(
        (t, { season, eventCode }) => ({
          teamNumber: t.number,
          ...season != null ? { season } : {},
          ...eventCode != null ? { eventCode } : {}
        }),
        (keys) => TeamMatchParticipation.find({ where: keys })
      )
    },
    events: {
      type: list(nn(TeamEventParticipationGQL)),
      args: { season: IntTy },
      resolve: dataLoaderResolverList(
        (t, { season }) => ({ season, teamNumber: t.number }),
        async (keys) => {
          let groups = groupBy(keys, (k) => k.season);
          let qs = Object.entries(groups).map(
            ([season, k]) => TeamEventParticipation[+season].find({ where: k })
          );
          return (await Promise.all(qs)).flat();
        }
      )
    },
    quickStats: {
      type: QuickStatsGQL,
      args: { season: IntTy, region: { type: RegionOptionGQL } },
      resolve: async (team, { season, region }) => {
        if (ALL_SEASONS.indexOf(season) == -1)
          throw "invalid season";
        return getQuickStats(team.number, season, region);
      }
    }
  })
});
const TeamQueries = {
  teamByNumber: {
    type: TeamGQL,
    args: { number: IntTy },
    resolve: dataLoaderResolverSingle(
      (_, a) => a.number,
      (keys) => Team.find({ where: { number: In(keys) } }),
      (k, r) => k == r.number
    )
  },
  teamByName: {
    type: TeamGQL,
    args: { name: StrTy },
    resolve: dataLoaderResolverSingle(
      (_, a) => a.name,
      (keys) => Team.find({ where: { name: In(keys) } }),
      (k, r) => k == r.name
    )
  },
  teamsSearch: {
    type: list(nn(TeamGQL)),
    args: {
      region: { type: RegionOptionGQL },
      limit: nullTy(IntTy),
      searchText: nullTy(StrTy)
    },
    resolve: async (_, {
      region,
      limit,
      searchText
    }) => {
      let q = DATA_SOURCE.getRepository(Team).createQueryBuilder("t").distinctOn(["number"]);
      if (region && region != RegionOption.All) {
        q.leftJoin(TeamMatchParticipation, "m", "t.number = m.team_number").leftJoin(Event, "e", "e.season = m.season AND e.code = m.event_code").andWhere("e.region_code IN (:...regions)", {
          regions: getRegionCodes(region)
        });
      }
      if (limit && (!searchText || searchText.trim() == "")) {
        q.limit(limit);
      }
      let entities = await q.getMany();
      if (searchText)
        searchText = searchText.trim();
      if (searchText && searchText != "") {
        if (searchText.match(/^\d+$/)) {
          entities = entities.filter((e) => (e.number + "").startsWith(searchText)).sort((a, b) => a.number - b.number);
        } else {
          let res = fuzzySearch(entities, searchText, limit ?? void 0, "name", true);
          entities = res.map((d) => d.document);
        }
      }
      return entities;
    }
  }
};
const FilterGQL = new GraphQLInputObjectType({
  name: "Filter",
  fields: () => ({
    group: { type: FilterGroupGQL },
    cond: { type: FilterCondGQL }
  })
});
const FilterValueGQL = new GraphQLInputObjectType({
  name: "FilterValue",
  fields: {
    lit: nullTy(IntTy),
    var: nullTy(StrTy)
  }
});
const FilterCondGQL = new GraphQLInputObjectType({
  name: "FilterCond",
  fields: {
    lhs: { type: nn(FilterValueGQL) },
    op: { type: nn(FilterOpGQL) },
    rhs: { type: nn(FilterValueGQL) }
  }
});
const FilterGroupGQL = new GraphQLInputObjectType({
  name: "FilterGroup",
  fields: () => ({
    ty: { type: nn(FilterGroupTyGQL) },
    children: listTy(wr(nn(FilterGQL)))
  })
});
function filterGQLToSql(filter, stats, name2) {
  if (filter.cond == null && filter.group != null) {
    return filterGroupToSQL(filter.group, stats, name2);
  } else if (filter.group == null && filter.cond != null) {
    return filterCondToSQL(filter.cond, stats, name2);
  } else if (filter.group != null && filter.cond != null) {
    let g = filterGroupToSQL(filter.group, stats, name2);
    let c = filterCondToSQL(filter.cond, stats, name2);
    return `(${g} and ${c})`;
  } else {
    return "true";
  }
}
function filterGroupToSQL(group, stats, name2) {
  let baseCase = group.ty == FilterGroupTy.And ? "true" : "false";
  let sql = "(" + baseCase;
  for (let child of group.children) {
    sql += " " + group.ty + " " + filterGQLToSql(child, stats, name2);
  }
  return sql + ")";
}
function filterCondToSQL(cond, stats, name2) {
  let lhs = filterValToSQL(cond.lhs, stats, name2);
  let rhs = filterValToSQL(cond.rhs, stats, name2);
  let op = opToSQL(cond.op);
  return `(${lhs} ${op} ${rhs})`;
}
function opToSQL(op) {
  switch (op) {
    case "Eq":
      return "=";
    case "Neq":
      return "<>";
    case "Gt":
      return ">";
    case "Gte":
      return ">=";
    case "Lt":
      return "<";
    case "Lte":
      return "<=";
  }
}
function filterValToSQL(val, stats, name2) {
  if (val.lit) {
    return val.lit + "";
  } else if (val.var) {
    let ty = stats.getStat(val.var).ty;
    if (ty == "event") {
      return "null";
    } else {
      let sql = stats.getStat(val.var)?.sqlExpr ?? null;
      if (!sql) {
        return "0";
      } else if (sql.includes(".")) {
        let [s, e] = sql.split(".");
        return s + "." + name2(e);
      } else {
        return name2(sql);
      }
    }
  } else {
    return "0";
  }
}
function isFilteringOn(filter, id) {
  return !!filter?.cond && isFilteringOnCond(filter.cond, id) || !!filter?.group && isFilterOnGroup(filter.group, id);
}
function isFilterOnGroup(group, id) {
  for (let child of group.children) {
    if (isFilteringOn(child, id))
      return true;
  }
  return false;
}
function isFilteringOnCond(cond, id) {
  return isFilteringOnVal(cond.lhs, id) || isFilteringOnVal(cond.rhs, id);
}
function isFilteringOnVal(val, id) {
  return !!val.var && id(val.var);
}
function RecordGqlTy(wrapped, namePrefix) {
  let rowTy = new GraphQLObjectType({
    name: `${namePrefix}RecordRow`,
    fields: {
      data: { type: nn(wrapped) },
      noFilterRank: IntTy,
      filterRank: IntTy,
      noFilterSkipRank: IntTy,
      filterSkipRank: IntTy
    }
  });
  return new GraphQLObjectType({
    name: `${namePrefix}Records`,
    fields: {
      data: listTy(wr(nn(rowTy))),
      offset: IntTy,
      count: IntTy
    }
  });
}
const SpecificAlliance = new GraphQLObjectType({
  name: "SpecificAlliance",
  fields: {
    match: { type: nn(MatchGQL) },
    alliance: { type: nn(AllianceGQL) }
  }
});
const TepRecordsGql = wr(nn(RecordGqlTy(TeamEventParticipationGQL, "Tep")));
const MatchRecordsGql = wr(nn(RecordGqlTy(SpecificAlliance, "Match")));
function name(ns, exp) {
  return exp.match(/^\w+$/) ? ns.columnName(exp, void 0, []) : exp;
}
const RecordQueries = {
  tepRecords: {
    ...TepRecordsGql,
    args: {
      season: IntTy,
      sortBy: nullTy(StrTy),
      sortDir: { type: SortDirGQL },
      filter: { type: FilterGQL },
      region: { type: RegionOptionGQL },
      type: { type: EventTypeOptionGQL },
      remote: { type: RemoteOptionGQL },
      start: nullTy(DateTy),
      end: nullTy(DateTy),
      skip: IntTy,
      take: IntTy
    },
    async resolve(_, {
      season,
      sortBy,
      sortDir,
      filter,
      region,
      type,
      remote,
      start,
      end,
      skip,
      take
    }) {
      let Tep = TeamEventParticipation[season];
      if (!Tep)
        return { data: [], offset: 0, count: 0 };
      take = Math.min(take, 50);
      let descriptor = DESCRIPTORS[season];
      let statSet = getTepStatSet(season, false);
      let ns = DATA_SOURCE.namingStrategy;
      let defaultRankerSqlName = descriptor.pensSubtract ? "oprTotalPoints" : "oprTotalPointsNp";
      let rankerExp = statSet.getStat(sortBy ?? "")?.sqlExpr ?? defaultRankerSqlName;
      let rankerSql = name(ns, rankerExp);
      let defaultSortSql = name(ns, defaultRankerSqlName) + " DESC NULLS LAST";
      let sortDirSql = sortDir ?? SortDir.Desc;
      let chosenRegion = region ?? RegionOption.All;
      let chosenType = type ?? EventTypeOption.Competition;
      let filterSql = filter ? filterGQLToSql(filter, statSet, (s) => name(ns, s)) : "true";
      let contextAddedQ = Tep.createQueryBuilder("tep").select("tep.event_code", "tep_ec").addSelect("tep.team_number", "tep_tn").addSelect(
        `ROW_NUMBER() OVER (PARTITION BY "team_number" ORDER BY ${rankerSql} ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "ranking"
      ).addSelect(
        `ROW_NUMBER() OVER (PARTITION BY "team_number", ${filterSql} ORDER BY ${rankerSql} ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "filter_ranking"
      ).addSelect(`${rankerSql}`, "ranker").addSelect(name(ns, defaultRankerSqlName)).leftJoin("event", "e", "tep.season = e.season AND tep.event_code = e.code").andWhere("has_stats").andWhere("NOT e.modified_rules");
      let countQ = Tep.createQueryBuilder("tep").leftJoin("event", "e", "tep.season = e.season AND tep.event_code = e.code").where("has_stats").andWhere("NOT e.modified_rules");
      if (chosenRegion != RegionOption.All) {
        contextAddedQ.andWhere("region_code IN (:...regions)", {
          regions: getRegionCodes(chosenRegion)
        });
        countQ.andWhere("region_code IN (:...regions)", {
          regions: getRegionCodes(chosenRegion)
        });
      }
      if (chosenType != EventTypeOption.All && chosenType != EventTypeOption.Competition) {
        contextAddedQ.andWhere("type IN (:...types)", {
          types: getEventTypes(chosenType)
        });
        countQ.andWhere("type IN (:...types)", {
          types: getEventTypes(chosenType)
        });
      }
      if (remote == RemoteOption.Trad) {
        contextAddedQ.andWhere("NOT remote");
        countQ.andWhere("NOT remote");
      } else if (remote == RemoteOption.Remote) {
        contextAddedQ.andWhere("remote");
        countQ.andWhere("remote");
      }
      if (start) {
        contextAddedQ.andWhere(`"start" >= :start`, {
          start: start.toISOString().split("T")[0]
        });
        countQ.andWhere(`"start" >= :start`, { start: start.toISOString().split("T")[0] });
      }
      if (end) {
        contextAddedQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
        countQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
      }
      contextAddedQ.addSelect(filterSql, "is_in");
      let count = await countQ.andWhere(filterSql).getCount();
      if (skip >= count) {
        return { data: [], offset: skip, count };
      }
      let rankedQ = DATA_SOURCE.createQueryBuilder().from("context_added", "context_added").addSelect("*").addSelect(
        `RANK() over (order by ranking, ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "no_filter_skip_rank"
      ).addSelect(
        `RANK() over (partition by is_in order by filter_ranking, ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "filter_skip_rank"
      ).addSelect(
        `RANK() over (order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "no_filter_rank"
      ).addSelect(
        `RANK() over (partition by is_in order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "filter_rank"
      ).orderBy("ranker", sortDir == SortDir.Asc ? "ASC" : "DESC", "NULLS LAST").addOrderBy(name(ns, defaultRankerSqlName), "DESC", "NULLS LAST");
      let finalQ = await DATA_SOURCE.createQueryBuilder().addCommonTableExpression(contextAddedQ, "context_added").addCommonTableExpression(rankedQ, "ranked").from("ranked", "ranked").addSelect("filter_rank").addSelect("no_filter_rank").addSelect(
        "CASE WHEN filter_ranking = 1 THEN filter_skip_rank END",
        "filter_skip_rank"
      ).addSelect(
        "CASE WHEN ranking = 1 THEN no_filter_skip_rank END",
        "no_filter_skip_rank"
      ).addSelect("tep_ec").addSelect("tep_tn").where("is_in").limit(take).offset(skip).getRawMany();
      let where = finalQ.map((r) => ({
        season,
        eventCode: r.tep_ec,
        teamNumber: r.tep_tn
      }));
      let entities = await Tep.find({ where });
      let data = finalQ.map((r) => ({
        data: entities.find((e) => e.eventCode == r.tep_ec && e.teamNumber == r.tep_tn),
        noFilterRank: +r.no_filter_rank,
        filterRank: +r.filter_rank,
        noFilterSkipRank: +r.no_filter_skip_rank,
        filterSkipRank: +r.filter_skip_rank
      }));
      return { data, offset: skip, count };
    }
  },
  matchRecords: {
    ...MatchRecordsGql,
    args: {
      season: IntTy,
      sortBy: nullTy(StrTy),
      sortDir: { type: SortDirGQL },
      filter: { type: FilterGQL },
      region: { type: RegionOptionGQL },
      type: { type: EventTypeOptionGQL },
      remote: { type: RemoteOptionGQL },
      start: nullTy(DateTy),
      end: nullTy(DateTy),
      skip: IntTy,
      take: IntTy
    },
    async resolve(_source, {
      season,
      sortBy,
      sortDir,
      filter,
      region,
      type,
      remote,
      start,
      end,
      skip,
      take
    }, _context, info) {
      let Ms = MatchScore[season];
      if (!Ms)
        return { data: [], offset: 0, count: 0 };
      take = Math.min(take, 50);
      let descriptor = DESCRIPTORS[season];
      let statSet = getMatchStatSet(season, false);
      let ns = DATA_SOURCE.namingStrategy;
      let defaultRankerSqlName = descriptor.pensSubtract ? "totalPoints" : "totalPointsNp";
      let rankerExp = statSet.getStat(sortBy ?? "")?.sqlExpr ?? defaultRankerSqlName;
      let rankerSql = name(ns, rankerExp);
      let defaultSortSql = name(ns, defaultRankerSqlName) + " DESC NULLS LAST";
      let sortDirSql = sortDir ?? SortDir.Desc;
      let chosenRegion = region ?? RegionOption.All;
      let chosenType = type ?? EventTypeOption.Competition;
      let filterSql = filter ? filterGQLToSql(filter, statSet, (s) => name(ns, s)) : "true";
      let joinOurTeams = isFilteringOn(filter, (id) => id == "team1This") || isFilteringOn(filter, (id) => id == "team2This") || sortBy == "team1This" || sortBy == "team2This";
      let joinOtherTeams = isFilteringOn(filter, (id) => id == "team1Opp") || isFilteringOn(filter, (id) => id == "team2Opp") || sortBy == "team1Opp" || sortBy == "team2Opp";
      let joinOtherScore = isFilteringOn(filter, (id) => id.endsWith("Opp")) || sortBy?.endsWith("Opp");
      let contextAddedQ = Ms.createQueryBuilder("ms").select("ms.event_code", "ms_ec").addSelect("ms.match_id", "ms_id").addSelect("ms.alliance", "ms_al").addSelect(`${rankerSql}`, "ranker").addSelect("ms." + defaultRankerSqlName, name(ns, defaultRankerSqlName)).leftJoin("event", "e", "ms.season = e.season AND ms.event_code = e.code").where("NOT e.modified_rules");
      let countQ = Ms.createQueryBuilder("ms").leftJoin("event", "e", "ms.season = e.season AND ms.event_code = e.code").where("NOT e.modified_rules");
      if (joinOurTeams) {
        contextAddedQ.leftJoin(
          "team_match_participation",
          "tmp1",
          `ms.season = tmp1.season AND ms.event_code = tmp1.event_code AND ms.match_id = 
                    tmp1.match_id AND ms.alliance = tmp1.alliance AND (tmp1.station = 'Solo' OR 
                    tmp1.station = 'One')`
        );
        countQ.leftJoin(
          "team_match_participation",
          "tmp1",
          `ms.season = tmp1.season AND ms.event_code = tmp1.event_code AND ms.match_id = 
                    tmp1.match_id AND ms.alliance = tmp1.alliance AND (tmp1.station = 'Solo' OR 
                    tmp1.station = 'One')`
        );
        contextAddedQ.leftJoin(
          "team_match_participation",
          "tmp2",
          `ms.season = tmp2.season AND ms.event_code = tmp2.event_code AND ms.match_id = 
                    tmp2.match_id AND ms.alliance = tmp2.alliance AND tmp2.station = 'Two'`
        );
        countQ.leftJoin(
          "team_match_participation",
          "tmp2",
          `ms.season = tmp2.season AND ms.event_code = tmp2.event_code AND ms.match_id = 
                    tmp2.match_id AND ms.alliance = tmp2.alliance AND tmp2.station = 'Two'`
        );
      }
      if (joinOtherTeams) {
        contextAddedQ.leftJoin(
          "team_match_participation",
          "tmp1Opp",
          `ms.season = tmp1Opp.season AND ms.event_code = tmp1Opp.event_code AND ms.match_id = 
                    tmp1Opp.match_id AND ms.alliance <> tmp1Opp.alliance AND tmp1Opp.station = 'One'`
        );
        countQ.leftJoin(
          "team_match_participation",
          "tmp1Opp",
          `ms.season = tmp1Opp.season AND ms.event_code = tmp1Opp.event_code AND ms.match_id = 
                    tmp1Opp.match_id AND ms.alliance <> tmp1Opp.alliance AND tmp1Opp.station = 'One'`
        );
        contextAddedQ.leftJoin(
          "team_match_participation",
          "tmp2Opp",
          `ms.season = tmp2Opp.season AND ms.event_code = tmp2Opp.event_code AND ms.match_id = 
                    tmp2Opp.match_id AND ms.alliance <> tmp2Opp.alliance AND tmp2Opp.station = 'Two'`
        );
        countQ.leftJoin(
          "team_match_participation",
          "tmp2Opp",
          `ms.season = tmp2Opp.season AND ms.event_code = tmp2Opp.event_code AND ms.match_id = 
                    tmp2Opp.match_id AND ms.alliance <> tmp2Opp.alliance AND tmp2Opp.station = 'Two'`
        );
      }
      if (joinOtherScore) {
        contextAddedQ.leftJoin(
          `match_score_${season}`,
          "msOpp",
          `ms.season = msOpp.season AND ms.event_code = msOpp.eventCode AND ms.match_id = 
                    msOpp.matchId AND ms.alliance <> msOpp.alliance`
        );
        countQ.leftJoin(
          `match_score_${season}`,
          "msOpp",
          `ms.season = msOpp.season AND ms.event_code = msOpp.eventCode AND ms.match_id = 
                    msOpp.matchId AND ms.alliance <> msOpp.alliance`
        );
      }
      if (chosenRegion != RegionOption.All) {
        contextAddedQ.andWhere("region_code IN (:...regions)", {
          regions: getRegionCodes(chosenRegion)
        });
        countQ.andWhere("region_code IN (:...regions)", {
          regions: getRegionCodes(chosenRegion)
        });
      }
      if (chosenType != EventTypeOption.All && chosenType != EventTypeOption.Competition) {
        contextAddedQ.andWhere("type IN (:...types)", {
          types: getEventTypes(chosenType)
        });
        countQ.andWhere("type IN (:...types)", {
          types: getEventTypes(chosenType)
        });
      }
      if (remote == RemoteOption.Trad) {
        contextAddedQ.andWhere("NOT remote");
        countQ.andWhere("NOT remote");
      } else if (remote == RemoteOption.Remote) {
        contextAddedQ.andWhere("remote");
        countQ.andWhere("remote");
      }
      if (start) {
        contextAddedQ.andWhere(`"start" >= :start`, {
          start: start.toISOString().split("T")[0]
        });
        countQ.andWhere(`"start" >= :start`, { start: start.toISOString().split("T")[0] });
      }
      if (end) {
        contextAddedQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
        countQ.andWhere(`"end" <= :end`, { end: end.toISOString().split("T")[0] });
      }
      contextAddedQ.addSelect(filterSql, "is_in");
      let count = await countQ.andWhere(filterSql).getCount();
      if (skip >= count) {
        return { data: [], offset: skip, count };
      }
      let rankedQ = DATA_SOURCE.createQueryBuilder().from("context_added", "context_added").addSelect("*").addSelect(
        `RANK() over (order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "no_filter_rank"
      ).addSelect(
        `RANK() over (partition by is_in order by ranker ${sortDirSql} NULLS LAST, ${defaultSortSql})`,
        "filter_rank"
      ).orderBy("ranker", sortDir == SortDir.Asc ? "ASC" : "DESC", "NULLS LAST").addOrderBy(name(ns, defaultRankerSqlName), "DESC", "NULLS LAST");
      let finalQ = await DATA_SOURCE.createQueryBuilder().addCommonTableExpression(contextAddedQ, "context_added").addCommonTableExpression(rankedQ, "ranked").from("ranked", "ranked").addSelect("filter_rank").addSelect("no_filter_rank").addSelect("filter_rank", "filter_skip_rank").addSelect("no_filter_rank", "no_filter_skip_rank").addSelect("ms_ec").addSelect("ms_id").addSelect("ms_al").where("is_in").limit(take).offset(skip).getRawMany();
      let where = finalQ.map((r) => ({
        eventSeason: season,
        eventCode: r.ms_ec,
        id: r.ms_id
      }));
      let fields = graphqlFields(info)?.data?.data?.match;
      let entities = await singleSeasonScoreAwareMatchLoader(
        where,
        [],
        fields && "scores" in fields,
        fields && "teams" in fields
      );
      let data = finalQ.map((r) => ({
        data: {
          match: entities.find((e) => e.eventCode == r.ms_ec && e.id == r.ms_id),
          alliance: r.ms_al
        },
        noFilterRank: +r.no_filter_rank,
        filterRank: +r.filter_rank,
        noFilterSkipRank: +r.no_filter_skip_rank,
        filterSkipRank: +r.filter_skip_rank
      }));
      return { data, offset: skip, count };
    }
  }
};
const HomeQueries = {
  activeTeamsCount: {
    ...IntTy,
    args: { season: IntTy },
    resolve: async (_, { season }) => {
      let tep = TeamEventParticipation[season];
      if (!tep)
        return 0;
      let res = await tep.createQueryBuilder("tep").select('COUNT(DISTINCT("team_number"))').getRawOne();
      return +res.count;
    }
  },
  matchesPlayedCount: {
    ...IntTy,
    args: { season: IntTy },
    resolve: async (_, { season }) => {
      return DATA_SOURCE.getRepository(Match).createQueryBuilder("m").select().where("m.event_season = :season", { season }).andWhere("m.has_been_played").getCount();
    }
  },
  eventsOnDate: {
    type: list(nn(EventGQL)),
    args: { date: nullTy(DateTimeTy), type: { type: EventTypeOptionGQL } },
    resolve: async (_, { date, type }) => {
      let q = DATA_SOURCE.getRepository(Event).createQueryBuilder("e").where("e.start <= (:e at time zone timezone)::date", { e: date ?? "NOW()" }).andWhere("e.end >= (:e at time zone timezone)::date").orderBy("e.start", "ASC").addOrderBy("e.name", "DESC");
      if (type && type != EventTypeOption.All) {
        q.andWhere("type IN (:...types)", { types: getEventTypes(type) });
      }
      return q.getMany();
    }
  },
  tradWorldRecord: {
    type: nn(MatchGQL),
    args: { season: IntTy },
    resolve: async (_, { season }) => getWorldRecordMatch(season, "s.total_points_np")
  },
  tradWorldRecordWithPenalties: {
    type: nn(MatchGQL),
    args: { season: IntTy },
    resolve: async (_, { season }) => getWorldRecordMatch(season, "s.total_points")
  }
};
async function getWorldRecordMatch(season, orderColumn) {
  let ms = MatchScore[season];
  if (!ms)
    throw "Use a valid season";
  let match = await DATA_SOURCE.getRepository(Match).createQueryBuilder("m").leftJoin(
    `match_score_${season}`,
    "s",
    "s.season = m.event_season AND s.event_code = m.event_code AND s.match_id = m.id"
  ).leftJoin(Event, "e", "e.season = m.event_season AND e.code = m.event_code").orderBy(orderColumn, "DESC").where("m.has_been_played").andWhere("NOT e.remote").andWhere("e.type <> 'OffSeason'").andWhere("NOT e.modified_rules").andWhere('m."event_season" = :season', { season }).limit(1).getOne();
  if (!match)
    throw "No match found for world record";
  return DATA_SOURCE.getRepository(Match).createQueryBuilder("m").where("m.event_season = :season", { season: match.eventSeason }).andWhere("m.event_code = :code", { code: match.eventCode }).andWhere("m.id = :id", { id: match.id }).leftJoinAndMapMany(
    "m.scores",
    `match_score_${season}`,
    "ms",
    "m.event_season = ms.season AND m.event_code = ms.event_code AND m.id = ms.match_id"
  ).leftJoinAndMapMany(
    "m.teams",
    "team_match_participation",
    "tmp",
    "m.event_season = tmp.season AND m.event_code = tmp.event_code AND m.id = tmp.match_id"
  ).getOne();
}
async function deleteOld() {
  try {
    await BestName.delete({
      vote: -1,
      createdAt: LessThan(new Date(Date.now() - 1e3 * 60 * 60 * 24))
    });
  } catch (e) {
    console.error("Failed to delete old BestName entries.");
    console.error(e);
  }
}
setTimeout(deleteOld, 1e3 * 5);
setInterval(deleteOld, 1e3 * 60 * 60 * 24);
const BestNameGQL = new GraphQLObjectType({
  name: "BestName",
  fields: () => ({
    id: IntTy,
    team1: {
      type: nn(TeamGQL),
      resolve: (bestName) => bestName.team1D
    },
    team2: {
      type: nn(TeamGQL),
      resolve: (bestName) => bestName.team2D
    }
  })
});
const BestNameQueries = {
  getBestName: {
    type: BestNameGQL,
    resolve: async () => {
      let teams = await Team.createQueryBuilder("t").orderBy("RANDOM()").take(2).getMany();
      let bestName = BestName.create({
        team1: teams[0].number,
        team2: teams[1].number
      });
      await bestName.save();
      return {
        id: bestName.id,
        team1D: teams[0],
        team2D: teams[1]
      };
    }
  }
};
const BestNameMutations = {
  voteBestName: {
    type: BestNameGQL,
    args: {
      id: IntTy,
      vote: IntTy
    },
    resolve: async (_, { id, vote }) => {
      await DATA_SOURCE.createQueryBuilder().update(BestName).set({ vote }).where("id = :id AND (team1 = :vote OR team2 = :vote)", { id, vote }).execute();
      let teams = await Team.createQueryBuilder("t").orderBy("RANDOM()").take(2).getMany();
      let bestName = BestName.create({
        team1: teams[0].number,
        team2: teams[1].number
      });
      await bestName.save();
      return {
        id: bestName.id,
        team1D: teams[0],
        team2D: teams[1]
      };
    }
  }
};
const query = new GraphQLObjectType({
  name: "Query",
  fields: {
    ...TeamQueries,
    ...EventQueries,
    ...RecordQueries,
    ...HomeQueries,
    ...BestNameQueries
  }
});
const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    ...BestNameMutations
  }
});
const subscription = new GraphQLObjectType({
  name: "Subscription",
  fields: {
    ...EventSubscriptions
  }
});
const GQL_SCHEMA = new GraphQLSchema({
  query,
  mutation,
  subscription
});
export {
  GQL_SCHEMA
};
