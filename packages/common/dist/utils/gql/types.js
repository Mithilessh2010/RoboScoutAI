"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nullTy = exports.listTy = exports.DateTy = exports.DateTimeTy = exports.BoolTy = exports.StrTy = exports.FloatTy = exports.IntTy = exports.list = exports.nn = exports.wr = void 0;
const graphql_1 = require("graphql");
const graphql_scalars_1 = require("graphql-scalars");
function wr(t) {
    return { type: t };
}
exports.wr = wr;
function nn(ty) {
    return new graphql_1.GraphQLNonNull(ty);
}
exports.nn = nn;
function list(ty) {
    return nn(new graphql_1.GraphQLList(ty));
}
exports.list = list;
exports.IntTy = wr(nn(graphql_1.GraphQLInt));
exports.FloatTy = wr(nn(graphql_1.GraphQLFloat));
exports.StrTy = wr(nn(graphql_1.GraphQLString));
exports.BoolTy = wr(nn(graphql_1.GraphQLBoolean));
exports.DateTimeTy = wr(nn(graphql_scalars_1.GraphQLDateTime));
exports.DateTy = wr(nn(graphql_scalars_1.GraphQLDate));
function listTy(ty) {
    return wr(list(ty.type));
}
exports.listTy = listTy;
function nullTy(ty) {
    return wr(ty.type.ofType);
}
exports.nullTy = nullTy;
//# sourceMappingURL=types.js.map