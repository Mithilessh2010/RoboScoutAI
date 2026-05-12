// @ts-nocheck
/**
 * Updated loader for MongoDB
 * Replaces packages/server/src/db/loaders/load-all-teams.ts
 */
import { CURRENT_SEASON, Season, notEmpty } from "@ftc-scout/common";
import { getTeams } from "../../ftc-api/get-teams";
import { Team, teamFromApi } from "../schemas/Team";
import { DataHasBeenLoaded } from "../schemas/DataHasBeenLoaded";

export async function loadAllTeams(season: Season) {
    console.info(`Loading teams for season ${season}.`);

    let apiTeams = await getTeams(season);
    console.info(`Fetched teams.`);

    let dbTeams = apiTeams.map(teamFromApi).filter(notEmpty);
    console.info(`Adding teams to database.`);

    // Batch upsert teams
    const bulkOps = (dbTeams as any[]).map((team) => ({
        updateOne: {
            filter: { number: (team as any).number },
            update: { $set: team },
            upsert: true,
        },
    }));

    if (bulkOps.length > 0) {
        await Team.bulkWrite(bulkOps);
    }

    // Mark as loaded
    await DataHasBeenLoaded.create({ season, teams: true }).save();

    console.info(`Finished loading teams.`);
}
