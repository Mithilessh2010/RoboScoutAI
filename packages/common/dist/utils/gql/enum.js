"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGQLEnum = void 0;
const graphql_1 = require("graphql");
function makeGQLEnum(e, name) {
    let values = {};
    for (let [k, v] of Object.entries(e)) {
        values[k] = { value: v };
    }
    return new graphql_1.GraphQLEnumType({
        name,
        values,
    });
}
exports.makeGQLEnum = makeGQLEnum;
//# sourceMappingURL=enum.js.map