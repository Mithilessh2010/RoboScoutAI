"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GQL_SCHEMA = void 0;
const graphql_1 = require("graphql");
const Team_1 = require("./resolvers/Team");
const Event_1 = require("./resolvers/Event");
const Records_1 = require("./resolvers/records/Records");
const Home_1 = require("./resolvers/Home");
const BestName_1 = require("./resolvers/BestName");
const query = new graphql_1.GraphQLObjectType({
    name: "Query",
    fields: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, Team_1.TeamQueries), Event_1.EventQueries), Records_1.RecordQueries), Home_1.HomeQueries), BestName_1.BestNameQueries),
});
const mutation = new graphql_1.GraphQLObjectType({
    name: "Mutation",
    fields: Object.assign({}, BestName_1.BestNameMutations),
});
const subscription = new graphql_1.GraphQLObjectType({
    name: "Subscription",
    fields: Object.assign({}, Event_1.EventSubscriptions),
});
exports.GQL_SCHEMA = new graphql_1.GraphQLSchema({
    query,
    mutation,
    subscription,
});
//# sourceMappingURL=schema.js.map