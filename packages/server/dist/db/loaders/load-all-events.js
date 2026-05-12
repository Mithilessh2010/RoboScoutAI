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
const Event_1 = require("../schemas/Event");
const common_1 = require("@ftc-scout/common");
const DataHasBeenLoaded_1 = require("../schemas/DataHasBeenLoaded");
const get_events_1 = require("../../ftc-api/get-events");
const mongodb_1 = require("../mongodb");
function loadAllEvents(season) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading events for season ${season}.`);
        yield (0, mongodb_1.connectDB)();
        let apiEvents = yield (0, get_events_1.getAllEvents)(season);
        console.info(`Fetched events.`);
        let dbEvents = apiEvents.map((api) => (0, Event_1.eventFromApi)(api)).filter(common_1.notEmpty);
        console.info(`Adding events to database.`);
        const bulkOps = dbEvents.map((event) => ({
            updateOne: {
                filter: { season: event.season, code: event.code },
                update: { $set: event },
                upsert: true,
            },
        }));
        if (bulkOps.length > 0) {
            yield Event_1.Event.bulkWrite(bulkOps);
        }
        yield (0, DataHasBeenLoaded_1.markDataLoaded)(season, "events");
        console.info(`Finished loading events.`);
    });
}
exports.loadAllEvents = loadAllEvents;
//# sourceMappingURL=load-all-events.js.map