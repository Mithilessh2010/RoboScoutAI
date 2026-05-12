import { Season } from "@ftc-scout/common";
import { connectDB } from "../mongodb";

export async function loadFutureEvents(season: Season) {
    await connectDB();
    console.info(`Loading future events for ${season}`);
}
