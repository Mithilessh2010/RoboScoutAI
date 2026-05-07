"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBySingle = exports.groupBy = exports.notEmpty = void 0;
function notEmpty(value) {
    return value !== null && value !== undefined;
}
exports.notEmpty = notEmpty;
function groupBy(arr, f) {
    var _a;
    let ret = {};
    for (let i of arr) {
        let k = f(i);
        ret[k] = (_a = ret[k]) !== null && _a !== void 0 ? _a : [];
        ret[k].push(i);
    }
    return ret;
}
exports.groupBy = groupBy;
function groupBySingle(arr, f) {
    let ret = {};
    for (let i of arr) {
        let k = f(i);
        ret[k] = i;
    }
    return ret;
}
exports.groupBySingle = groupBySingle;
//# sourceMappingURL=filter.js.map