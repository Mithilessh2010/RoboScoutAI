import { GraphQLList, GraphQLNonNull, GraphQLNullableType, GraphQLType } from "graphql";
type Wr<T> = {
    type: T;
};
export declare function wr<T>(t: T): Wr<T>;
export declare function nn<T extends GraphQLNullableType>(ty: T): GraphQLNonNull<T>;
export declare function list<T extends GraphQLType>(ty: T): GraphQLNonNull<GraphQLList<T>>;
export declare const IntTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<number, number>>>;
export declare const FloatTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<number, number>>>;
export declare const StrTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<string, string>>>;
export declare const BoolTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<boolean, boolean>>>;
export declare const DateTimeTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<Date, Date>>>;
export declare const DateTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<Date, string>>>;
export declare function listTy<T extends GraphQLType>(ty: Wr<T>): Wr<GraphQLNonNull<GraphQLList<T>>>;
export declare function nullTy<T extends GraphQLNullableType>(ty: Wr<GraphQLNonNull<T>>): Wr<T>;
export {};
