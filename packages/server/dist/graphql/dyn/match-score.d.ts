import { Descriptor } from "@ftc-scout/common";
import { GraphQLObjectType } from "graphql";
import { MatchScore } from "../../db/entities/dyn/match-score";
import { AnyObject } from "../../type-utils";
export declare function makeMatchScoreTys(descriptor: Descriptor): GraphQLObjectType[];
export declare function frontendMSFromDB(ms: MatchScore[]): AnyObject | null;
