import { Season } from "@ftc-scout/common";
import { PubSub } from "graphql-subscriptions";
export declare const pubsub: PubSub;
export declare function newMatchesKey(season: Season, code: string): string;
