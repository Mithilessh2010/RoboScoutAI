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
exports.loadFutureEvents = void 0;
const common_1 = require("@ftc-scout/common");
const Event_1 = require("../entities/Event");
const typeorm_1 = require("typeorm");
const get_teams_1 = require("../../ftc-api/get-teams");
const data_source_1 = require("../data-source");
function loadFutureEvents(season) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading future events for season ${season}.`);
        let events = yield Event_1.Event.find({
            where: { start: (0, typeorm_1.MoreThan)(new Date()) },
            select: { code: true, remote: true },
        });
        console.info(`${events.length} future events to load.`);
        for (let { code, remote } of events) {
            let teamNumbers = (yield (0, get_teams_1.getTeams)(season, code)).map((t) => t.teamNumber);
            let dbTeps = (0, common_1.calculateTeamEventStats)(season, code, remote, [], teamNumbers);
            yield data_source_1.DATA_SOURCE.createQueryBuilder()
                .insert()
                .into(`tep_${season}`)
                .values(dbTeps)
                .orIgnore()
                .execute();
        }
        console.info(`Finished loading future events.`);
    });
}
exports.loadFutureEvents = loadFutureEvents;
//# sourceMappingURL=load-future-events.js.map