"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimFilter = exports.trimFilterGroup = exports.countChildrenForSidebar = exports.fullChildCount = exports.emptyFiler = exports.emptyCondition = exports.emptyGroup = exports.FilterGroupTy = exports.FILTER_OP_SYMBOLS = exports.ALL_OPS = exports.FilterOp = exports.getFilterId = void 0;
const filter_1 = require("../../utils/filter");
let i = 0;
function getFilterId() {
    return i++;
}
exports.getFilterId = getFilterId;
exports.FilterOp = {
    Eq: "Eq",
    Neq: "Neq",
    Gt: "Gt",
    Gte: "Gte",
    Lt: "Lt",
    Lte: "Lte",
};
exports.ALL_OPS = [
    exports.FilterOp.Eq,
    exports.FilterOp.Neq,
    exports.FilterOp.Gt,
    exports.FilterOp.Gte,
    exports.FilterOp.Lt,
    exports.FilterOp.Lte,
];
exports.FILTER_OP_SYMBOLS = {
    [exports.FilterOp.Eq]: "=",
    [exports.FilterOp.Neq]: "≠",
    [exports.FilterOp.Gt]: ">",
    [exports.FilterOp.Gte]: "≥",
    [exports.FilterOp.Lt]: "<",
    [exports.FilterOp.Lte]: "≤",
};
exports.FilterGroupTy = {
    And: "and",
    Or: "or",
};
function emptyGroup() {
    return {
        ty: "group",
        id: getFilterId(),
        group: { ty: "and", children: [] },
    };
}
exports.emptyGroup = emptyGroup;
function emptyCondition() {
    return {
        ty: "cond",
        id: getFilterId(),
        cond: {
            lhs: { ty: "lit", lit: null },
            op: exports.FilterOp.Eq,
            rhs: { ty: "lit", lit: null },
        },
    };
}
exports.emptyCondition = emptyCondition;
function emptyFiler() {
    return {
        ty: "and",
        children: [emptyCondition()],
    };
}
exports.emptyFiler = emptyFiler;
function fullChildCount(group) {
    let tot = 0;
    for (let child of group.children) {
        if (child.ty == "cond") {
            tot += 1;
        }
        else {
            tot += 1 + fullChildCount(child.group);
        }
    }
    return tot;
}
exports.fullChildCount = fullChildCount;
function countChildrenForSidebar(group) {
    let tot = 0;
    for (let i = 0; i < group.children.length; i++) {
        let child = group.children[i];
        if (child.ty == "cond" || i == group.children.length - 1) {
            tot += 1;
        }
        else {
            tot += 1 + fullChildCount(child.group);
        }
    }
    return tot;
}
exports.countChildrenForSidebar = countChildrenForSidebar;
function trimFilterGroup(group) {
    let newChildren = group.children.map((c) => trimFilter(c)).filter(filter_1.notEmpty);
    return newChildren.length == 0 ? null : { ty: group.ty, children: newChildren };
}
exports.trimFilterGroup = trimFilterGroup;
function trimFilter(filter) {
    if (filter.ty == "group") {
        let group = trimFilterGroup(filter.group);
        return group
            ? {
                ty: "group",
                id: getFilterId(),
                group,
            }
            : null;
    }
    else {
        if (filter.cond.lhs.ty == "lit" && filter.cond.lhs.lit == null)
            return null;
        if (filter.cond.rhs.ty == "lit" && filter.cond.rhs.lit == null)
            return null;
        return filter;
    }
}
exports.trimFilter = trimFilter;
//# sourceMappingURL=filter.js.map