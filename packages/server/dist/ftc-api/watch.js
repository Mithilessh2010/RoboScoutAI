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
exports.watchApi = exports.fetchPriorSeasons = exports.LoadType = void 0;
const common_1 = require("@ftc-scout/common");
const DataHasBeenLoaded_1 = require("../db/schemas/DataHasBeenLoaded");
const load_all_teams_1 = require("../db/loaders/load-all-teams");
const load_all_events_1 = require("../db/loaders/load-all-events");
const load_all_matches_1 = require("../db/loaders/load-all-matches");
const load_all_awards_1 = require("../db/loaders/load-all-awards");
const load_future_events_1 = require("../db/loaders/load-future-events");
exports.LoadType = {
    Full: "Full",
    Partial: "Partial",
};
function fetchPriorSeasons() {
    return __awaiter(this, void 0, void 0, function* () {
        for (let season of common_1.PAST_SEASONS) {
            console.info(`Checking load of season ${season}.`);
            let data = yield (0, DataHasBeenLoaded_1.checkDataLoaded)(season);
            if (!data.teams) {
                yield (0, load_all_teams_1.loadAllTeams)(season);
            }
            else {
                console.info(`Teams already loaded.`);
            }
            if (!data.events) {
                yield (0, load_all_events_1.loadAllEvents)(season);
            }
            else {
                console.info(`Events already loaded.`);
            }
            if (!data.matches) {
                yield (0, load_all_matches_1.loadAllMatches)(season, exports.LoadType.Full);
            }
            else {
                console.info(`Matches already loaded.`);
            }
            if (!data.awards) {
                yield (0, load_all_awards_1.loadAllAwards)(season, exports.LoadType.Full);
            }
            else {
                console.info(`Awards already loaded.`);
            }
        }
    });
}
exports.fetchPriorSeasons = fetchPriorSeasons;
function watchApi() {
    return __awaiter(this, void 0, void 0, function* () {
        let cycleCount = 0;
        const runJob = (fn, interval) => __awaiter(this, void 0, void 0, function* () {
            if (cycleCount % interval == 0) {
                try {
                    yield fn();
                }
                catch (e) {
                    console.error("!!! ERROR LOADING DATA !!!");
                    console.error(e);
                }
            }
        });
        const MS_PER_MIN = 60 * 1000;
        const MINS_PER_HOUR = 60;
        const MINS_PER_DAY = MINS_PER_HOUR * 24;
        const run = () => __awaiter(this, void 0, void 0, function* () {
            console.info(`Syncing. (Cycle ${cycleCount})`);
            yield runJob(() => __awaiter(this, void 0, void 0, function* () { return yield (0, load_all_teams_1.loadAllTeams)(common_1.CURRENT_SEASON); }), MINS_PER_DAY);
            yield runJob(() => __awaiter(this, void 0, void 0, function* () { return yield (0, load_all_events_1.loadAllEvents)(common_1.CURRENT_SEASON); }), MINS_PER_HOUR);
            yield runJob(() => __awaiter(this, void 0, void 0, function* () { return yield (0, load_all_matches_1.loadAllMatches)(common_1.CURRENT_SEASON, exports.LoadType.Partial); }), 1);
            yield runJob(() => __awaiter(this, void 0, void 0, function* () { return yield (0, load_all_matches_1.loadAllMatches)(common_1.CURRENT_SEASON, exports.LoadType.Full); }), MINS_PER_DAY);
            yield runJob(() => __awaiter(this, void 0, void 0, function* () { return yield (0, load_all_awards_1.loadAllAwards)(common_1.CURRENT_SEASON, exports.LoadType.Partial); }), 5);
            yield runJob(() => __awaiter(this, void 0, void 0, function* () { return yield (0, load_all_awards_1.loadAllAwards)(common_1.CURRENT_SEASON, exports.LoadType.Full); }), MINS_PER_HOUR);
            yield runJob(() => __awaiter(this, void 0, void 0, function* () { return yield (0, load_future_events_1.loadFutureEvents)(common_1.CURRENT_SEASON); }), MINS_PER_DAY / 2);
            cycleCount += 1;
            setTimeout(run, MS_PER_MIN);
        });
        yield run();
    });
}
exports.watchApi = watchApi;
//# sourceMappingURL=watch.js.map