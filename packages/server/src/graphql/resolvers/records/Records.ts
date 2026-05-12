// @ts-nocheck
import {
    DESCRIPTORS,
    DateTy,
    EventTypeOption,
    IntTy,
    RegionOption,
    RemoteOption,
    Season,
    SortDir,
    StrTy,
    getEventTypes,
    getMatchStatSet,
    getRegionCodes,
    getTepStatSet,
    listTy,
    nn,
    nullTy,
    wr,
} from "@ftc-scout/common";
import { GraphQLFieldConfig, GraphQLObjectType, GraphQLOutputType } from "graphql";
import { TeamEventParticipationGQL } from "../TeamEventParticipation";
import { TeamEventParticipation } from "../../../db/schemas/dyn/team-event-participation";
import { Event } from "../../../db/schemas/Event";
import {
    AllianceGQL,
    EventTypeOptionGQL,
    RegionOptionGQL,
    RemoteOptionGQL,
    SortDirGQL,
} from "../enums";
import { FilterGQL, TyFilterGQL, filterGQLToSql, isFilteringOn } from "./filter-gql";
import { MatchScore } from "../../../db/schemas/dyn/match-score";
import { MatchGQL, singleSeasonScoreAwareMatchLoader } from "../Match";
import graphqlFields from "graphql-fields";

function name(_ns: any, exp: string) {
    return exp;
}

function RecordGqlTy(wrapped: GraphQLOutputType, namePrefix: string): GraphQLObjectType {
    let rowTy = new GraphQLObjectType({
        name: `${namePrefix}RecordRow`,
        fields: {
            data: { type: nn(wrapped) },
            noFilterRank: IntTy,
            filterRank: IntTy,
            noFilterSkipRank: IntTy,
            filterSkipRank: IntTy,
        },
    });

    return new GraphQLObjectType({
        name: `${namePrefix}Records`,
        fields: {
            data: listTy(wr(nn(rowTy))),
            offset: IntTy,
            count: IntTy,
        },
    });
}

const SpecificAlliance = new GraphQLObjectType({
    name: "SpecificAlliance",
    fields: {
        match: { type: nn(MatchGQL) },
        alliance: { type: nn(AllianceGQL) },
    },
});

const TepRecordsGql = wr(nn(RecordGqlTy(TeamEventParticipationGQL, "Tep")));
const MatchRecordsGql = wr(nn(RecordGqlTy(SpecificAlliance, "Match")));

function fieldName(exp: string): string {
    // Convert camelCase to camelCase (Mongoose uses camelCase by default)
    return exp;
}

export const RecordQueries: Record<string, GraphQLFieldConfig<any, any>> = {
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
            take: IntTy,
        },
        async resolve(
            _,
            {
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
                take,
            }: {
                season: Season;
                sortBy: string | null;
                sortDir: SortDir | null;
                filter: TyFilterGQL;
                region: RegionOption | null;
                type: EventTypeOption | null;
                remote: RemoteOption | null;
                start: Date | null;
                end: Date | null;
                skip: number;
                take: number;
            }
        ) {
            let Tep = TeamEventParticipation[season];
            if (!Tep) return { data: [], offset: 0, count: 0 };

            take = Math.min(take, 50);

            const mongoEvents = await Event.find({ season });
            const eventMap = new Map(mongoEvents.map((event) => [`${event.season}:${event.code}`, event]));
            const mongoDescriptor = DESCRIPTORS[season];
            const mongoDefaultRankerSqlName = mongoDescriptor.pensSubtract
                ? "oprTotalPoints"
                : "oprTotalPointsNp";
            const mongoSortKey = sortBy ?? mongoDefaultRankerSqlName;

            let rows = await Tep.find({ season, hasStats: true });

            rows = rows.filter((row) => {
                const event = eventMap.get(`${row.season}:${row.eventCode}`);
                if (!event) return false;
                if (event.modifiedRules) return false;

                if (region && region != RegionOption.All) {
                    const regions = new Set(getRegionCodes(region));
                    if (!event.regionCode || !regions.has(event.regionCode)) return false;
                }

                if (type && type != EventTypeOption.All && type != EventTypeOption.Competition) {
                    const types = new Set(getEventTypes(type));
                    if (!types.has(event.type)) return false;
                }

                if (remote == RemoteOption.Trad && row.isRemote) return false;
                if (remote == RemoteOption.Remote && !row.isRemote) return false;

                if (start && new Date(event.start).toISOString().split("T")[0] < start.toISOString().split("T")[0]) {
                    return false;
                }

                if (end && new Date(event.end).toISOString().split("T")[0] > end.toISOString().split("T")[0]) {
                    return false;
                }

                return true;
            });

            rows.sort((a, b) => {
                const av = Number((a as any)[mongoSortKey] ?? (a as any).opr?.totalPoints ?? (a as any).opr?.totalPointsNp ?? -Infinity);
                const bv = Number((b as any)[mongoSortKey] ?? (b as any).opr?.totalPoints ?? (b as any).opr?.totalPointsNp ?? -Infinity);
                return sortDir == SortDir.Asc ? av - bv : bv - av;
            });

            const sliced = rows.slice(skip, skip + take);
            return {
                data: sliced.map((row, index) => ({
                    data: row,
                    noFilterRank: skip + index + 1,
                    filterRank: skip + index + 1,
                    noFilterSkipRank: skip + index + 1,
                    filterSkipRank: skip + index + 1,
                })),
                offset: skip,
                count: rows.length,
            };
        },
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
            take: IntTy,
        },
        async resolve(
            _source,
            {
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
                take,
            }: {
                season: Season;
                sortBy: string | null;
                sortDir: SortDir | null;
                filter: TyFilterGQL;
                region: RegionOption | null;
                type: EventTypeOption | null;
                remote: RemoteOption | null;
                start: Date | null;
                end: Date | null;
                skip: number;
                take: number;
            },
            _context,
            info
        ) {
            let Ms = MatchScore[season];
            if (!Ms) return { data: [], offset: 0, count: 0 };

            take = Math.min(take, 50);

            const mongoEvents = await Event.find({ season });
            const eventMap = new Map(mongoEvents.map((event) => [`${event.season}:${event.code}`, event]));
            const mongoDescriptor = DESCRIPTORS[season];
            const mongoDefaultRankerSqlName = mongoDescriptor.pensSubtract ? "totalPoints" : "totalPointsNp";
            const mongoSortKey = sortBy ?? mongoDefaultRankerSqlName;

            const matchDocs = await Match.find({ eventSeason: season });
            const rows: Array<{ match: any; alliance: any; score: number }> = [];

            for (const match of matchDocs) {
                const event = eventMap.get(`${match.eventSeason}:${match.eventCode}`);
                if (!event || event.modifiedRules) continue;

                if (region && region != RegionOption.All) {
                    const regions = new Set(getRegionCodes(region));
                    if (!event.regionCode || !regions.has(event.regionCode)) continue;
                }

                if (type && type != EventTypeOption.All && type != EventTypeOption.Competition) {
                    const types = new Set(getEventTypes(type));
                    if (!types.has(event.type)) continue;
                }

                if (remote == RemoteOption.Trad && event.remote) continue;
                if (remote == RemoteOption.Remote && !event.remote) continue;

                if (start && new Date(event.start).toISOString().split("T")[0] < start.toISOString().split("T")[0]) continue;
                if (end && new Date(event.end).toISOString().split("T")[0] > end.toISOString().split("T")[0]) continue;

                const scores = await MatchScore[season].find({
                    season,
                    eventCode: match.eventCode,
                    matchId: match.id,
                });

                const matchScore = frontendMSFromDB(scores as any[]);
                if (!matchScore) continue;

                const scoreValue = Number((matchScore as any)[mongoSortKey] ?? (matchScore as any).totalPoints ?? (matchScore as any).totalPointsNp ?? -Infinity);

                if ((matchScore as any).red) {
                    rows.push({ match, alliance: (matchScore as any).red.alliance, score: scoreValue });
                    rows.push({ match, alliance: (matchScore as any).blue.alliance, score: scoreValue });
                } else {
                    rows.push({ match, alliance: (matchScore as any).alliance, score: scoreValue });
                }
            }

            rows.sort((a, b) => (sortDir == SortDir.Asc ? a.score - b.score : b.score - a.score));

            const sliced = rows.slice(skip, skip + take);
            return {
                data: sliced.map((row, index) => ({
                    data: { match: row.match, alliance: row.alliance },
                    noFilterRank: skip + index + 1,
                    filterRank: skip + index + 1,
                    noFilterSkipRank: skip + index + 1,
                    filterSkipRank: skip + index + 1,
                })),
                offset: skip,
                count: rows.length,
            };
        },
    },
};
