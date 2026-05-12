import { GraphQLFieldConfig, GraphQLInt, GraphQLObjectType } from "graphql";
import { dataLoaderResolverList, dataLoaderResolverSingle } from "../utils";
import {
    ALL_SEASONS,
    DESCRIPTORS,
    DateTimeTy,
    FloatTy,
    IntTy,
    RegionOption,
    StrTy,
    fuzzySearch,
    getRegionCodes,
    groupBy,
    list,
    listTy,
    nn,
    nullTy,
    CURRENT_SEASON,
} from "@ftc-scout/common";
import { Team } from "../../db/schemas/Team";
import { AwardGQL, teamAwareAwardLoader } from "./Award";
import { Award } from "../../db/schemas/Award";
import { Season } from "@ftc-scout/common";
import { TeamMatchParticipationGQL } from "./TeamMatchParticipation";
import { TeamMatchParticipation } from "../../db/schemas/TeamMatchParticipation";
import { LocationGQL } from "../objs/Location";
import { TeamEventParticipationGQL } from "./TeamEventParticipation";
import { RegionOptionGQL } from "./enums";
import { Event } from "../../db/schemas/Event";

const QuickStatGQL = new GraphQLObjectType({
    name: "QuickStat",
    fields: {
        value: FloatTy,
        rank: IntTy,
    },
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
        count: IntTy,
    },
});

let cachedQSCount: Partial<Record<Season, { count: number; time: number }>> = {};
let cacheTime = 1000 * 60 * 5; // 5 minutes

async function getQuickStatCount(season: Season, region: RegionOption | null) {
    let specialRegion = region && region != RegionOption.All;
    let cached = cachedQSCount[season];
    if (!specialRegion && cached && Date.now() - cached.time < cacheTime) {
        return cached.count;
    }

    let query: any = { season, hasStats: true, isRemote: false };
    if (region && region != RegionOption.All) {
        let regionEvents = await Event.find({ regionCode: { $in: getRegionCodes(region) } });
        let eventCodes = regionEvents.map((e) => e.code);
        query.eventCode = { $in: eventCodes };
    }

    let count = await TeamMatchParticipation.countDocuments(query);
    if (!specialRegion) {
        cachedQSCount[season] = { count, time: Date.now() };
    }
    return count;
}

export async function getQuickStats(number: number, season: Season, region: RegionOption | null) {
    let total = DESCRIPTORS[season].pensSubtract ? "total_points" : "total_points_np";
    // Note: For Mongoose, we need a simplified implementation
    // Get all stats for the team in this season
    let tep = TeamEventParticipation[season];
    if (!tep) return null;

    let query: any = { teamNumber: number };
    if (region && region != RegionOption.All) {
        let regionEvents = await Event.find({ regionCode: { $in: getRegionCodes(region) } });
        let eventCodes = regionEvents.map((e) => e.code);
        query.eventCode = { $in: eventCodes };
    }

    let stats = await tep.find(query).lean();
    if (!stats.length) return null;

    // Calculate max values
    let totPoints = stats.map(s => (s.opr?.totalPoints ?? 0)).sort((a, b) => b - a);
    let autoPoints = stats.map(s => (s.opr?.autoPoints ?? 0)).sort((a, b) => b - a);
    let dcPoints = stats.map(s => (s.opr?.dcPoints ?? 0)).sort((a, b) => b - a);
    let egPoints = stats.map(s => (s.opr?.egPoints ?? 0)).sort((a, b) => b - a);

    // Get rank by counting how many teams have higher value
    let allTeamStats = await tep.find({}).lean();
    let totRank = allTeamStats.filter(s => (s.opr?.totalPoints ?? 0) > totPoints[0]).length + 1;
    let autoRank = allTeamStats.filter(s => (s.opr?.autoPoints ?? 0) > autoPoints[0]).length + 1;
    let dcRank = allTeamStats.filter(s => (s.opr?.dcPoints ?? 0) > dcPoints[0]).length + 1;
    let egRank = allTeamStats.filter(s => (s.opr?.egPoints ?? 0) > egPoints[0]).length + 1;

    return {
        season,
        number: number,
        tot: { value: totPoints[0] ?? 0, rank: totRank },
        auto: { value: autoPoints[0] ?? 0, rank: autoRank },
        dc: { value: dcPoints[0] ?? 0, rank: dcRank },
        eg: { value: egPoints[0] ?? 0, rank: egRank },
        count: await getQuickStatCount(season, region),
    };
}

export const TeamGQL: GraphQLObjectType = new GraphQLObjectType({
    name: "Team",
    fields: () => ({
        number: IntTy,
        name: StrTy,
        schoolName: StrTy,
        sponsors: listTy(StrTy),
        location: {
            type: nn(LocationGQL),
            resolve: (t) => ({ city: t.city, state: t.state, country: t.country }),
        },
        rookieYear: IntTy,
        activeSeasons: {
            type: list(GraphQLInt),
            resolve: async (t) => {
                let seasons = await TeamMatchParticipation.distinct("season", { teamNumber: t.number });
                return seasons.concat(CURRENT_SEASON);
            },
        },
        website: nullTy(StrTy),
        createdAt: DateTimeTy,
        updatedAt: DateTimeTy,
        awards: {
            type: list(nn(AwardGQL)),
            args: { season: nullTy(IntTy) },
            resolve: dataLoaderResolverList<
                Team,
                Award,
                { season?: Season; teamNumber: number },
                { season: Season | null }
            >(
                (team, a) =>
                    a.season != null
                        ? { season: a.season, teamNumber: team.number }
                        : { teamNumber: team.number },
                teamAwareAwardLoader
            ),
        },
        matches: {
            type: list(nn(TeamMatchParticipationGQL)),
            args: { season: nullTy(IntTy), eventCode: nullTy(StrTy) },
            resolve: dataLoaderResolverList<
                Team,
                TeamMatchParticipation,
                { season?: Season; eventCode?: string; teamNumber: number },
                { season: Season | null; eventCode: string | null }
            >(
                (t, { season, eventCode }) => ({
                    teamNumber: t.number,
                    ...(season != null ? { season } : {}),
                    ...(eventCode != null ? { eventCode } : {}),
                }),
                (keys) => TeamMatchParticipation.find({ where: keys })
            ),
        },
        events: {
            type: list(nn(TeamEventParticipationGQL)),
            args: { season: IntTy },
            resolve: dataLoaderResolverList<
                Team,
                TeamEventParticipation,
                { season: Season; teamNumber: number },
                { season: Season }
            >(
                (t, { season }) => ({ season, teamNumber: t.number }),
                async (keys) => {
                    let groups = groupBy(keys, (k) => k.season);
                    let qs = Object.entries(groups).map(([season, k]) =>
                        TeamEventParticipation[+season as Season].find({ where: k })
                    );
                    return (await Promise.all(qs)).flat();
                }
            ),
        },

        quickStats: {
            type: QuickStatsGQL,
            args: { season: IntTy, region: { type: RegionOptionGQL } },
            resolve: async (
                team,
                { season, region }: { season: Season; region: RegionOption | null }
            ) => {
                if (ALL_SEASONS.indexOf(season) == -1) throw "invalid season";
                return getQuickStats(team.number, season, region);
            },
        },
    }),
});

export const TeamQueries: Record<string, GraphQLFieldConfig<any, any>> = {
    teamByNumber: {
        type: TeamGQL,
        args: { number: IntTy },
        resolve: dataLoaderResolverSingle<{}, Team, number, { number: number }>(
            (_, a) => a.number,
            (keys) => Team.find({ number: { $in: keys } }),
            (k, r) => k == r.number
        ),
    },
    teamByName: {
        type: TeamGQL,
        args: { name: StrTy },
        resolve: dataLoaderResolverSingle<{}, Team, string, { name: string }>(
            (_, a) => a.name,
            (keys) => Team.find({ name: { $in: keys } }),
            (k, r) => k == r.name
        ),
    },

    teamsSearch: {
        type: list(nn(TeamGQL)),
        args: {
            region: { type: RegionOptionGQL },
            limit: nullTy(IntTy),
            searchText: nullTy(StrTy),
        },
        resolve: async (
            _,
            {
                region,
                limit,
                searchText,
            }: {
                region: RegionOption | null;
                limit: number | null;
                searchText: string | null;
            }
        ) => {
            let entities: any[] = [];
            if (region && region != RegionOption.All) {
                let regionCodes = getRegionCodes(region);
                let events = await Event.find({ regionCode: { $in: regionCodes } });
                let eventCodes = events.map(e => ({ season: e.season, code: e.code }));
                
                let participations = await TeamMatchParticipation.find({
                    season: { $in: eventCodes.map(e => e.season) },
                    eventCode: { $in: eventCodes.map(e => e.code) }
                }).lean();
                
                let teamNumbers = [...new Set(participations.map(p => p.teamNumber))];
                entities = await Team.find({ number: { $in: teamNumbers } });
            } else {
                entities = await Team.find({});
            }

            if (limit && (!searchText || searchText.trim() == "")) {
                entities = entities.slice(0, limit);
            }

            if (searchText) searchText = searchText.trim();
            if (searchText && searchText != "") {
                if (searchText.match(/^\d+$/)) {
                    entities = entities
                        .filter((e) => (e.number + "").startsWith(searchText!))
                        .sort((a, b) => a.number - b.number);
                } else {
                    let res = fuzzySearch(entities, searchText, limit ?? undefined, "name", true);
                    entities = res.map((d) => d.document);
                }
            }

            return entities;
        },
    },
};
