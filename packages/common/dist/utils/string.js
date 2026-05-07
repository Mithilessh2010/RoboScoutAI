"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.longestCommonPrefix = exports.titleCase = void 0;
function titleCase(s) {
    var _a, _b;
    return ((_b = (_a = s[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) !== null && _b !== void 0 ? _b : "") + s.substring(1);
}
exports.titleCase = titleCase;
function longestCommonPrefix(words) {
    if (!words[0] || words.length == 1)
        return words[0] || "";
    let i = 0;
    while (words[0][i] && words.every((w) => w[i] === words[0][i]))
        i++;
    return words[0].slice(0, i);
}
exports.longestCommonPrefix = longestCommonPrefix;
//# sourceMappingURL=string.js.map