import * as core from "express-serve-static-core";
import { Season } from "@ftc-scout/common";
export declare function setupBannerRoutes(app: core.Express): void;
export declare function eventBanner(season: Season, code: string, res: core.Response): Promise<void>;
