import { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import { GQLContext } from "./context";
import { Brackets } from "typeorm";
import { AnyObject } from "../type-utils";
export declare function dataLoaderResolver<Source, Result, Key, Args = {}, LookupResult = Result>(argsToKey: (s: Source, a: Args) => Key, keysToResults: (k: Key[], i: GraphQLResolveInfo[]) => Promise<LookupResult[]>, groupResults: (k: Key[], r: LookupResult[]) => Result[]): GraphQLFieldResolver<Source, GQLContext, Args, Promise<Result>>;
export declare function dataLoaderResolverSingle<Source, Result, Key, Args = {}, LookupResult extends Result = NonNullable<Result>>(argsToKey: (s: Source, a: Args) => Key, keysToResults: (k: Key[], i: GraphQLResolveInfo[]) => Promise<LookupResult[]>, keyMatchesResult?: (k: Key, r: LookupResult) => boolean): GraphQLFieldResolver<Source, GQLContext, Args, Promise<Result>>;
export declare function dataLoaderResolverList<Source, LookupResult, Key, Args = {}>(argsToKey: (s: Source, a: Args) => Key, keysToResults: (k: Key[], i: GraphQLResolveInfo[]) => Promise<LookupResult[]>, keyMatchesResult?: (k: Key, r: LookupResult) => boolean): GraphQLFieldResolver<Source, GQLContext, Args, Promise<LookupResult[]>>;
export declare function keyListToWhereClause<T extends AnyObject>(tableName: string, keys: T[]): Brackets;
