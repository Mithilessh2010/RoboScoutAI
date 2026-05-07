export type Filter = {
    ty: "group";
    id?: number;
    group: FilterGroup;
} | {
    ty: "cond";
    id?: number;
    cond: FilterCondition;
};
export declare function getFilterId(): number;
export type FilterVal = {
    ty: "lit";
    lit: number | null;
} | {
    ty: "var";
    id: string;
};
export declare const FilterOp: {
    readonly Eq: "Eq";
    readonly Neq: "Neq";
    readonly Gt: "Gt";
    readonly Gte: "Gte";
    readonly Lt: "Lt";
    readonly Lte: "Lte";
};
export type FilterOp = (typeof FilterOp)[keyof typeof FilterOp];
export declare const ALL_OPS: ("Eq" | "Neq" | "Gt" | "Gte" | "Lt" | "Lte")[];
export declare const FILTER_OP_SYMBOLS: {
    readonly Eq: "=";
    readonly Neq: "≠";
    readonly Gt: ">";
    readonly Gte: "≥";
    readonly Lt: "<";
    readonly Lte: "≤";
};
export type FilterCondition = {
    lhs: FilterVal;
    op: FilterOp;
    rhs: FilterVal;
};
export declare const FilterGroupTy: {
    readonly And: "and";
    readonly Or: "or";
};
export type FilterGroupTy = (typeof FilterGroupTy)[keyof typeof FilterGroupTy];
export type FilterGroup = {
    ty: FilterGroupTy;
    children: Filter[];
};
export declare function emptyGroup(): Filter;
export declare function emptyCondition(): Filter;
export declare function emptyFiler(): FilterGroup;
export declare function fullChildCount(group: FilterGroup): number;
export declare function countChildrenForSidebar(group: FilterGroup): number;
export declare function trimFilterGroup(group: FilterGroup): FilterGroup | null;
export declare function trimFilter(filter: Filter): Filter | null;
