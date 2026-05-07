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
const Team_1 = require("../entities/Team");
const data_source_1 = require("../data-source");
const DataHasBeenLoaded_1 = require("../entities/DataHasBeenLoaded");
function loadAllTeams(season) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading teams for season ${season}.`);
        let apiTeams = yield (0, get_teams_1.getTeams)(season);
        console.info(`Fetched teams.`);
        let dbTeams = apiTeams.map(Team_1.Team.fromApi).filter(common_1.notEmpty);
        console.info(`Adding teams to database.`);
        yield data_source_1.DATA_SOURCE.transaction((em) => __awaiter(this, void 0, void 0, function* () {
            if (season == common_1.CURRENT_SEASON) {
                yield em.save(dbTeams, { chunk: 100 });
            }
            else {
                const chunkSize = 1000;
                const chunks = [];
                for (let i = 0; i < dbTeams.length; i += chunkSize) {
                    chunks.push(dbTeams.slice(i, i + chunkSize));
                }
                for (const chunk of chunks) {
                    yield em
                        .createQueryBuilder()
                        .insert()
                        .into(Team_1.Team)
                        .values(chunk)
                        .orIgnore()
                        .execute();
                }
            }
            yield em.save(DataHasBeenLoaded_1.DataHasBeenLoaded.create({ season, teams: true }));
        }));
        console.info(`Finished loading teams.`);
    });
}
exports.loadAllTeams = loadAllTeams;
//# sourceMappingURL=load-all-teams.js.map