"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTepStatSet = exports.TEP_GROUP_DESC = exports.TEP_GROUP_NAMES = exports.TEP_GROUP_DATA_TYS = exports.TEP_GROUP_COLORS = exports.TEP_STAT_GROUPS = exports.TepStatGroup = void 0;
const descriptor_1 = require("../descriptors/descriptor");
const descriptor_list_1 = require("../descriptors/descriptor-list");
const stat_table_1 = require("./stat-table");
exports.TepStatGroup = {
    Tot: "tot",
    Avg: "avg",
    Opr: "opr",
    Min: "min",
    Max: "max",
    Dev: "dev",
};
exports.TEP_STAT_GROUPS = [
    exports.TepStatGroup.Tot,
    exports.TepStatGroup.Avg,
    exports.TepStatGroup.Opr,
    exports.TepStatGroup.Min,
    exports.TepStatGroup.Max,
    exports.TepStatGroup.Dev,
];
exports.TEP_GROUP_COLORS = {
    [exports.TepStatGroup.Tot]: stat_table_1.Color.Red,
    [exports.TepStatGroup.Avg]: stat_table_1.Color.Purple,
    [exports.TepStatGroup.Opr]: stat_table_1.Color.Purple,
    [exports.TepStatGroup.Min]: stat_table_1.Color.LightBlue,
    [exports.TepStatGroup.Max]: stat_table_1.Color.Blue,
    [exports.TepStatGroup.Dev]: stat_table_1.Color.Green,
};
exports.TEP_GROUP_DATA_TYS = {
    [exports.TepStatGroup.Tot]: stat_table_1.StatType.Int,
    [exports.TepStatGroup.Avg]: stat_table_1.StatType.Float,
    [exports.TepStatGroup.Opr]: stat_table_1.StatType.Float,
    [exports.TepStatGroup.Min]: stat_table_1.StatType.Int,
    [exports.TepStatGroup.Max]: stat_table_1.StatType.Int,
    [exports.TepStatGroup.Dev]: stat_table_1.StatType.Float,
};
exports.TEP_GROUP_NAMES = {
    [exports.TepStatGroup.Tot]: ["Total", ""],
    [exports.TepStatGroup.Avg]: ["Average", ""],
    [exports.TepStatGroup.Opr]: ["", "Opr"],
    [exports.TepStatGroup.Min]: ["Minimum", ""],
    [exports.TepStatGroup.Max]: ["Maximum", ""],
    [exports.TepStatGroup.Dev]: ["", "Standard Deviation"],
};
exports.TEP_GROUP_DESC = {
    [exports.TepStatGroup.Tot]: "The sum of all points scored in the category.",
    [exports.TepStatGroup.Avg]: "The average number of points scored in the category.",
    [exports.TepStatGroup.Opr]: "Offensive Power Rating.",
    [exports.TepStatGroup.Min]: "The lowest number of points scored in the category.",
    [exports.TepStatGroup.Max]: "The highest number of points scored in the category.",
    [exports.TepStatGroup.Dev]: "The standard deviation of scores in the category.",
};
let statSetCache = {};
function getTepStatSet(season, remote) {
    let key = `${season}-${remote}`;
    let descriptor = descriptor_list_1.DESCRIPTORS[season];
    if (!(season in statSetCache)) {
        let soloStats = [
            new stat_table_1.NonRankStatColumn({
                color: stat_table_1.Color.White,
                id: "team",
                columnName: "Team",
                dialogName: "Team",
                titleName: "Team",
                sqlExpr: "teamNumber",
                ty: stat_table_1.StatType.Team,
                getNonRankValue: (d) => ({
                    ty: "team",
                    name: d.team.name,
                    number: d.team.number,
                }),
            }),
            new stat_table_1.NonRankStatColumn({
                color: stat_table_1.Color.White,
                id: "eventRank",
                columnName: "Rank",
                dialogName: "Ranking",
                titleName: "Event Ranking",
                sqlExpr: "rank",
                ty: stat_table_1.StatType.Rank,
                getNonRankValue: (d) => ({ ty: "rank", val: d.stats.rank }),
            }),
            new stat_table_1.NonRankStatColumn({
                color: stat_table_1.Color.Red,
                id: "rankingScore",
                columnName: "RS",
                dialogName: "Ranking Score",
                titleName: "Ranking Score",
                sqlExpr: "rp",
                ty: stat_table_1.StatType.Float,
                getNonRankValue: (d) => ({
                    ty: stat_table_1.StatType.Float,
                    val: d.stats.rp,
                }),
            }),
            new stat_table_1.NonRankStatColumn({
                color: stat_table_1.Color.LightBlue,
                id: "tb1",
                columnName: "TBP",
                dialogName: "Tie Breaker Points",
                titleName: "Tie Breaker Points",
                sqlExpr: "tb1",
                ty: stat_table_1.StatType.Float,
                getNonRankValue: (d) => ({ ty: "float", val: d.stats.tb1 }),
            }),
            ...(descriptor.rankings.tb == "LosingScore"
                ? []
                : [
                    new stat_table_1.NonRankStatColumn({
                        color: stat_table_1.Color.Blue,
                        id: "tb2",
                        columnName: "TBP2",
                        dialogName: "Tie Breaker Points 2",
                        titleName: "Tie Breaker Points 2",
                        sqlExpr: "tb2",
                        ty: stat_table_1.StatType.Float,
                        getNonRankValue: (d) => ({ ty: "float", val: d.stats.tb2 }),
                    }),
                ]),
            new stat_table_1.NonRankStatColumn({
                color: stat_table_1.Color.Green,
                id: "played",
                columnName: "Played",
                dialogName: "Matches Played",
                titleName: "Matches Played",
                sqlExpr: "qualMatchesPlayed",
                ty: stat_table_1.StatType.Int,
                getNonRankValue: (d) => ({ ty: "int", val: d.stats.qualMatchesPlayed }),
            }),
            ...(remote
                ? []
                : [
                    new stat_table_1.NonRankStatColumn({
                        color: stat_table_1.Color.Green,
                        id: "wins",
                        columnName: "Wins",
                        dialogName: "Wins",
                        titleName: "Wins",
                        sqlExpr: "wins",
                        ty: stat_table_1.StatType.Int,
                        getNonRankValue: (d) => "wins" in d.stats ? { ty: "int", val: d.stats.wins } : null,
                    }),
                    new stat_table_1.NonRankStatColumn({
                        color: stat_table_1.Color.Green,
                        id: "losses",
                        columnName: "Losses",
                        dialogName: "Losses",
                        titleName: "Losses",
                        sqlExpr: "losses",
                        ty: stat_table_1.StatType.Int,
                        getNonRankValue: (d) => "losses" in d.stats ? { ty: "int", val: d.stats.losses } : null,
                    }),
                    new stat_table_1.NonRankStatColumn({
                        color: stat_table_1.Color.Green,
                        id: "ties",
                        columnName: "Ties",
                        dialogName: "Ties",
                        titleName: "Ties",
                        sqlExpr: "ties",
                        ty: stat_table_1.StatType.Int,
                        getNonRankValue: (d) => "ties" in d.stats ? { ty: "int", val: d.stats.ties } : null,
                    }),
                    new stat_table_1.NonRankStatColumn({
                        color: stat_table_1.Color.Green,
                        id: "eventRecord",
                        columnName: "Record",
                        dialogName: "Record",
                        titleName: "Record",
                        sqlExpr: "(wins * 2 + ties / NULLIF(qual_matches_played, 0))",
                        ty: stat_table_1.StatType.Record,
                        getNonRankValue: (d) => "wins" in d.stats
                            ? {
                                ty: "record",
                                wins: d.stats.wins,
                                losses: d.stats.losses,
                                ties: d.stats.ties,
                            }
                            : null,
                    }),
                ]),
        ];
        let eventStats = [
            new stat_table_1.NonRankStatColumn({
                id: "event",
                columnName: "Event",
                titleName: "Event",
                dialogName: "Event",
                sqlExpr: "start",
                color: stat_table_1.Color.White,
                ty: stat_table_1.StatType.Event,
                getNonRankValue: (d) => "event" in d
                    ? {
                        ty: "event",
                        season: d.event.season,
                        code: d.event.code,
                        name: d.event.name,
                        start: d.event.start,
                        end: d.event.end,
                    }
                    : null,
            }),
        ];
        let soloSection = new stat_table_1.StatSetSection("Team's Event Performance", soloStats.map((s) => ({ val: { id: s.id, name: s.dialogName }, children: [] })), [{ id: "", name: "", color: stat_table_1.Color.Purple, description: null }]);
        let eventSection = new stat_table_1.StatSetSection("Event", [{ val: { id: "event", name: "Event" }, children: [] }], [{ id: "", name: "", color: stat_table_1.Color.Purple, description: null }]);
        let groupStats = descriptor
            .tepColumns()
            .flatMap((t) => exports.TEP_STAT_GROUPS.map((g) => t.getStatColumn(g)));
        let groupSection = new stat_table_1.StatSetSection("Match Scores", (0, descriptor_1.filterMapTreeList)(descriptor.getTepTree(remote), (t) => ({
            id: t.id,
            name: t.dialogName,
        })), exports.TEP_STAT_GROUPS.map((g) => ({
            id: g,
            name: g.toUpperCase(),
            color: exports.TEP_GROUP_COLORS[g],
            description: exports.TEP_GROUP_DESC[g],
        })));
        statSetCache[key] = new stat_table_1.StatSet(`tep${season}${remote ? "Remote" : "Trad"}`, [...soloStats, ...groupStats, ...eventStats], [soloSection, groupSection, eventSection]);
    }
    return statSetCache[key];
}
exports.getTepStatSet = getTepStatSet;
//# sourceMappingURL=make-tep-stats.js.map