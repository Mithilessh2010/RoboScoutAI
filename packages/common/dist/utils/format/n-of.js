"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nOf = void 0;
function nOf(count, name, pluralName = name + "s") {
    return `${count} ${count == 1 ? name : pluralName}`;
}
exports.nOf = nOf;
//# sourceMappingURL=n-of.js.map