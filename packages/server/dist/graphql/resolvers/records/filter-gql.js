"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFilteringOn = exports.filterGQLToSql = exports.FilterGroupGQL = exports.FilterCondGQL = exports.FilterValueGQL = exports.FilterGQL = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
const enums_1 = require("../enums");
exports.FilterGQL = new graphql_1.GraphQLInputObjectType({
    name: "Filter",
    fields: () => ({
        group: { type: exports.FilterGroupGQL },
        cond: { type: exports.FilterCondGQL },
    }),
});
exports.FilterValueGQL = new graphql_1.GraphQLInputObjectType({
    name: "FilterValue",
    fields: {
        lit: (0, common_1.nullTy)(common_1.IntTy),
        var: (0, common_1.nullTy)(common_1.StrTy),
    },
});
exports.FilterCondGQL = new graphql_1.GraphQLInputObjectType({
    name: "FilterCond",
    fields: {
        lhs: { type: (0, common_1.nn)(exports.FilterValueGQL) },
        op: { type: (0, common_1.nn)(enums_1.FilterOpGQL) },
        rhs: { type: (0, common_1.nn)(exports.FilterValueGQL) },
    },
});
exports.FilterGroupGQL = new graphql_1.GraphQLInputObjectType({
    name: "FilterGroup",
    fields: () => ({
        ty: { type: (0, common_1.nn)(enums_1.FilterGroupTyGQL) },
        children: (0, common_1.listTy)((0, common_1.wr)((0, common_1.nn)(exports.FilterGQL))),
    }),
});
function filterGQLToSql(filter, stats, name) {
    if (filter.cond == null && filter.group != null) {
        return filterGroupToSQL(filter.group, stats, name);
    }
    else if (filter.group == null && filter.cond != null) {
        return filterCondToSQL(filter.cond, stats, name);
    }
    else if (filter.group != null && filter.cond != null) {
        let g = filterGroupToSQL(filter.group, stats, name);
        let c = filterCondToSQL(filter.cond, stats, name);
        return `(${g} and ${c})`;
    }
    else {
        return "true";
    }
}
exports.filterGQLToSql = filterGQLToSql;
function filterGroupToSQL(group, stats, name) {
    let baseCase = group.ty == common_1.FilterGroupTy.And ? "true" : "false";
    let sql = "(" + baseCase;
    for (let child of group.children) {
        sql += " " + group.ty + " " + filterGQLToSql(child, stats, name);
    }
    return sql + ")";
}
function filterCondToSQL(cond, stats, name) {
    let lhs = filterValToSQL(cond.lhs, stats, name);
    let rhs = filterValToSQL(cond.rhs, stats, name);
    let op = opToSQL(cond.op);
    return `(${lhs} ${op} ${rhs})`;
}
function opToSQL(op) {
    switch (op) {
        case "Eq":
            return "=";
        case "Neq":
            return "<>";
        case "Gt":
            return ">";
        case "Gte":
            return ">=";
        case "Lt":
            return "<";
        case "Lte":
            return "<=";
    }
}
function filterValToSQL(val, stats, name) {
    var _a, _b;
    if (val.lit) {
        return val.lit + "";
    }
    else if (val.var) {
        let ty = stats.getStat(val.var).ty;
        if (ty == "event") {
            return "null";
        }
        else {
            let sql = (_b = (_a = stats.getStat(val.var)) === null || _a === void 0 ? void 0 : _a.sqlExpr) !== null && _b !== void 0 ? _b : null;
            if (!sql) {
                return "0";
            }
            else if (sql.includes(".")) {
                let [s, e] = sql.split(".");
                return s + "." + name(e);
            }
            else {
                return name(sql);
            }
        }
    }
    else {
        return "0";
    }
}
function isFilteringOn(filter, id) {
    return ((!!(filter === null || filter === void 0 ? void 0 : filter.cond) && isFilteringOnCond(filter.cond, id)) ||
        (!!(filter === null || filter === void 0 ? void 0 : filter.group) && isFilterOnGroup(filter.group, id)));
}
exports.isFilteringOn = isFilteringOn;
function isFilterOnGroup(group, id) {
    for (let child of group.children) {
        if (isFilteringOn(child, id))
            return true;
    }
    return false;
}
function isFilteringOnCond(cond, id) {
    return isFilteringOnVal(cond.lhs, id) || isFilteringOnVal(cond.rhs, id);
}
function isFilteringOnVal(val, id) {
    return !!val.var && id(val.var);
}
//# sourceMappingURL=filter-gql.js.map