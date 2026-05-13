"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BestNameMutations = exports.BestNameQueries = exports.BestNameGQL = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
const Team_1 = require("./Team");
const Team_2 = require("../../db/schemas/Team");
const BestName_1 = require("../../db/schemas/BestName");
function deleteOld() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield BestName_1.BestName.deleteMany({
                vote: -1,
                createdAt: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
            });
        }
        catch (e) {
            console.error("Failed to delete old BestName entries.");
            console.error(e);
        }
    });
}
setTimeout(deleteOld, 1000 * 5);
setInterval(deleteOld, 1000 * 60 * 60 * 24);
exports.BestNameGQL = new graphql_1.GraphQLObjectType({
    name: "BestName",
    fields: () => ({
        id: common_1.IntTy,
        team1: {
            type: (0, common_1.nn)(Team_1.TeamGQL),
            resolve: (bestName) => bestName.team1D,
        },
        team2: {
            type: (0, common_1.nn)(Team_1.TeamGQL),
            resolve: (bestName) => bestName.team2D,
        },
    }),
});
exports.BestNameQueries = {
    getBestName: {
        type: exports.BestNameGQL,
        resolve: () => __awaiter(void 0, void 0, void 0, function* () {
            let teamCount = yield Team_2.Team.countDocuments({});
            if (teamCount < 2) {
                throw new Error("Need at least two teams to create a BestName prompt.");
            }
            let randomIndices = [
                Math.floor(Math.random() * teamCount),
                Math.floor(Math.random() * teamCount),
            ];
            let teams = yield Promise.all(randomIndices.map((index) => Team_2.Team.findOne().skip(index)));
            if (!teams[0] || !teams[1]) {
                throw new Error("Failed to select two random teams.");
            }
            let bestName = yield BestName_1.BestName.create({
                id: Date.now(),
                team1: teams[0].number,
                team2: teams[1].number,
            });
            return {
                id: bestName.id,
                team1D: teams[0],
                team2D: teams[1],
            };
        }),
    },
};
exports.BestNameMutations = {
    voteBestName: {
        type: exports.BestNameGQL,
        args: {
            id: common_1.IntTy,
            vote: common_1.IntTy,
        },
        resolve: (_, { id, vote }) => __awaiter(void 0, void 0, void 0, function* () {
            yield BestName_1.BestName.updateOne({ id }, { $set: { vote } });
            let teamCount = yield Team_2.Team.countDocuments({});
            let randomIndices = [
                Math.floor(Math.random() * teamCount),
                Math.floor(Math.random() * teamCount),
            ];
            let teams = yield Promise.all([
                Team_2.Team.findOne().skip(randomIndices[0]),
                Team_2.Team.findOne().skip(randomIndices[1]),
            ]);
            if (!teams[0] || !teams[1]) {
                throw new Error("Failed to select two random teams.");
            }
            let bestName = yield BestName_1.BestName.create({
                id: Date.now(),
                team1: teams[0].number,
                team2: teams[1].number,
            });
            return {
                id: bestName.id,
                team1D: teams[0],
                team2D: teams[1],
            };
        }),
    },
};
//# sourceMappingURL=BestName.js.map