"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationGQL = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
exports.LocationGQL = new graphql_1.GraphQLObjectType({
    name: "Location",
    fields: {
        venue: (0, common_1.nullTy)(common_1.StrTy),
        city: common_1.StrTy,
        state: common_1.StrTy,
        country: common_1.StrTy,
    },
});
//# sourceMappingURL=Location.js.map