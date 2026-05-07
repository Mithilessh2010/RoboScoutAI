"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptorColumn = exports.ScoreModalComponent = exports.MSStatSide = exports.TepComponent = exports.MatchScoreComponent = exports.Descriptor = exports.filterMapTreeList = exports.filterMapTree = void 0;
const filter_1 = require("../../utils/filter");
const stat_table_1 = require("../stats/stat-table");
const make_tep_stats_1 = require("../stats/make-tep-stats");
const string_1 = require("../../utils/string");
function filterMapTree(t, mapper, f = undefined) {
    let val = mapper(t.val);
    return val && (t.for == undefined || t.for == f)
        ? {
            val,
            children: t.children.map((e) => filterMapTree(e, mapper, f)).filter(filter_1.notEmpty),
        }
        : undefined;
}
exports.filterMapTree = filterMapTree;
function filterMapTreeList(ts, mapper, f = undefined) {
    return ts.map((t) => filterMapTree(t, mapper, f)).filter(filter_1.notEmpty);
}
exports.filterMapTreeList = filterMapTreeList;
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
        this.scoreModalTree = filterMapTreeList(trad, (id) => { var _a; return (_a = this.columnsMap[id]) === null || _a === void 0 ? void 0 : _a.scoreM; }, "sm");
        this.scoreModalTreeRemote = filterMapTreeList(remote, (id) => { var _a; return (_a = this.columnsMap[id]) === null || _a === void 0 ? void 0 : _a.scoreM; }, "sm");
        this.tepTree = filterMapTreeList(trad, (id) => { var _a; return (_a = this.columnsMap[id]) === null || _a === void 0 ? void 0 : _a.tep; }, "tep");
        this.tepTreeRemote = filterMapTreeList(remote, (id) => { var _a; return (_a = this.columnsMap[id]) === null || _a === void 0 ? void 0 : _a.tep; }, "tep");
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
        return this.columns.map((c) => c.ms).filter(filter_1.notEmpty);
    }
    scoreModalColumns() {
        return this.columns.map((c) => c.scoreM).filter(filter_1.notEmpty);
    }
    tepColumns() {
        return this.columns.map((c) => c.tep).filter(filter_1.notEmpty);
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
exports.Descriptor = Descriptor;
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
        let val = "fromSelf" in this.create
            ? this.create.fromSelf(apiSelf)
            : this.create.fromApi(api, other);
        dbSelf[this.dbColName] = val;
        apiSelf[this.getApiName(remote)] = val;
    }
    getApiName(remote) {
        var _a;
        return remote ? (_a = this.remoteApiName) !== null && _a !== void 0 ? _a : this.tradApiName : this.tradApiName;
    }
}
exports.MatchScoreComponent = MatchScoreComponent;
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
        return new stat_table_1.NonRankStatColumn({
            color: make_tep_stats_1.TEP_GROUP_COLORS[group],
            id: this.id + (0, string_1.titleCase)(group),
            columnName: (this.columnPrefix + " " + group.toUpperCase()).trim(),
            dialogName: this.dialogName,
            titleName: `${make_tep_stats_1.TEP_GROUP_NAMES[group][0]} ${this.fullName} ${make_tep_stats_1.TEP_GROUP_NAMES[group][1]}`.trim(),
            sqlExpr: `${group}${(0, string_1.titleCase)(this.dbName)}`,
            ty: make_tep_stats_1.TEP_GROUP_DATA_TYS[group],
            getNonRankValue: this.tradOnly
                ? (d) => this.apiName in d.stats[group]
                    ? {
                        ty: make_tep_stats_1.TEP_GROUP_DATA_TYS[group],
                        val: d.stats[group][this.apiName],
                    }
                    : null
                : (d) => ({
                    ty: make_tep_stats_1.TEP_GROUP_DATA_TYS[group],
                    val: d.stats[group][this.apiName],
                }),
        });
    }
}
exports.TepComponent = TepComponent;
exports.MSStatSide = {
    This: "This",
    Opp: "Opp",
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
        var _a, _b;
        let ms = side == exports.MSStatSide.This ? "ms" : "msOpp";
        return new stat_table_1.NonRankStatColumn({
            color: side == exports.MSStatSide.This ? stat_table_1.Color.Blue : stat_table_1.Color.Red,
            id: this.id + side,
            columnName: (side == exports.MSStatSide.Opp ? "Opp " : "") + this.columnPrefix,
            dialogName: this.displayName,
            titleName: (side == exports.MSStatSide.Opp ? "Opponent " : "") + this.fullName,
            sqlExpr: (_b = (_a = this === null || this === void 0 ? void 0 : this.sql) === null || _a === void 0 ? void 0 : _a.call(this, ms)) !== null && _b !== void 0 ? _b : ms + "." + this.id,
            ty: stat_table_1.StatType.Int,
            getNonRankValue: side == exports.MSStatSide.This
                ? (d) => {
                    let val = this.getValue(d);
                    if (val == undefined)
                        return null;
                    return { ty: "int", val };
                }
                : (d) => {
                    if (!d.opponentsScore)
                        return null;
                    let val = this.getValue(d.opponentsScore);
                    if (val == undefined)
                        return null;
                    return { ty: "int", val };
                },
        });
    }
}
exports.ScoreModalComponent = ScoreModalComponent;
class DescriptorColumn {
    constructor(opts) {
        var _a;
        this.id = (_a = opts.id) !== null && _a !== void 0 ? _a : opts.name;
        this.baseName = opts.name;
        this.tradOnly = !!opts.tradOnly;
    }
    addMatchScore(opts) {
        var _a, _b, _c, _d, _e;
        this.ms = new MatchScoreComponent({
            tradOnly: this.tradOnly,
            dbColName: (_a = opts.dbColName) !== null && _a !== void 0 ? _a : this.baseName,
            apiName: (_b = opts.apiName) !== null && _b !== void 0 ? _b : this.baseName,
            remoteApiName: (_d = (_c = opts.remoteApiName) !== null && _c !== void 0 ? _c : opts.apiName) !== null && _d !== void 0 ? _d : this.baseName,
            outer: !!opts.outer,
            create: opts,
            dataTy: opts.dataTy,
            apiMap: (_e = opts.apiMap) !== null && _e !== void 0 ? _e : null,
        });
        return this;
    }
    addTep(opts) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let msName = (_b = (_a = this.ms) === null || _a === void 0 ? void 0 : _a.tradApiName) !== null && _b !== void 0 ? _b : this.baseName;
        this.tep = new TepComponent({
            tradOnly: !!this.tradOnly,
            isIndividual: !!opts.isIndividual,
            id: this.id,
            dbName: (_c = opts.dbName) !== null && _c !== void 0 ? _c : this.baseName,
            apiName: (_d = opts.apiName) !== null && _d !== void 0 ? _d : this.baseName,
            columnPrefix: opts.columnPrefix,
            dialogName: (_g = (_e = opts.dialogName) !== null && _e !== void 0 ? _e : (_f = this.scoreM) === null || _f === void 0 ? void 0 : _f.displayName) !== null && _g !== void 0 ? _g : "<ERROR>",
            fullName: opts.fullName,
            make: (_h = opts.make) !== null && _h !== void 0 ? _h : ((ms) => ms[msName]),
        });
        return this;
    }
    addScoreModal(opts) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let tradMsName = (_b = (_a = this.ms) === null || _a === void 0 ? void 0 : _a.getApiName(false)) !== null && _b !== void 0 ? _b : this.baseName;
        let remoteMsName = (_d = (_c = this.ms) === null || _c === void 0 ? void 0 : _c.getApiName(true)) !== null && _d !== void 0 ? _d : this.baseName;
        this.scoreM = new ScoreModalComponent({
            id: this.id,
            displayName: opts.displayName,
            remoteDisplayName: (_e = opts.remoteDisplayName) !== null && _e !== void 0 ? _e : opts.displayName,
            columnPrefix: opts.columnPrefix,
            fullName: opts.fullName,
            sql: opts.sql,
            getValue: (_f = opts.getValue) !== null && _f !== void 0 ? _f : ((ms) => (remoteMsName in ms ? ms[remoteMsName] : ms[tradMsName])),
            getTitle: (_g = opts.getTitle) !== null && _g !== void 0 ? _g : (() => ""),
            children: (_h = opts.children) !== null && _h !== void 0 ? _h : [],
        });
        return this;
    }
    finish() {
        return this;
    }
}
exports.DescriptorColumn = DescriptorColumn;
//# sourceMappingURL=descriptor.js.map