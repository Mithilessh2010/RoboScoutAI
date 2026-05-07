import { Tree } from "../descriptors/descriptor";
export declare const SortDir: {
    readonly Asc: "Asc";
    readonly Desc: "Desc";
};
export type SortDir = (typeof SortDir)[keyof typeof SortDir];
export declare const StatType: {
    readonly Int: "int";
    readonly Float: "float";
    readonly Rank: "rank";
    readonly String: "string";
    readonly Record: "record";
    readonly Team: "team";
    readonly Event: "event";
};
export type StatType = (typeof StatType)[keyof typeof StatType];
export type StatValue = {
    ty: "int";
    val: number;
} | {
    ty: "float";
    val: number;
} | {
    ty: "rank";
    val: number;
} | {
    ty: "string";
    val: string;
} | {
    ty: "team";
    number: number;
    name: string;
} | {
    ty: "event";
    season: number;
    code: string;
    name: string;
    start: string;
    end: string;
} | {
    ty: "record";
    wins: number;
    losses: number;
    ties: number;
};
export declare const Color: {
    readonly White: "white";
    readonly Red: "red";
    readonly Blue: "blue";
    readonly LightBlue: "light-blue";
    readonly Green: "green";
    readonly Purple: "purple";
};
export type Color = (typeof Color)[keyof typeof Color];
export declare class StatColumn<T> {
    id: string;
    columnName: string;
    dialogName: string;
    titleName: string;
    color: Color;
    ty: StatType;
    getValue: (_: StatData<T>) => StatValue | null;
    getValueDistilled(d: StatData<T>): string | number | null;
    static distill(val: StatValue | null): number | string | null;
    constructor(opts: {
        id: string;
        columnName: string;
        dialogName: string;
        titleName: string;
        color: Color;
        ty: StatType;
        getValue: (_: StatData<T>) => StatValue | null;
    });
    shouldExpand(): boolean;
}
export declare class NonRankStatColumn<T> extends StatColumn<T> {
    getNonRankValue: (_: T) => StatValue | null;
    getNonRankValueDistilled(d: T): string | number | null;
    sqlExpr: string;
    constructor(opts: {
        id: string;
        columnName: string;
        dialogName: string;
        titleName: string;
        sqlExpr: string;
        color: Color;
        ty: StatType;
        getNonRankValue: (_: T) => StatValue | null;
    });
}
export type StatData<T> = {
    noFilterRank: number;
    filterRank: number;
    noFilterSkipRank: number;
    filterSkipRank: number;
    data: T;
};
export declare const RankTy: {
    readonly NoFilter: "NoFilter";
    readonly Filter: "Filter";
    readonly NoFilterSkip: "NoFilterSkip";
    readonly FilterSkip: "FilterSkip";
};
export type RankTy = (typeof RankTy)[keyof typeof RankTy];
export declare const RANK_STATS: {
    NoFilter: StatColumn<any>;
    Filter: StatColumn<any>;
    NoFilterSkip: StatColumn<any>;
    FilterSkip: StatColumn<any>;
};
export type StatSectionColumn = {
    id: string;
    name: string;
    color: Color;
    description: string | null;
};
export type StatSectionRow = {
    id: string;
    name: string;
};
export declare class StatSetSection {
    name: string;
    rows: Tree<StatSectionRow>[];
    columns: StatSectionColumn[];
    constructor(name: string, rows: Tree<StatSectionRow>[], columns: StatSectionColumn[]);
    getId(rowId: string, columnId: string): string;
    getRowId(row: string): string;
}
export declare class StatSet<T> {
    id: string;
    allStats: NonRankStatColumn<T>[];
    sections: StatSetSection[];
    private allStatsRecord;
    constructor(id: string, allStats: NonRankStatColumn<T>[], sections: StatSetSection[]);
    getStat(id: string): NonRankStatColumn<T>;
}
