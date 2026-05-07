export declare const LoadType: {
    Full: string;
    Partial: string;
};
export type LoadType = (typeof LoadType)[keyof typeof LoadType];
export declare function fetchAllSeasonBasics(): Promise<void>;
export declare function fetchHistoricalStats(): Promise<void>;
export declare function watchApi(): Promise<void>;
