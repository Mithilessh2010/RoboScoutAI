import { Season } from "@ftc-scout/common";
import { LoadType } from "../../ftc-api/watch";
export declare function loadAllMatches(season: Season, loadType: LoadType, eventCodes?: string[]): Promise<void>;
