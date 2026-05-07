import { GraphQLList, GraphQLNonNull, GraphQLNullableType, GraphQLOutputType, GraphQLType } from "graphql";
import { DescriptorDataType } from "./descriptor";
type Wr<T> = {
    type: T;
};
export declare function nn<T extends GraphQLNullableType>(ty: T): GraphQLNonNull<T>;
export declare function list<T extends GraphQLType>(ty: T): GraphQLNonNull<GraphQLList<T>>;
export declare const IntTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<number, number>>>;
export declare const StrTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<string, string>>>;
export declare const BoolTy: Wr<GraphQLNonNull<import("graphql").GraphQLScalarType<boolean, boolean>>>;
export declare function listTy<T extends GraphQLType>(ty: Wr<T>): Wr<GraphQLNonNull<GraphQLList<T>>>;
export declare function nullTy<T extends GraphQLNullableType>(ty: Wr<GraphQLNonNull<T>>): Wr<T>;
export declare const Int16DTy: DescriptorDataType;
export declare const BoolDTy: DescriptorDataType;
export declare function EnumDTy(obj: Record<string, string>, name: string, dbName: string): DescriptorDataType;
export declare function AnyDTy(gql: GraphQLOutputType): DescriptorDataType;
export {};
