import { type ColumnType } from "typeorm";
import { GraphQLOutputType } from "graphql";
import { Season } from "../Season";
import { Station } from "../Station";
import { NonRankStatColumn } from "../stats/stat-table";
import { TepStatGroup } from "../stats/make-tep-stats";
type RankingsMethod = {
    rp: "TotalPoints" | "Record" | "DecodeRP";
    tb: "AutoEndgameTot" | "AutoAscentAvg" | "AutoEndgameAvg" | "LosingScore" | "AvgNpBase";
};
export type Tree<T, F = never> = {
    val: T;
    for?: F;
    children: Tree<T, F>[];
};
export declare function filterMapTree<T, F, U>(t: Tree<T, F>, mapper: (_: T) => U | undefined, f?: F | undefined): Tree<U> | undefined;
export declare function filterMapTreeList<T, F, U>(ts: Tree<T, F>[], mapper: (_: T) => U | undefined, f?: F | undefined): Tree<U>[];
export declare class Descriptor {
    season: Season;
    seasonName: string;
    seasonNameWithYear: string;
    hasRemote: boolean;
    hasEndgame: boolean;
    pensSubtract: boolean;
    rankings: RankingsMethod;
    rankingPoints?: RankingPointType[];
    firstDate: Date;
    lastDate: Date;
    kickoff: Date;
    columns: DescriptorColumn[];
    columnsMap: Record<string, DescriptorColumn>;
    scoreModalTree: Tree<ScoreModalComponent>[];
    scoreModalTreeRemote: Tree<ScoreModalComponent>[];
    tepTree: Tree<TepComponent>[];
    tepTreeRemote: Tree<TepComponent>[];
    matchInsightCols: string[];
    matchInsightColsRemote: string[];
    constructor(opts: {
        season: Season;
        seasonName: string;
        hasRemote: boolean;
        hasEndgame: boolean;
        pensSubtract: boolean;
        rankings: RankingsMethod;
        rankingPoints?: RankingPointType[];
        firstDate: Date;
        lastDate: Date;
        kickoff: Date;
    });
    addColumn(col: DescriptorColumn): Descriptor;
    addTree(trad: Tree<string, "sm" | "tep">[], remote?: Tree<string, "sm" | "tep">[]): Descriptor;
    addMatchInsightCols(trad: string[], remote: string[]): Descriptor;
    finish(): Descriptor;
    msColumns(): MatchScoreComponent[];
    scoreModalColumns(): ScoreModalComponent[];
    tepColumns(): TepComponent[];
    typeSuffix(remote: boolean): "Trad" | "Remote" | "";
    getTepTree(remote: boolean): Tree<TepComponent>[];
    getSCoreModalTree(remote: boolean): Tree<ScoreModalComponent>[];
    getMatchInsightCols(remote: boolean): string[];
}
type MsCreationMethod = {
    fromApi: (api: any, oth: any) => any;
} | {
    fromSelf: (self: Record<string, any>) => any;
};
export type DescriptorDataType = {
    typeorm: {
        type: ColumnType;
        enum?: Object | any[];
        enumName?: string;
    };
    gql: GraphQLOutputType;
};
export type RankingPointType = {
    id: string;
    name: string;
};
export declare class MatchScoreComponent {
    tradOnly: boolean;
    dbColName: string;
    tradApiName: string;
    remoteApiName: string | null;
    outer: boolean;
    create: MsCreationMethod;
    dataTy: DescriptorDataType;
    apiMap: ((r: any, b: any) => any) | null;
    constructor(opts: {
        tradOnly: boolean;
        dbColName: string;
        apiName: string;
        remoteApiName: string | null;
        outer: boolean;
        create: MsCreationMethod;
        dataTy: DescriptorDataType;
        apiMap: ((r: any, b: any) => any) | null;
    });
    addSelfFromApi(api: any, other: any, dbSelf: any, apiSelf: any, remote: boolean): void;
    getApiName(remote: boolean): string;
}
export declare class TepComponent {
    tradOnly: boolean;
    isIndividual: boolean;
    id: string;
    dbName: string;
    apiName: string;
    columnPrefix: string;
    dialogName: string;
    fullName: string;
    make: (ms: Record<string, string>, station: Station) => number;
    constructor(opts: {
        tradOnly: boolean;
        isIndividual: boolean;
        id: string;
        dbName: string;
        apiName: string;
        columnPrefix: string;
        dialogName: string;
        fullName: string;
        make: (ms: Record<string, any>, station: Station) => number;
    });
    getStatColumn(group: TepStatGroup): NonRankStatColumn<any>;
}
export declare const MSStatSide: {
    readonly This: "This";
    readonly Opp: "Opp";
};
export type MSStatSide = (typeof MSStatSide)[keyof typeof MSStatSide];
export declare class ScoreModalComponent {
    id: string;
    displayName: string;
    remoteDisplayName: string;
    columnPrefix: string;
    fullName: string;
    sql: ((ms: string) => string) | undefined;
    getValue: (ms: any) => number;
    getTitle: (ms: any) => string;
    children: string[];
    constructor(opts: {
        id: string;
        displayName: string;
        remoteDisplayName: string;
        columnPrefix: string;
        fullName: string;
        sql?: ((ms: string) => string) | undefined;
        getValue: (ms: any) => number;
        getTitle: (ms: any) => string;
        children: string[];
    });
    getStatColumn(side: MSStatSide): NonRankStatColumn<any>;
}
export declare class DescriptorColumn {
    id: string;
    baseName: string;
    tradOnly: boolean;
    ms?: MatchScoreComponent;
    tep?: TepComponent;
    scoreM?: ScoreModalComponent;
    constructor(opts: {
        name: string;
        tradOnly?: boolean;
        id?: string;
    });
    addMatchScore(opts: {
        dbColName?: string;
        apiName?: string;
        remoteApiName?: string;
        outer?: boolean;
        dataTy: DescriptorDataType;
        apiMap?: (r: any, b: any) => any;
    } & MsCreationMethod): DescriptorColumn;
    addTep(opts: {
        isIndividual?: boolean;
        dbName?: string;
        apiName?: string;
        columnPrefix: string;
        dialogName?: string;
        fullName: string;
        make?: (ms: Record<string, any>, station: Station) => number;
    }): DescriptorColumn;
    addScoreModal(opts: {
        displayName: string;
        remoteDisplayName?: string;
        columnPrefix: string;
        fullName: string;
        sql?: (ms: string) => string;
        getValue?: (ms: any) => number;
        getTitle?: (ms: any) => string;
        children?: string[];
    }): DescriptorColumn;
    finish(): DescriptorColumn;
}
export {};
