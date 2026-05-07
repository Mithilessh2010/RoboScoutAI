"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newMatchesKey = exports.pubsub = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
exports.pubsub = new graphql_subscriptions_1.PubSub();
function newMatchesKey(season, code) {
    return `NEW_MATCHES-${season}-${code}`;
}
exports.newMatchesKey = newMatchesKey;
//# sourceMappingURL=pubsub.js.map