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
exports.loadAllEvents = void 0;
const data_source_1 = require("../data-source");
const Event_1 = require("../../db/entities/Event");
const common_1 = require("@ftc-scout/common");
const DataHasBeenLoaded_1 = require("../entities/DataHasBeenLoaded");
const get_events_1 = require("../../ftc-api/get-events");
function loadAllEvents(season) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading events for season ${season}.`);
        let apiEvents = yield (0, get_events_1.getAllEvents)(season);
        console.info(`Fetched events.`);
        let dbEvents = apiEvents.map((api) => Event_1.Event.fromApi(api, season)).filter(common_1.notEmpty);
        console.info(`Adding events to database.`);
        yield data_source_1.DATA_SOURCE.transaction((em) => __awaiter(this, void 0, void 0, function* () {
            yield em.save(dbEvents, { chunk: 100 });
            yield em.save(DataHasBeenLoaded_1.DataHasBeenLoaded.create({ season, events: true }));
        }));
        console.info(`Finished loading events.`);
    });
}
exports.loadAllEvents = loadAllEvents;
//# sourceMappingURL=load-all-events.js.map