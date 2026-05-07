import { FilterOp, FilterGroupTy, StatSet } from "@ftc-scout/common";
import { GraphQLInputObjectType } from "graphql";
export declare const FilterGQL: GraphQLInputObjectType;
export declare const FilterValueGQL: GraphQLInputObjectType;
export declare const FilterCondGQL: GraphQLInputObjectType;
export declare const FilterGroupGQL: GraphQLInputObjectType;
export type TyFilterGQL = {
    cond: TyFilterCondGQL | null;
    group: TyFilterGroupGQL | null;
};
export type TyFilterValueGQL = {
    lit: number | null;
    var: string | null;
};
export type TyFilterCondGQL = {
    lhs: TyFilterValueGQL;
    op: FilterOp;
    rhs: TyFilterValueGQL;
};
export type TyFilterGroupGQL = {
    ty: FilterGroupTy;
    children: TyFilterGQL[];
};
export declare function filterGQLToSql(filter: TyFilterGQL, stats: StatSet<any>, name: (_: string) => string): string;
export declare function isFilteringOn(filter: TyFilterGQL | null, id: (id: string) => boolean): boolean;
