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
exports.loadAllTeams = void 0;
const common_1 = require("@ftc-scout/common");
const get_teams_1 = require("../../ftc-api/get-teams");
const Team_1 = require("../schemas/Team");
const mongodb_1 = require("../mongodb");
const DataHasBeenLoaded_1 = require("../schemas/DataHasBeenLoaded");
function loadAllTeams(season) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading teams for season ${season}.`);
        yield (0, mongodb_1.connectDB)();
        let apiTeams = yield (0, get_teams_1.getTeams)(season);
        console.info(`Fetched teams.`);
        let dbTeams = apiTeams.map(Team_1.teamFromApi).filter(common_1.notEmpty);
        console.info(`Adding teams to database.`);
        const bulkOps = dbTeams.map((team) => ({
            updateOne: {
                filter: { number: team.number },
                update: { $set: team },
                upsert: true,
            },
        }));
        if (bulkOps.length > 0) {
            yield Team_1.Team.bulkWrite(bulkOps);
        }
        yield (0, DataHasBeenLoaded_1.markDataLoaded)(season, "teams");
        console.info(`Finished loading teams.`);
    });
}
exports.loadAllTeams = loadAllTeams;
//# sourceMappingURL=load-all-teams.js.map