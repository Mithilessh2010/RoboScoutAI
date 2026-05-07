"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyDTy = exports.EnumDTy = exports.BoolDTy = exports.Int16DTy = exports.nullTy = exports.listTy = exports.BoolTy = exports.StrTy = exports.IntTy = exports.list = exports.nn = void 0;
const graphql_1 = require("graphql");
const enum_1 = require("../../utils/gql/enum");
function wr(t) {
    return { type: t };
}
function nn(ty) {
    return new graphql_1.GraphQLNonNull(ty);
}
exports.nn = nn;
function list(ty) {
    return nn(new graphql_1.GraphQLList(ty));
}
exports.list = list;
exports.IntTy = wr(nn(graphql_1.GraphQLInt));
exports.StrTy = wr(nn(graphql_1.GraphQLString));
exports.BoolTy = wr(nn(graphql_1.GraphQLBoolean));
function listTy(ty) {
    return wr(list(ty.type));
}
exports.listTy = listTy;
function nullTy(ty) {
    return wr(ty.type.ofType);
}
exports.nullTy = nullTy;
exports.Int16DTy = {
    typeorm: { type: "smallint" },
    gql: graphql_1.GraphQLInt,
};
exports.BoolDTy = {
    typeorm: { type: "bool" },
    gql: graphql_1.GraphQLBoolean,
};
function EnumDTy(obj, name, dbName) {
    return {
        typeorm: {
            type: "enum",
            enum: obj,
            enumName: dbName,
        },
        gql: (0, enum_1.makeGQLEnum)(obj, name),
    };
}
exports.EnumDTy = EnumDTy;
function AnyDTy(gql) {
    return {
        typeorm: { type: "json" },
        gql,
    };
}
exports.AnyDTy = AnyDTy;
//# sourceMappingURL=types.js.map