import { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { Award } from "../../db/entities/Award";
import { FindOptionsWhere } from "typeorm";
export declare const AwardGQL: GraphQLObjectType;
export declare function teamAwareAwardLoader<K extends FindOptionsWhere<Award>>(keys: K[], info: GraphQLResolveInfo[]): Promise<Award[]>;
