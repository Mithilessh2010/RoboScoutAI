import { Event, eventFromApi } from "../schemas/Event";
import { Season, notEmpty } from "@ftc-scout/common";
import { markDataLoaded } from "../schemas/DataHasBeenLoaded";
import { getAllEvents } from "../../ftc-api/get-events";
import { connectDB } from "../mongodb";

export async function loadAllEvents(season: Season) {
    console.info(`Loading events for season ${season}.`);
    await connectDB();

    let apiEvents = await getAllEvents(season);
    console.info(`Fetched events.`);

    let dbEvents = apiEvents.map((api) => eventFromApi(api)).filter(notEmpty);
    console.info(`Adding events to database.`);

    const bulkOps = dbEvents.map((event) => ({
        updateOne: {
            filter: { season: event.season, code: event.code },
            update: { $set: event },
            upsert: true,
        },
    }));

    if (bulkOps.length > 0) {
        await Event.bulkWrite(bulkOps);
    }

    await markDataLoaded(season, "events");
    console.info(`Finished loading events.`);
}
