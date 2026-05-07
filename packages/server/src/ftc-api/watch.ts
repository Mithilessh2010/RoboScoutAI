import { CURRENT_SEASON, PAST_SEASONS, Season } from "@ftc-scout/common";
import { DataHasBeenLoaded } from "../db/entities/DataHasBeenLoaded";
import { loadAllTeams } from "../db/loaders/load-all-teams";
import { loadAllEvents } from "../db/loaders/load-all-events";
import { loadAllMatches } from "../db/loaders/load-all-matches";
import { loadAllAwards } from "../db/loaders/load-all-awards";
import { loadFutureEvents } from "../db/loaders/load-future-events";

export const LoadType = {
    Full: "Full",
    Partial: "Partial",
};
export type LoadType = (typeof LoadType)[keyof typeof LoadType];

async function runSyncStep(label: string, fn: () => Promise<void>): Promise<boolean> {
    try {
        await fn();
        return true;
    } catch (e) {
        console.error(`!!! ERROR LOADING ${label} !!!`);
        console.error(e);
        return false;
    }
}

async function fetchSeasonBasics(season: Season) {
    console.info(`Checking season ${season} basics.`);

    if (!(await DataHasBeenLoaded.teamsHaveBeenLoaded(season))) {
        await runSyncStep(`teams for season ${season}`, async () => {
            await loadAllTeams(season);
        });
    } else {
        console.info(`Teams already loaded.`);
    }

    if (!(await DataHasBeenLoaded.eventsHaveBeenLoaded(season))) {
        await runSyncStep(`events for season ${season}`, async () => {
            await loadAllEvents(season);
        });
    } else {
        console.info(`Events already loaded.`);
    }
}

export async function fetchAllSeasonBasics() {
    await fetchSeasonBasics(CURRENT_SEASON);

    for (let season of PAST_SEASONS) {
        await fetchSeasonBasics(season);
    }
}

export async function fetchHistoricalStats() {
    let seasonsNewestFirst = [CURRENT_SEASON, ...[...PAST_SEASONS].reverse()];

    for (let season of seasonsNewestFirst) {
        console.info(`Checking stats load of season ${season}.`);

        if (!(await DataHasBeenLoaded.matchesHaveBeenLoaded(season))) {
            await runSyncStep(`matches for season ${season}`, async () => {
                await loadAllMatches(season, LoadType.Full);
            });
        } else {
            console.info(`Matches already loaded.`);
        }
        if (!(await DataHasBeenLoaded.awardsHaveBeenLoaded(season))) {
            await runSyncStep(`awards for season ${season}`, async () => {
                await loadAllAwards(season, LoadType.Full);
            });
        } else {
            console.info(`Awards already loaded.`);
        }
    }
}

export async function watchApi() {
    let cycleCount = 0;

    const runJob = async (fn: Function, interval: number) => {
        if (cycleCount % interval == 0) {
            try {
                await fn();
            } catch (e) {
                console.error("!!! ERROR LOADING DATA !!!");
                console.error(e);
            }
        }
    };

    const MS_PER_MIN = 60 * 1000;
    const MINS_PER_HOUR = 60;
    const MINS_PER_DAY = MINS_PER_HOUR * 24;

    const run = async () => {
        console.info(`Syncing. (Cycle ${cycleCount})`);
        await runJob(async () => await loadAllTeams(CURRENT_SEASON), MINS_PER_DAY);
        await runJob(async () => await loadAllEvents(CURRENT_SEASON), MINS_PER_HOUR);
        await runJob(async () => await loadAllMatches(CURRENT_SEASON, LoadType.Partial), 1);
        await runJob(async () => await loadAllMatches(CURRENT_SEASON, LoadType.Full), MINS_PER_DAY);
        await runJob(async () => await loadAllAwards(CURRENT_SEASON, LoadType.Partial), 5);
        await runJob(async () => await loadAllAwards(CURRENT_SEASON, LoadType.Full), MINS_PER_HOUR);
        await runJob(async () => await loadFutureEvents(CURRENT_SEASON), MINS_PER_DAY / 2);

        cycleCount += 1;
        setTimeout(run, MS_PER_MIN);
    };

    run();
}
