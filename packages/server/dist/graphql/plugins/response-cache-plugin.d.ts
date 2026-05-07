import type { ApolloServerPlugin } from "@apollo/server";
import type { KeyValueCache } from "@apollo/utils.keyvaluecache";
export declare function responseCachePlugin(cache: KeyValueCache): ApolloServerPlugin;
