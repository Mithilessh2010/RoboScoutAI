// @ts-nocheck
import { Season } from "@ftc-scout/common";
import { markDataLoaded } from "../schemas/DataHasBeenLoaded";
import { Match } from "../schemas/Match";
import { TeamMatchParticipation } from "../schemas/TeamMatchParticipation";
import { connectDB } from "../mongodb";
import { LoadType } from "../../ftc-api/watch";

export async function loadAllMatches(season: Season, loadType: LoadType) {
    console.info(`Loading matches for season ${season}. (${loadType})`);
    await connectDB();
    // Simplified loader - full match loading would require complex FTC API integration
    // This is a placeholder for the actual implementation
    console.info(`Finished loading matches.`);
}
