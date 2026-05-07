import { Season } from "@ftc-scout/common";
type RefreshResult = {
    refreshed: boolean;
    skippedReason?: string;
};
export declare function refreshLiveStats(season: Season, eventCode?: string): Promise<RefreshResult>;
export {};
