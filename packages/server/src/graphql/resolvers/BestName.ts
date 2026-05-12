import { IntTy, nn } from "@ftc-scout/common";
import { GraphQLFieldConfig, GraphQLObjectType } from "graphql";
import { TeamGQL } from "./Team";
import { Team } from "../../db/schemas/Team";
import { BestName } from "../../db/schemas/BestName";
import { IntTy, nn } from "@ftc-scout/common";
import { GraphQLFieldConfig, GraphQLObjectType } from "graphql";
import { TeamGQL } from "./Team";
import { Team } from "../../db/schemas/Team";
import { BestName } from "../../db/schemas/BestName";

async function deleteOld() {
    try {
        await BestName.deleteMany({
            vote: -1,
            createdAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        });
    } catch (e) {
        console.error("Failed to delete old BestName entries.");
        console.error(e);
    }
}

setTimeout(deleteOld, 1000 * 5);
setInterval(deleteOld, 1000 * 60 * 60 * 24); // Once a day.

export const BestNameGQL: GraphQLObjectType = new GraphQLObjectType<BestName>({
    name: "BestName",
    fields: () => ({
        id: IntTy,
        team1: {
            type: nn(TeamGQL),
            resolve: (bestName) => bestName.team1D,
        },
        team2: {
            type: nn(TeamGQL),
            resolve: (bestName) => bestName.team2D,
        },
    }),
});

export const BestNameQueries: Record<string, GraphQLFieldConfig<any, any>> = {
    getBestName: {
        type: BestNameGQL,
        resolve: async () => {
            let teams = await Team.find({}).limit(2);
            // Shuffle using a random aggregation stage
            let teamCount = await Team.countDocuments({});
            let randomIndices = [Math.floor(Math.random() * teamCount), Math.floor(Math.random() * teamCount)];
            teams = await Team.find({}).skip(randomIndices[0]).limit(1).concat(await Team.find({}).skip(randomIndices[1]).limit(1));
            let bestName = BestName.create({
                team1: teams[0].number,
                team2: teams[1].number,
            });
            await bestName.save();
            return {
                id: bestName.id,
                team1D: teams[0],
                team2D: teams[1],
            };
        },
    },
};

export const BestNameMutations: Record<string, GraphQLFieldConfig<any, any>> = {
    voteBestName: {
        type: BestNameGQL,
        args: {
            id: IntTy,
            vote: IntTy,
        },
        resolve: async (_, { id, vote }: { id: number; vote: number }) => {
            await BestName.updateOne(
                { id, $or: [{ team1: vote }, { team2: vote }] },
                { $set: { vote } }
            );

            let teamCount = await Team.countDocuments({});
            let randomIndices = [Math.floor(Math.random() * teamCount), Math.floor(Math.random() * teamCount)];
            let teams = await Promise.all([
                Team.find({}).skip(randomIndices[0]).limit(1),
                Team.find({}).skip(randomIndices[1]).limit(1)
            ]);
            let bestName = BestName.create({
                team1: teams[0][0].number,
                team2: teams[1][0].number,
            });
            await bestName.save();
            return {
                id: bestName.id,
                team1D: teams[0][0],
                team2D: teams[1][0],
            };
        },
    },
};
