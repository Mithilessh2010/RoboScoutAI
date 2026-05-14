import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { GQL_SCHEMA } from "../packages/server/src/graphql/schema";
import { connectDB } from "../packages/server/src/db/mongodb";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";
import { responseCachePlugin } from "../packages/server/src/graphql/plugins/response-cache-plugin";
import { RESPONSE_CACHE_SECONDS } from "../packages/server/src/constants";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

const serverCache = new InMemoryLRUCache({
    maxSize: Math.pow(2, 20) * 100,
    ttl: 120,
});

const server = new ApolloServer({
    schema: GQL_SCHEMA,
    cache: serverCache,
    persistedQueries: {
        ttl: 120,
        cache: serverCache,
    },
    plugins: [
        ApolloServerPluginLandingPageLocalDefault({
            footer: false,
            embed: { runTelemetry: false, endpointIsEditable: false },
        }),
        ...(RESPONSE_CACHE_SECONDS > 0
            ? [responseCachePlugin(serverCache, RESPONSE_CACHE_SECONDS)]
            : []),
    ],
});

export default startServerAndCreateNextHandler(server, {
    context: async (req, res) => {
        await connectDB();
        return { req, res };
    },
});
