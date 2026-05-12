// @ts-nocheck
import { Season, notEmpty } from "@ftc-scout/common";
import { getTeams } from "../../ftc-api/get-teams";
import { Team, teamFromApi } from "../schemas/Team";
import { connectDB } from "../mongodb";
import { markDataLoaded } from "../schemas/DataHasBeenLoaded";

export async function loadAllTeams(season: Season) {
    console.info(`Loading teams for season ${season}.`);
    await connectDB();

    let apiTeams = await getTeams(season);
    console.info(`Fetched teams.`);

    let dbTeams = apiTeams.map(teamFromApi).filter(notEmpty);
    console.info(`Adding teams to database.`);

    const bulkOps = dbTeams.map((team) => ({
        updateOne: {
            filter: { number: team.number },
            update: { $set: team },
            upsert: true,
        },
    }));

    if (bulkOps.length > 0) {
        await Team.bulkWrite(bulkOps);
    }

    await markDataLoaded(season, "teams");
    console.info(`Finished loading teams.`);
}
