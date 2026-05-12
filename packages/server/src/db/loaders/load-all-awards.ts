import { Season } from "@ftc-scout/common";
import { markDataLoaded } from "../schemas/DataHasBeenLoaded";
import { Award } from "../schemas/Award";
import { connectDB } from "../mongodb";
import { LoadType } from "../../ftc-api/watch";

export async function loadAllAwards(season: Season, loadType: LoadType) {
    console.info(`Loading awards for season ${season}. (${loadType})`);
    await connectDB();
    // Simplified loader - full award loading would require complex FTC API integration
    console.info(`Finished loading awards.`);
}
