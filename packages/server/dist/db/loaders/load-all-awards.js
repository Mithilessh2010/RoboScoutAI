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
exports.loadAllAwards = void 0;
const common_1 = require("@ftc-scout/common");
const DataHasBeenLoaded_1 = require("../entities/DataHasBeenLoaded");
const Event_1 = require("../entities/Event");
const data_source_1 = require("../data-source");
const get_event_awards_1 = require("../../ftc-api/get-event-awards");
const Award_1 = require("../entities/Award");
const watch_1 = require("../../ftc-api/watch");
function loadAllAwards(season, loadType) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Loading awards for season ${season}. (${loadType})`);
        let events = yield eventsToFetch(season, loadType);
        console.info(`Got ${events.length} events to fetch.`);
        const chunkSize = 25;
        for (let i = 0; i < events.length; i += chunkSize) {
            console.info(`Starting chunk starting at ${i}.`);
            console.info("Fetching from api.");
            let chunk = events.slice(i, i + chunkSize);
            let apiAwards = yield Promise.all(chunk.map((e) => (0, get_event_awards_1.getEventAwards)(season, e.code)));
            apiAwards.forEach(fixJudgesChoice);
            let dbAwards = apiAwards
                .flat()
                .map((a) => Award_1.Award.fromApi(season, a))
                .filter(common_1.notEmpty);
            yield Award_1.Award.save(dbAwards, { chunk: 100 });
            console.info(`Loaded ${Math.min(i + chunkSize, events.length) + 1}/${events.length}.`);
        }
        yield DataHasBeenLoaded_1.DataHasBeenLoaded.create({
            season,
            awards: true,
        }).save();
        console.info(`Finished loading awards.`);
    });
}
exports.loadAllAwards = loadAllAwards;
function fixJudgesChoice(awards) {
    let hasZeroJudgesChoice = awards.some((a) => a.name == "Judges' Choice Award" && a.series == 0);
    if (hasZeroJudgesChoice) {
        awards.forEach((a) => {
            if (a.name == "Judges' Choice Award")
                a.series++;
        });
    }
}
function eventsToFetch(season, loadType) {
    return __awaiter(this, void 0, void 0, function* () {
        let loaded = yield DataHasBeenLoaded_1.DataHasBeenLoaded.awardsHaveBeenLoaded(season);
        if (loaded) {
            let query = data_source_1.DATA_SOURCE.getRepository(Event_1.Event)
                .createQueryBuilder("e")
                .select(["e.season", "e.code"])
                .where("season = :season", { season });
            if (loadType == watch_1.LoadType.Full) {
                query
                    .andWhere("start < now()")
                    .andWhere("start > 'now'::timestamp - '7 days'::interval");
            }
            else {
                query
                    .andWhere("start <= (NOW() at time zone timezone)::date")
                    .andWhere(`"end" >= (NOW() at time zone timezone)::date`);
            }
            return query.getMany();
        }
        else {
            return Event_1.Event.findBy({ season });
        }
    });
}
//# sourceMappingURL=load-all-awards.js.map