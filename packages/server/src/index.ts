process.setMaxListeners(0);
import "dotenv/config";
import { DATA_SOURCE } from "./db/data-source";
import { initDynamicEntities } from "./db/entities/dyn/init";
import express, { text } from "express";
import cors from "cors";
import compression from "compression";
import { apiLoggerMiddleware } from "./db/entities/ApiReq";
import { SERVER_PORT, SYNC_API } from "./constants";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@apollo/server/express4";
import { GQL_SCHEMA } from "./graphql/schema";
import { fetchPriorSeasons, watchApi } from "./ftc-api/watch";
import { setupBannerRoutes } from "./banner";
import { handleAnalytics } from "./analytics";
import { setupRest } from "./rest/setupRest";
import { setupWatchRoomRealtime } from "./watch-room/realtime";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { setupSiteMap } from "./sitemap/setupSitemap";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";
import { responseCachePlugin } from "./graphql/plugins/response-cache-plugin";

async function main() {
    await DATA_SOURCE.initialize();
    initDynamicEntities();

    let app = express();

    app.use(
        // Allow requests from our webpage.
        cors({
            // origin: "*",
            origin: true,
            credentials: false,
        }),
        compression(),
        express.json()
    );

    let httpServer = createServer(app);
    let wsServer = new WebSocketServer({ noServer: true });
    let watchRoomWsServer = setupWatchRoomRealtime();

    const serverCleanup = useServer({ schema: GQL_SCHEMA }, wsServer);

    // Create shared cache for both APQ and response caching
    const serverCache = new InMemoryLRUCache({
        maxSize: Math.pow(2, 20) * 100, // ~100MiB
        ttl: 120, // Default 2 minutes for APQ
    });

    let apolloServer = new ApolloServer({
        introspection: true,
        schema: GQL_SCHEMA,
        cache: serverCache,
        persistedQueries: {
            ttl: 120, // 2 minutes
            cache: serverCache,
        },
        plugins: [
            ApolloServerPluginLandingPageLocalDefault({
                footer: false,
                embed: { runTelemetry: false, endpointIsEditable: false },
            }),
            responseCachePlugin(serverCache),
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });

    await apolloServer.start();

    // DEBUG: Test endpoint to verify Express is working
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    app.use("/graphql", apiLoggerMiddleware, expressMiddleware(apolloServer));

    app.post("/analytics", text(), handleAnalytics);

    setupRest(app);
    setupSiteMap(app);

    setupBannerRoutes(app);

    httpServer.on("upgrade", (request, socket, head) => {
        let pathname = new URL(request.url ?? "/", "http://localhost").pathname;

        if (pathname === "/graphql") {
            wsServer.handleUpgrade(request, socket, head, (ws) => {
                wsServer.emit("connection", ws, request);
            });
            return;
        }

        if (pathname === "/watch-room") {
            watchRoomWsServer.handleUpgrade(request, socket, head, (ws) => {
                watchRoomWsServer.emit("connection", ws, request);
            });
            return;
        }

        socket.destroy();
    });

    httpServer.listen(SERVER_PORT, "0.0.0.0", () => {
        console.info(`Server started and listening on port ${SERVER_PORT}.`);
    });

    if (SYNC_API) {
        // Fire API sync in background without blocking server startup
        watchApi().catch((e) => {
            console.error("!!! ERROR IN WATCH API !!!");
            console.error(e);
        });
        fetchPriorSeasons().catch((e) => {
            console.error("!!! ERROR LOADING PRIOR SEASONS !!!");
            console.error(e);
        });
    }
}

main();
