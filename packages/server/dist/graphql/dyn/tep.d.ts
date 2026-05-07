import { Descriptor } from "@ftc-scout/common";
import { GraphQLObjectType } from "graphql";
import { TeamEventParticipation } from "../../db/entities/dyn/team-event-participation";
export declare function makeTepTypes(descriptor: Descriptor): GraphQLObjectType[];
export declare function addTypename(tep: TeamEventParticipation): TeamEventParticipation;
