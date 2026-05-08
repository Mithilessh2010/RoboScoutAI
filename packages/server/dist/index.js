"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.setMaxListeners(0);
require("dotenv/config");
const data_source_1 = require("./db/data-source");
const init_1 = require("./db/entities/dyn/init");
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const ApiReq_1 = require("./db/entities/ApiReq");
const constants_1 = require("./constants");
const server_1 = require("@apollo/server");
const default_1 = require("@apollo/server/plugin/landingPage/default");
const express4_1 = require("@apollo/server/express4");
const schema_1 = require("./graphql/schema");
const watch_1 = require("./ftc-api/watch");
const banner_1 = require("./banner");
const analytics_1 = require("./analytics");
const setupRest_1 = require("./rest/setupRest");
const http_1 = require("http");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const setupSitemap_1 = require("./sitemap/setupSitemap");
const utils_keyvaluecache_1 = require("@apollo/utils.keyvaluecache");
const response_cache_plugin_1 = require("./graphql/plugins/response-cache-plugin");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield data_source_1.DATA_SOURCE.initialize();
        (0, init_1.initDynamicEntities)();
        let app = (0, express_1.default)();
        app.use((0, cors_1.default)({
            origin: true,
            credentials: false,
        }), (0, compression_1.default)(), express_1.default.json());
        let httpServer = (0, http_1.createServer)(app);
        let wsServer = new ws_1.WebSocketServer({
            server: httpServer,
            path: "/graphql",
        });
        const serverCleanup = (0, ws_2.useServer)({ schema: schema_1.GQL_SCHEMA }, wsServer);
        const serverCache = new utils_keyvaluecache_1.InMemoryLRUCache({
            maxSize: Math.pow(2, 20) * 100,
            ttl: 120,
        });
        let apolloServer = new server_1.ApolloServer({
            introspection: true,
            schema: schema_1.GQL_SCHEMA,
            cache: serverCache,
            persistedQueries: {
                ttl: 120,
                cache: serverCache,
            },
            plugins: [
                (0, default_1.ApolloServerPluginLandingPageLocalDefault)({
                    footer: false,
                    embed: { runTelemetry: false, endpointIsEditable: false },
                }),
                (0, response_cache_plugin_1.responseCachePlugin)(serverCache),
                (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
                {
                    serverWillStart() {
                        return __awaiter(this, void 0, void 0, function* () {
                            return {
                                drainServer() {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        yield serverCleanup.dispose();
                                    });
                                },
                            };
                        });
                    },
                },
            ],
        });
        yield apolloServer.start();
        app.get("/health", (_req, res) => {
            res.json({ status: "ok" });
        });
        app.use("/graphql", ApiReq_1.apiLoggerMiddleware, (0, express4_1.expressMiddleware)(apolloServer));
        app.post("/analytics", (0, express_1.text)(), analytics_1.handleAnalytics);
        (0, setupRest_1.setupRest)(app);
        (0, setupSitemap_1.setupSiteMap)(app);
        (0, banner_1.setupBannerRoutes)(app);
        httpServer.listen(constants_1.SERVER_PORT, "0.0.0.0", () => {
            console.info(`Server started and listening on port ${constants_1.SERVER_PORT}.`);
        });
        if (constants_1.SYNC_API) {
            (0, watch_1.watchApi)().catch((e) => {
                console.error("!!! ERROR IN WATCH API !!!");
                console.error(e);
            });
            (0, watch_1.fetchPriorSeasons)().catch((e) => {
                console.error("!!! ERROR LOADING PRIOR SEASONS !!!");
                console.error(e);
            });
        }
    });
}
main();
//# sourceMappingURL=index.js.map