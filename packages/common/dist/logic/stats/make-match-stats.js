"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchStatSet = void 0;
const Station_1 = require("../Station");
const descriptor_1 = require("../descriptors/descriptor");
const descriptor_list_1 = require("../descriptors/descriptor-list");
const stat_table_1 = require("./stat-table");
let statSetCache = {};
const TEAM_STATS = [
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.White,
        id: "team1This",
        columnName: "Team 1",
        dialogName: "Team 1",
        titleName: "Team 1",
        sqlExpr: "tmp1.team_number",
        ty: stat_table_1.StatType.Team,
        getNonRankValue: (d) => {
            let t = d.teams.find((s) => s.station == Station_1.Station.One || s.station == Station_1.Station.Solo);
            return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
        },
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.White,
        id: "team2This",
        columnName: "Team 2",
        dialogName: "Team 2",
        titleName: "Team 2",
        sqlExpr: "tmp2.team_number",
        ty: stat_table_1.StatType.Team,
        getNonRankValue: (d) => {
            let t = d.teams.find((t) => t.station == Station_1.Station.Two);
            return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
        },
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.White,
        id: "team1Opp",
        columnName: "Opp Team 1",
        dialogName: "Team 1",
        titleName: "Opponent Team 1",
        sqlExpr: "tmp1Opp.team_number",
        ty: stat_table_1.StatType.Team,
        getNonRankValue: (d) => {
            let opp = d.opponentsScore;
            if (!opp)
                return null;
            let t = opp.teams.find((t) => t.station == Station_1.Station.One || t.station == Station_1.Station.Solo);
            return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
        },
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.White,
        id: "team2Opp",
        columnName: "Opp Team 2",
        dialogName: "Team 2",
        titleName: "Opponent Team 2",
        sqlExpr: "tmp2Opp.team_number",
        ty: stat_table_1.StatType.Team,
        getNonRankValue: (d) => {
            let opp = d.opponentsScore;
            if (!opp)
                return null;
            let t = opp.teams.find((t) => t.station == Station_1.Station.Two);
            return t ? { ty: "team", name: t.team.name, number: t.team.number } : null;
        },
    }),
];
let INFO_STATS = [
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.Purple,
        id: "matchNum",
        columnName: "Match Num",
        dialogName: "Match Number",
        titleName: "Match Number",
        sqlExpr: "match_id",
        ty: stat_table_1.StatType.String,
        getNonRankValue: (d) => ({ ty: "string", val: d.match.description }),
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.Purple,
        id: "alliance",
        columnName: "Alliance",
        dialogName: "Alliance",
        titleName: "Alliance",
        sqlExpr: "alliance",
        ty: stat_table_1.StatType.String,
        getNonRankValue: (d) => (d.alliance ? { ty: "string", val: d.alliance } : null),
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.Purple,
        id: "event",
        columnName: "Event",
        dialogName: "Event",
        titleName: "Event",
        sqlExpr: "e.start",
        ty: stat_table_1.StatType.Event,
        getNonRankValue: (d) => {
            let e = d.match.event;
            return e
                ? {
                    ty: "event",
                    season: e.season,
                    code: e.code,
                    name: e.name,
                    start: e.start,
                    end: e.end,
                }
                : null;
        },
    }),
];
const TOTAL_POINTS_STATS = [
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.Blue,
        id: "totalPointsThis",
        columnName: "Total",
        dialogName: "Total Points",
        titleName: "Total Points",
        sqlExpr: `ms.totalPoints`,
        ty: stat_table_1.StatType.Int,
        getNonRankValue: (d) => ({ ty: "int", val: d.totalPoints }),
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.Blue,
        id: "totalPointsNpThis",
        columnName: "Total NP",
        dialogName: "Total Points NP",
        titleName: "Total Points No Penalties",
        sqlExpr: `ms.totalPointsNp`,
        ty: stat_table_1.StatType.Int,
        getNonRankValue: (d) => ({ ty: "int", val: d.totalPointsNp }),
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.Red,
        id: "totalPointsOpp",
        columnName: "Opp Total",
        dialogName: "Total Points",
        titleName: "Opponent Total Points",
        sqlExpr: `msOpp.totalPoints`,
        ty: stat_table_1.StatType.Int,
        getNonRankValue: (d) => d.opponentsScore ? { ty: "int", val: d.opponentsScore.totalPoints } : null,
    }),
    new stat_table_1.NonRankStatColumn({
        color: stat_table_1.Color.Red,
        id: "totalPointsNpOpp",
        columnName: "Opp Total NP",
        dialogName: "Total Points NP",
        titleName: "Opp Total Points No Penalties",
        sqlExpr: `msOpp.totalPointsNp`,
        ty: stat_table_1.StatType.Int,
        getNonRankValue: (d) => d.opponentsScore ? { ty: "int", val: d.opponentsScore.totalPointsNp } : null,
    }),
];
function getMatchStatSet(season, remote) {
    let key = `${season}-${remote}`;
    let descriptor = descriptor_list_1.DESCRIPTORS[season];
    if (!(season in statSetCache)) {
        let scoreStats = descriptor
            .scoreModalColumns()
            .flatMap((c) => [c.getStatColumn(descriptor_1.MSStatSide.This), c.getStatColumn(descriptor_1.MSStatSide.Opp)]);
        let scoreSection = new stat_table_1.StatSetSection("Scores", [
            { val: { id: "totalPoints", name: "Total Points" }, children: [] },
            { val: { id: "totalPointsNp", name: "Total Points NP" }, children: [] },
            ...(0, descriptor_1.filterMapTreeList)(descriptor.getSCoreModalTree(remote), (t) => ({
                id: t.id,
                name: t.displayName,
            })),
        ], [
            {
                id: descriptor_1.MSStatSide.This,
                name: "THIS",
                color: stat_table_1.Color.Blue,
                description: "Points scored by this alliance.",
            },
            {
                id: descriptor_1.MSStatSide.Opp,
                name: "OPP",
                color: stat_table_1.Color.Red,
                description: "Points scored by the opposing alliance.",
            },
        ]);
        let teamsSection = new stat_table_1.StatSetSection("Teams", [
            { val: { id: "team1", name: "Team 1" }, children: [] },
            { val: { id: "team2", name: "Team 2" }, children: [] },
        ], [
            {
                id: descriptor_1.MSStatSide.This,
                name: "THIS",
                color: stat_table_1.Color.Blue,
                description: "Teams on this alliance.",
            },
            {
                id: descriptor_1.MSStatSide.Opp,
                name: "OPP",
                color: stat_table_1.Color.Red,
                description: "Teams on the opposing alliance.",
            },
        ]);
        let infoSection = new stat_table_1.StatSetSection("Info", INFO_STATS.map((s) => ({ val: { id: s.id, name: s.dialogName }, children: [] })), [{ id: "", name: "", color: stat_table_1.Color.Purple, description: null }]);
        statSetCache[key] = new stat_table_1.StatSet(`ms${season}${remote ? "Remote" : "Trad"}`, [...scoreStats, ...TOTAL_POINTS_STATS, ...TEAM_STATS, ...INFO_STATS], [scoreSection, teamsSection, infoSection]);
    }
    return statSetCache[key];
}
exports.getMatchStatSet = getMatchStatSet;
//# sourceMappingURL=make-match-stats.js.map