"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatSet = exports.StatSetSection = exports.RANK_STATS = exports.RankTy = exports.NonRankStatColumn = exports.StatColumn = exports.Color = exports.StatType = exports.SortDir = void 0;
const filter_1 = require("../../utils/filter");
const string_1 = require("../../utils/string");
exports.SortDir = {
    Asc: "Asc",
    Desc: "Desc",
};
exports.StatType = {
    Int: "int",
    Float: "float",
    Rank: "rank",
    String: "string",
    Record: "record",
    Team: "team",
    Event: "event",
};
exports.Color = {
    White: "white",
    Red: "red",
    Blue: "blue",
    LightBlue: "light-blue",
    Green: "green",
    Purple: "purple",
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
        }
        else if (val.ty == "team") {
            return val.number;
        }
        else if (val.ty == "event") {
            return val.start;
        }
        else {
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
        return this.ty == exports.StatType.Team;
    }
}
exports.StatColumn = StatColumn;
class NonRankStatColumn extends StatColumn {
    getNonRankValueDistilled(d) {
        return StatColumn.distill(this.getNonRankValue(d));
    }
    constructor(opts) {
        super(Object.assign(Object.assign({}, opts), { getValue: (d) => opts.getNonRankValue(d.data) }));
        this.getNonRankValue = opts.getNonRankValue;
        this.sqlExpr = opts.sqlExpr;
    }
}
exports.NonRankStatColumn = NonRankStatColumn;
exports.RankTy = {
    NoFilter: "NoFilter",
    Filter: "Filter",
    NoFilterSkip: "NoFilterSkip",
    FilterSkip: "FilterSkip",
};
exports.RANK_STATS = {
    [exports.RankTy.NoFilter]: new StatColumn({
        id: "noFilterRank",
        columnName: "Rank",
        dialogName: "Rank",
        titleName: "No Filter Rank",
        color: exports.Color.White,
        ty: exports.StatType.Rank,
        getValue: (d) => ({ ty: exports.StatType.Rank, val: d.noFilterRank }),
    }),
    [exports.RankTy.Filter]: new StatColumn({
        id: "filterRank",
        columnName: "Rank",
        dialogName: "Rank",
        titleName: "Filter Rank",
        color: exports.Color.White,
        ty: exports.StatType.Rank,
        getValue: (d) => ({ ty: exports.StatType.Rank, val: d.filterRank }),
    }),
    [exports.RankTy.NoFilterSkip]: new StatColumn({
        id: "noFilterSkipRank",
        columnName: "Rank",
        dialogName: "Rank",
        titleName: "No Filter Skipping Rank",
        color: exports.Color.White,
        ty: exports.StatType.Rank,
        getValue: (d) => ({ ty: exports.StatType.Rank, val: d.noFilterSkipRank }),
    }),
    [exports.RankTy.FilterSkip]: new StatColumn({
        id: "filterSkipRank",
        columnName: "Rank",
        dialogName: "Rank",
        titleName: "Filter Skipping Rank",
        color: exports.Color.White,
        ty: exports.StatType.Rank,
        getValue: (d) => ({ ty: exports.StatType.Rank, val: d.filterSkipRank }),
    }),
};
class StatSetSection {
    constructor(name, rows, columns) {
        this.name = name;
        this.rows = rows;
        this.columns = columns;
    }
    getId(rowId, columnId) {
        return rowId + (0, string_1.titleCase)(columnId);
    }
    getRowId(row) {
        return row + this.columns.map((c) => c.id);
    }
}
exports.StatSetSection = StatSetSection;
class StatSet {
    constructor(id, allStats, sections) {
        this.id = id;
        this.allStats = allStats;
        this.sections = sections;
        this.allStatsRecord = (0, filter_1.groupBySingle)(allStats, (s) => s.id);
    }
    getStat(id) {
        return this.allStatsRecord[id];
    }
}
exports.StatSet = StatSet;
//# sourceMappingURL=stat-table.js.map